import { NextRequest, NextResponse } from 'next/server';
import { addTask, getTasksForMilestone } from '@/app/(admin)/planning/quests/actions';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { milestone_id, title, parent_task_id, display_order } = await req.json();
    if (!milestone_id) {
      return NextResponse.json({ error: 'milestone_id wajib diisi' }, { status: 400 });
    }
    const formData = new FormData();
    formData.append('milestone_id', milestone_id);
    formData.append('title', title);
    if (parent_task_id) {
      formData.append('parent_task_id', parent_task_id);
    }
    if (display_order !== undefined) {
      formData.append('display_order', display_order);
    }
    const res = await addTask(formData);
    return NextResponse.json({ message: res?.message || 'Task berhasil ditambahkan!' });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) || 'Gagal menambah task' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parent_task_id = searchParams.get('parent_task_id');
  const milestone_id = searchParams.get('milestone_id');

  // Jika parent_task_id diberikan, ambil sub-tugas
  if (parent_task_id) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, status, display_order')
      .eq('parent_task_id', parent_task_id)
      .order('display_order', { ascending: true });
    if (error) {
      return NextResponse.json({ tasks: [], error: error.message }, { status: 500 });
    }
    return NextResponse.json({ tasks: data || [] });
  }

  // Jika milestone_id diberikan, ambil tugas utama
  if (milestone_id) {
    const tasks = await getTasksForMilestone(milestone_id);
    return NextResponse.json({ tasks });
  }

  return NextResponse.json({ tasks: [], error: 'milestone_id atau parent_task_id wajib diisi' }, { status: 400 });
} 