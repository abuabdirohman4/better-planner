import { NextRequest, NextResponse } from 'next/server';
import { updateTaskStatus } from '@/app/(admin)/planning/quests/actions';

export async function PATCH(req: NextRequest) {
  try {
    const { taskId, newStatus } = await req.json();
    if (!taskId || !newStatus) {
      return NextResponse.json({ error: 'taskId dan newStatus wajib diisi' }, { status: 400 });
    }
    const res = await updateTaskStatus(taskId, newStatus);
    return NextResponse.json({ message: res?.message || 'Status task berhasil diupdate!' });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) || 'Gagal update status' }, { status: 500 });
  }
} 