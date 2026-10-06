// NO "use server" — pure functions only
export type CarryOverType = 'DAILY_QUEST' | 'SIDE_QUEST' | 'WORK_QUEST';

export interface SourceTask {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  is_archived?: boolean | null;
  focus_duration?: number | null;
  repeat_days?: number[] | null;
  parent_task_id?: string | null;
  created_at: string;
}

export interface CarryOverChild {
  id: string;
  title: string;
  alreadyExists: boolean;
}

export interface CarryOverCandidate {
  id: string;                // id quest/project terbaru untuk judul ini
  title: string;
  source: { year: number; quarter: number };
  alreadyExists: boolean;    // daily/side: disabled. work: project sudah ada di target (task masuk ke sana)
  children: CarryOverChild[]; // work saja; lainnya []
}

export interface CarryOverGroup {
  year: number;
  quarter: number;
  candidates: CarryOverCandidate[];
}

const norm = (s: string) => s.trim().toLowerCase();

export function isCandidate(type: CarryOverType, t: SourceTask): boolean {
  if (type === 'DAILY_QUEST') return !t.is_archived;
  return t.status !== 'DONE';
}

/** Ambil satu per judul (ternormalisasi), yang created_at-nya paling baru. */
export function latestByTitle<T extends { title: string; created_at: string }>(rows: T[]): T[] {
  const map = new Map<string, T>();
  for (const row of rows) {
    const key = norm(row.title);
    const existing = map.get(key);
    if (!existing || new Date(row.created_at).getTime() > new Date(existing.created_at).getTime()) {
      map.set(key, row);
    }
  }
  return Array.from(map.values());
}

export function buildGroups(
  type: CarryOverType,
  sourceTop: SourceTask[],        // semua top-level sebelum quarter target
  sourceChildren: SourceTask[],   // anak dari semua sourceTop (work saja)
  targetTop: SourceTask[],        // top-level di quarter target
  targetChildren: SourceTask[],   // anak dari targetTop (work saja)
  quarterOf: (iso: string) => { year: number; quarter: number }
): CarryOverGroup[] {
  const validSourceTop = sourceTop.filter((t) => isCandidate(type, t));
  const latest = latestByTitle(validSourceTop);

  const targetTopByNorm = new Map<string, SourceTask>();
  for (const t of targetTop) {
    targetTopByNorm.set(norm(t.title), t);
  }

  const rawCandidates: (CarryOverCandidate & { created_at: string })[] = [];

  for (const p of latest) {
    const targetProject = targetTopByNorm.get(norm(p.title));
    const alreadyExists = !!targetProject;
    const sourceQuarter = quarterOf(p.created_at);

    if (type === 'WORK_QUEST') {
      const matchingProjects = validSourceTop.filter((t) => norm(t.title) === norm(p.title));
      const matchingProjectIds = new Set(matchingProjects.map((m) => m.id));

      const openChildren = sourceChildren.filter(
        (c) => c.parent_task_id && matchingProjectIds.has(c.parent_task_id) && c.status !== 'DONE'
      );
      const latestChildren = latestByTitle(openChildren);

      const existingChildTitles = new Set<string>();
      if (targetProject) {
        for (const tc of targetChildren) {
          if (tc.parent_task_id === targetProject.id) {
            existingChildTitles.add(norm(tc.title));
          }
        }
      }

      const children: CarryOverChild[] = latestChildren.map((c) => ({
        id: c.id,
        title: c.title,
        alreadyExists: existingChildTitles.has(norm(c.title)),
      }));

      // Buang kandidat work yang alreadyExists dan semua child-nya alreadyExists
      const allChildrenExist = children.length === 0 || children.every((c) => c.alreadyExists);
      if (alreadyExists && allChildrenExist) {
        continue;
      }

      rawCandidates.push({
        id: p.id,
        title: p.title,
        source: sourceQuarter,
        alreadyExists,
        children,
        created_at: p.created_at,
      });
    } else {
      rawCandidates.push({
        id: p.id,
        title: p.title,
        source: sourceQuarter,
        alreadyExists,
        children: [],
        created_at: p.created_at,
      });
    }
  }

  // Kelompokkan per quarterOf(p.created_at), urut quarter terbaru dulu. Di dalam grup urut created_at naik.
  const groupMap = new Map<string, { year: number; quarter: number; candidates: (CarryOverCandidate & { created_at: string })[] }>();

  for (const c of rawCandidates) {
    const key = `${c.source.year}-${c.source.quarter}`;
    let g = groupMap.get(key);
    if (!g) {
      g = { year: c.source.year, quarter: c.source.quarter, candidates: [] };
      groupMap.set(key, g);
    }
    g.candidates.push(c);
  }

  const sortedGroups = Array.from(groupMap.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.quarter - a.quarter;
  });

  return sortedGroups.map((g) => ({
    year: g.year,
    quarter: g.quarter,
    candidates: g.candidates
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(({ created_at, ...cand }) => cand),
  }));
}

export function buildCopyRow(type: CarryOverType, t: SourceTask, userId: string, createdAt: string, parentId: string | null = null) {
  const row: Record<string, unknown> = {
    user_id: userId,
    title: t.title,
    description: t.description ?? null,
    type,
    status: 'TODO',
    milestone_id: null,
    parent_task_id: parentId,
    created_at: createdAt,
  };
  if (type === 'DAILY_QUEST') {
    row.focus_duration = t.focus_duration ?? 25;
    row.repeat_days = t.repeat_days ?? null;
  }
  return row;
}
