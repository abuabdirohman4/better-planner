import { NextRequest, NextResponse } from 'next/server';
import { addMilestone, getMilestonesForQuest } from '@/app/(admin)/planning/quests/actions';

export async function POST(req: NextRequest) {
  try {
    const { quest_id, title } = await req.json();
    if (!quest_id || !title) {
      return NextResponse.json({ error: 'quest_id dan title wajib diisi' }, { status: 400 });
    }
    const formData = new FormData();
    formData.append('quest_id', quest_id);
    formData.append('title', title);
    const res = await addMilestone(formData);
    return NextResponse.json({ message: res.message });
  } catch (err) {
    return NextResponse.json({ error: err || 'Gagal menambah task' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const quest_id = searchParams.get('quest_id');
  if (!quest_id) {
    return NextResponse.json({ milestones: [], error: 'quest_id wajib diisi' }, { status: 400 });
  }
  const milestones = await getMilestonesForQuest(quest_id);
  return NextResponse.json({ milestones });
} 