import { NextResponse } from 'next/server';
import { deleteTask } from '@/app/(admin)/planning/quests/actions';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    await deleteTask(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message || 'Failed to delete task' }, { status: 500 });
  }
} 