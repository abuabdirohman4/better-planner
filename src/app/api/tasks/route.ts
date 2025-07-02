import { NextRequest, NextResponse } from 'next/server';
import { addTask, getTasksForMilestone } from '@/app/(admin)/planning/quests/actions';

export async function POST(req: NextRequest) {
  try {
    const { milestone_id, title } = await req.json();
    if (!milestone_id || !title) {
      return NextResponse.json({ error: 'milestone_id dan title wajib diisi' }, { status: 400 });
    }
    const formData = new FormData();
    formData.append('milestone_id', milestone_id);
    formData.append('title', title);
    const res = await addTask(formData);
    return NextResponse.json({ message: res?.message || 'Task berhasil ditambahkan!' });
  } catch (err) {
    return NextResponse.json({ error: err || 'Gagal menambah task' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const milestone_id = searchParams.get('milestone_id');
  if (!milestone_id) {
    return NextResponse.json({ tasks: [], error: 'milestone_id wajib diisi' }, { status: 400 });
  }
  const tasks = await getTasksForMilestone(milestone_id);
  return NextResponse.json({ tasks });
} 