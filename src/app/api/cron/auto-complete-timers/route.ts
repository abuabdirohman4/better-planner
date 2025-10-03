// External cron endpoint for auto-completing timers
// This provides stronger guarantees for timer completion

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { completeTimerSession } from '@/app/(admin)/execution/daily-sync/PomodoroTimer/actions/timerSessionActions';

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET_TOKEN;
  
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    
    // Find all active timer sessions that should be completed
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const { data: activeSessions, error } = await supabase
      .from('timer_sessions')
      .select('*')
      .eq('status', 'FOCUSING')
      .gte('start_time', oneHourAgo.toISOString())
      .order('start_time', { ascending: false });

    if (error) {
      console.error('❌ Failed to fetch active sessions:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!activeSessions || activeSessions.length === 0) {
      return NextResponse.json({ 
        message: 'No active sessions found',
        completed: 0 
      });
    }

    let completedCount = 0;
    const results = [];

    for (const session of activeSessions) {
      try {
        // Calculate if session should be completed
        const startTime = new Date(session.start_time);
        const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        const targetDuration = session.target_duration_seconds;
        
        if (elapsedSeconds >= targetDuration) {
          // Complete the session
          await completeTimerSession(session.id);
          completedCount++;
          results.push({
            sessionId: session.id,
            taskId: session.task_id,
            taskTitle: session.task_title,
            elapsedSeconds,
            targetDuration,
            completed: true
          });
          
          console.log(`✅ Auto-completed session ${session.id} for task: ${session.task_title}`);
        } else {
          // Update with current elapsed time
          const { error: updateError } = await supabase
            .from('timer_sessions')
            .update({
              current_duration_seconds: Math.min(elapsedSeconds, targetDuration),
              updated_at: now.toISOString()
            })
            .eq('id', session.id);

          if (updateError) {
            console.error(`❌ Failed to update session ${session.id}:`, updateError);
          } else {
            results.push({
              sessionId: session.id,
              taskId: session.task_id,
              taskTitle: session.task_title,
              elapsedSeconds,
              targetDuration,
              completed: false,
              updated: true
            });
          }
        }
      } catch (sessionError) {
        console.error(`❌ Error processing session ${session.id}:`, sessionError);
        results.push({
          sessionId: session.id,
          taskId: session.task_id,
          taskTitle: session.task_title,
          error: sessionError instanceof Error ? sessionError.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${activeSessions.length} sessions`,
      completed: completedCount,
      updated: results.filter(r => r.updated).length,
      errors: results.filter(r => r.error).length,
      results
    });

  } catch (error) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
