# app-0ank — Tambah side quest di halaman Side Quests

## Masalah

Side quest hanya bisa dibuat dari Daily Sync (`addSideQuest` di
`src/app/(admin)/execution/daily-sync/DailyQuest/actions/side-quest/actions.ts`), yang
sekaligus memasukkannya ke daily plan hari itu. Halaman `/quests/side-quests` tidak punya
tombol tambah.

## Latar teknis yang wajib dipahami

Quest **tidak punya kolom quarter**. Semua quest (daily/work/side) masuk ke quarter lewat
`tasks.created_at` yang jatuh di rentang `getQuarterDates(year, quarter)`
(`src/lib/quarterUtils.ts:135`). Insert biasa memakai `created_at = now()` dari DB.

Akibatnya, kalau Abu sedang melihat quarter lain (mis. Q4 sebelum mulai) lalu menambah quest,
quest itu jatuh ke quarter hari ini dan tidak muncul di layar. Plan ini menambah helper
`createdAtForQuarter` yang menghitung `created_at` sesuai quarter yang dilihat. Helper yang
sama dipakai `app-uq5a` (bawa quest dari quarter lalu).

## Keputusan

- Side quest dari halaman ini **tidak** otomatis masuk daily plan (beda dari Daily Sync).
- UI form meniru add form di `DailyQuestList.tsx:121-148` (input + tombol `Tambah`).

---

## Task 1 — Helper `createdAtForQuarter` (TDD)

**File test baru:** `src/lib/__tests__/quarterUtils.createdAt.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { createdAtForQuarter, getQuarterDates } from '@/lib/quarterUtils';

describe('createdAtForQuarter', () => {
  it('memakai waktu sekarang kalau sekarang di dalam quarter itu', () => {
    const { startDate } = getQuarterDates(2026, 3);
    const now = new Date(startDate.getTime() + 5 * 86400000);
    expect(createdAtForQuarter(2026, 3, now)).toBe(now.toISOString());
  });

  it('memakai awal quarter kalau quarter itu di masa depan', () => {
    const { startDate } = getQuarterDates(2026, 4);
    const now = new Date(startDate.getTime() - 86400000);
    expect(createdAtForQuarter(2026, 4, now)).toBe(startDate.toISOString());
  });

  it('memakai awal quarter kalau quarter itu sudah lewat', () => {
    const { startDate, endDate } = getQuarterDates(2026, 2);
    const now = new Date(endDate.getTime() + 30 * 86400000);
    expect(createdAtForQuarter(2026, 2, now)).toBe(startDate.toISOString());
  });
});
```

Jalankan `npx vitest run src/lib/__tests__/quarterUtils.createdAt.test.ts` → **FAIL** (fungsi belum ada).

**Implementasi:** tambahkan tepat di bawah `getQuarterDates` (`src/lib/quarterUtils.ts`, setelah baris ~150):

```ts
// Quest diikat ke quarter lewat created_at, jadi quest yang dibuat saat melihat quarter lain harus diberi tanggal di dalam quarter itu.
export function createdAtForQuarter(year: number, quarter: number, now: Date = new Date()): string {
  const { startDate, endDate } = getQuarterDates(year, quarter);
  if (now >= startDate && now <= endDate) return now.toISOString();
  return startDate.toISOString();
}
```

Jalankan ulang → **PASS**.

## Task 2 — Query + server action `createSideQuest` (TDD)

**`src/app/(admin)/quests/side-quests/actions/side-quest/queries.ts`** — tambah di akhir file:

```ts
export async function insertSideQuest(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  createdAt: string
) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, title, type: 'SIDE_QUEST', status: 'TODO', milestone_id: null, created_at: createdAt })
    .select()
    .single();
  if (error) throw error;
  return data;
}
```

**Test dulu** — tambahkan ke `.../side-quest/__tests__/actions.test.ts`:
- mock `@/lib/quarterUtils` di file itu sudah ada; tambahkan `createdAtForQuarter: vi.fn().mockReturnValue('2026-01-05T00:00:00.000Z')` ke objek mock.
- kasus: (a) throw `User not authenticated` kalau user null; (b) throw `Title is required` kalau title kosong/spasi; (c) sukses → builder `insert` dipanggil dengan objek yang memuat `created_at: '2026-01-05T00:00:00.000Z'` dan `type: 'SIDE_QUEST'`.

Pola mock ikuti test yang sudah ada di file itu (`makeQueryBuilder`, `makeSupabase` dari `@/test-utils/supabase-mock`). Cek `src/test-utils/supabase-mock.ts` untuk cara memeriksa argumen `insert`.

Jalankan `npx vitest run "src/app/(admin)/quests/side-quests"` → **FAIL**.

**`.../side-quest/actions.ts`** — tambah import `createdAtForQuarter` dari `@/lib/quarterUtils` dan `insertSideQuest` dari `./queries`, lalu:

```ts
export async function createSideQuest(title: string, year: number, quarter: number): Promise<SideQuest> {
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Title is required");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");
  const task = await insertSideQuest(supabase, user.id, trimmed, createdAtForQuarter(year, quarter));
  revalidatePath("/quests/side-quests");
  return task;
}
```

> Catatan urutan: validasi title dilakukan sebelum `createClient` — sesuaikan test (b) agar tidak perlu mock supabase.

Jalankan ulang → **PASS**.

## Task 3 — Hook `addQuest`

**`src/app/(admin)/quests/side-quests/hooks/useSideQuests.ts`**
- import `createSideQuest` dari `'../actions/sideQuestActions'` (file wrapper itu re-export `./side-quest/actions`, jadi otomatis ikut).
- tambah:

```ts
  const addQuest = async (title: string) => {
    const created = await createSideQuest(title, year, quarter);
    mutate((currentData) => [created, ...(currentData || [])], false);
  };
```

- kembalikan `addQuest` di objek return.

## Task 4 — Form di halaman

**`src/app/(admin)/quests/side-quests/page.tsx`**
- Header: ganti `justify-start` jadi `justify-between`, tambahkan `Button` (`@/components/ui/button/Button`) `Add Task` dengan `data-testid="side-quest-add-btn"`, persis seperti `daily-quests/page.tsx:33-41`.
- State: `isAdding` (form terbuka), `newTitle`, `isSaving`.
- Di dalam card, di atas `<SideQuestList>`, render form saat `isAdding` — salin markup `DailyQuestList.tsx:121-148` (kotak abu, judul `Tambah Side Quest Baru`, tombol X, input + `Button` `Tambah`). testid: `side-quest-new-title-input`, `side-quest-submit-btn`.
- Submit:

```ts
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSaving(true);
    try {
      await addQuest(newTitle);
      toast.success("Side quest ditambahkan");
      setNewTitle("");
      setIsAdding(false);
    } catch {
      toast.error("Gagal menambah side quest");
    } finally {
      setIsSaving(false);
    }
  };
```

(`toast` dari `sonner`.)

## Task 5 — Verifikasi

1. `npx vitest run src/lib "src/app/(admin)/quests/side-quests"` → semua PASS.
2. `npm run type-check` → 0 error.
3. Manual (`npm run dev`, port 5100): buka `/quests/side-quests` → Add Task → isi → Tambah. Quest muncul di atas daftar. Ganti selector quarter ke quarter berikutnya → tambah lagi → quest muncul di quarter itu, dan TIDAK muncul saat balik ke quarter sekarang.
4. Buka Daily Sync hari ini: side quest yang dibuat dari halaman ini tidak masuk daily plan (sesuai keputusan).

## Commit

```
feat(side-quests): tambah side quest langsung dari halaman (app-0ank)

fixes #16

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

## CLAUDE.md Check
- [ ] Pattern baru: `createdAtForQuarter` — catat di `docs/claude/business-rules.md` bagian quarter: "quest diikat ke quarter lewat created_at; insert quest dari UI yang tahu quarter aktif wajib pakai `createdAtForQuarter`".
- [ ] Tabel baru? Tidak.
- [ ] Route baru? Tidak.
- [ ] Permission pattern baru? Tidak.
