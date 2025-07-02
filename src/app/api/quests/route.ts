import { NextRequest, NextResponse } from 'next/server';
import { getQuests } from '@/app/(admin)/planning/quests/actions';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get('year') || '0', 10);
  const quarter = parseInt(searchParams.get('quarter') || '0', 10);
  if (!year || !quarter) {
    return NextResponse.json({ quests: [], error: 'Invalid year or quarter' }, { status: 400 });
  }
  const quests = await getQuests(year, quarter, true);
  return NextResponse.json({ quests });
} 