# Implementation Plan: Habit Today Day Navigation + Multi-Completion Daily Target

**Date:** 2026-04-13
**Issues:** bp-uv4 (GH-#10), bp-0df (GH-#11)
**Design:** `docs/plans/2026-04-13-habit-nav-multicompletion-design.md`

---

## Pre-requisites

- MCP Supabase harus terkoneksi: jalankan `mcp__better-planner__list_tables` untuk verifikasi
- Branch: kerjakan di `master` atau buat feature branch

---

## Task 1 — DB Migration

**File baru:** `supabase/migrations/20260413000001_habit_daily_target.sql`

```sql
-- Add daily_target to habits (1 = binary on/off, >1 = multi-completion per day)
ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS daily_target INTEGER NOT NULL DEFAULT 1;

-- Drop the UNIQUE constraint to allow multiple completions per day
ALTER TABLE habit_completions
  DROP CONSTRAINT IF EXISTS habit_completions_habit_id_date_key;

-- Add index for efficient count queries per habit+date
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date
  ON habit_completions (habit_id, date);
```

**Apply via MCP:**
```
mcp__better-planner__apply_migration
  name: "habit_daily_target"
  query: <isi SQL di atas>
```

**Checkpoint:** Jalankan `mcp__better-planner__execute_sql` dengan query:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'habits' AND column_name = 'daily_target';
```
Expected: 1 row returned.

---

## Task 2 — Update Types

**File:** `src/types/habit.ts`

Tambah `daily_target` di dua interface:

```typescript
// Di interface Habit, setelah baris monthly_goal:
daily_target: number; // 1 = single completion, >1 = multi per day

// Di interface HabitFormInput, setelah baris monthly_goal:
daily_target?: number; // defaults to 1
```

**Checkpoint:** `npm run type-check` — pastikan 0 errors setelah task ini.

---

## Task 3 — Update Habits Logic

**File:** `src/app/(admin)/habits/actions/habits/logic.ts`

**Di `toHabit()` function**, tambah field `daily_target`:
```typescript
daily_target: row.daily_target ?? 1,
```

**Di `parseHabitFormInput()` function**, tambah parsing sebelum `return`:
```typescript
const daily_target = Number(input.daily_target ?? 1);
if (!Number.isInteger(daily_target) || daily_target < 1 || daily_target > 99) {
  throw new Error('daily_target must be between 1 and 99');
}
```
Dan sertakan `daily_target` di return object.

**File:** `src/app/(admin)/habits/actions/habits/queries.ts`

Di `insertHabit` dan `updateHabitById`, tambah `daily_target` ke payload insert/update. Cek apakah sudah pakai spread `...input` atau manual field — kalau manual, tambah `daily_target: input.daily_target`.

**Checkpoint:** `npm run type-check` — 0 errors.

---

## Task 4 — Update Completions Queries

**File:** `src/app/(admin)/habits/actions/completions/queries.ts`

Tambah dua fungsi baru di akhir file:

```typescript
// Count how many times a habit was completed on a specific date
export async function countCompletionsForDate(
  supabase: SupabaseClient,
  habitId: string,
  userId: string,
  date: string
): Promise<number> {
  const { count, error } = await supabase
    .from('habit_completions')
    .select('*', { count: 'exact', head: true })
    .eq('habit_id', habitId)
    .eq('user_id', userId)
    .eq('date', date);
  if (error) throw error;
  return count ?? 0;
}

// Remove the most recent completion for a habit on a date (for decrement)
export async function deleteLastCompletion(
  supabase: SupabaseClient,
  habitId: string,
  userId: string,
  date: string
): Promise<void> {
  const { data, error } = await supabase
    .from('habit_completions')
    .select('id')
    .eq('habit_id', habitId)
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return;
  const { error: delError } = await supabase
    .from('habit_completions')
    .delete()
    .eq('id', data.id);
  if (delError) throw delError;
}
```

---

## Task 5 — Update Completions Actions

**File:** `src/app/(admin)/habits/actions/completions/actions.ts`

Tambah import `deleteLastCompletion` dari queries.

Tambah dua server actions baru (jangan hapus `toggleCompletion` yang existing — masih dipakai monthly view):

```typescript
export async function incrementCompletion(
  habitId: string,
  date: string,
  currentCount: number,
  dailyTarget: number
): Promise<{ count: number }> {
  if (currentCount >= dailyTarget) return { count: currentCount };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const todayWIB = getTodayWIB();
  if (date > todayWIB) throw new Error('Cannot complete a future date');

  await insertCompletion(supabase, habitId, user.id, date);
  revalidateAll();
  return { count: currentCount + 1 };
}

export async function decrementCompletion(
  habitId: string,
  date: string,
  currentCount: number
): Promise<{ count: number }> {
  if (currentCount <= 0) return { count: 0 };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  await deleteLastCompletion(supabase, habitId, user.id, date);
  revalidateAll();
  return { count: currentCount - 1 };
}
```

---

## Task 6 — Update useHabitCompletions Hook

**File:** `src/app/(admin)/habits/hooks/useHabitCompletions.ts`

Import tambahan:
```typescript
import { incrementCompletion, decrementCompletion } from '../actions/completions/actions';
```

Tambah helper `getCount` dan update `isCompleted` signature, serta tambah `increment`/`decrement` functions:

```typescript
// Count completions in local data (no extra fetch)
const getCount = (habitId: string, date: string): number => {
  return completions.filter(c => c.habit_id === habitId && c.date === date).length;
};

// isCompleted: true if count >= dailyTarget
const isCompleted = (habitId: string, date: string, dailyTarget = 1): boolean => {
  return getCount(habitId, date) >= dailyTarget;
};

const increment = async (habitId: string, date: string, currentCount: number, dailyTarget: number): Promise<void> => {
  // Optimistic: add a fake row
  mutate((current = []) => [
    ...current,
    {
      id: `opt-${Date.now()}`,
      habit_id: habitId,
      user_id: '',
      date,
      note: null,
      created_at: new Date().toISOString(),
    },
  ], false);
  try {
    await incrementCompletion(habitId, date, currentCount, dailyTarget);
    await mutate();
  } catch (err) {
    console.error('Failed to increment:', err);
    await mutate();
    throw err;
  }
};

const decrement = async (habitId: string, date: string, currentCount: number): Promise<void> => {
  // Optimistic: remove last matching row
  mutate((current = []) => {
    const idx = [...current].reverse().findIndex(c => c.habit_id === habitId && c.date === date);
    if (idx === -1) return current;
    const realIdx = current.length - 1 - idx;
    return [...current.slice(0, realIdx), ...current.slice(realIdx + 1)];
  }, false);
  try {
    await decrementCompletion(habitId, date, currentCount);
    await mutate();
  } catch (err) {
    console.error('Failed to decrement:', err);
    await mutate();
    throw err;
  }
};
```

Update return object:
```typescript
return {
  completions,
  isLoading,
  error: error?.message as string | undefined,
  toggleCompletion,   // keep for monthly view compat
  isCompleted,
  getCount,
  increment,
  decrement,
  mutate,
};
```

**Checkpoint:** `npm run type-check` — 0 errors.

---

## Task 7 — Day Navigation: Update today/page.tsx

**File:** `src/app/(admin)/habits/today/page.tsx`

**Ganti** `todayDate` dari `useMemo` menjadi dua state: `todayDate` (fixed) dan `selectedDate` (navigable).

```typescript
// Fixed: today's date in WIB
const todayDate = useMemo(
  () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }),
  []
);

// Navigable selected date
const [selectedDate, setSelectedDate] = useState(todayDate);

const isToday = selectedDate === todayDate;

const selectedYear = useMemo(() => parseInt(selectedDate.slice(0, 4)), [selectedDate]);
const selectedMonth = useMemo(() => parseInt(selectedDate.slice(5, 7)), [selectedDate]);

const goToPrevDay = () => {
  const d = new Date(selectedDate + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  setSelectedDate(d.toLocaleDateString('en-CA'));
};

const goToNextDay = () => {
  if (isToday) return;
  const d = new Date(selectedDate + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  setSelectedDate(d.toLocaleDateString('en-CA'));
};
```

Update hook call untuk pakai `selectedYear`, `selectedMonth`:
```typescript
const {
  completions,
  isCompleted,
  getCount,
  increment,
  decrement,
  toggleCompletion,
  isLoading: completionsLoading,
} = useHabitCompletions(selectedYear, selectedMonth);
```

Update stats untuk pakai `selectedDate`:
```typescript
const todayCompleted = habits.filter((h) =>
  isCompleted(h.id, selectedDate, h.daily_target)
).length;
```

**Ganti header** dengan navigation UI:
```tsx
{/* Day navigation header */}
<div className="flex items-center justify-between flex-wrap gap-2">
  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
    Habits
  </h1>
  <div className="flex items-center gap-3">
    {/* Day navigation */}
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={goToPrevDay}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Previous day"
      >
        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="text-center min-w-[130px]">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {displayDate}
        </span>
      </div>
      <button
        type="button"
        onClick={goToNextDay}
        disabled={isToday}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next day"
      >
        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
    {/* Back to today button */}
    {!isToday && (
      <button
        type="button"
        onClick={() => setSelectedDate(todayDate)}
        className="text-xs px-2 py-1 rounded-md bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
      >
        Hari Ini
      </button>
    )}
    {/* Add Habit button */}
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Add Habit
    </button>
  </div>
</div>
```

Update `<TodayHabitList>` props:
```tsx
<TodayHabitList
  habits={habits}
  isCompleted={isCompleted}
  onToggle={toggleCompletion}
  onIncrement={increment}
  onDecrement={decrement}
  getCount={getCount}
  monthlyStats={monthlyStats}
  selectedDate={selectedDate}
  isEditableDate={selectedDate <= todayDate}
/>
```

---

## Task 8 — Update TodayHabitList Props

**File:** `src/components/habits/TodayHabitList.tsx`

Update interface props (cari baris `interface TodayHabitListProps` atau `type TodayHabitListProps`):

```typescript
interface TodayHabitListProps {
  habits: Habit[];
  isCompleted: (habitId: string, date: string, dailyTarget?: number) => boolean;
  onToggle: (habitId: string, date: string) => Promise<void>;
  onIncrement: (habitId: string, date: string, currentCount: number, dailyTarget: number) => Promise<void>;
  onDecrement: (habitId: string, date: string, currentCount: number) => Promise<void>;
  getCount: (habitId: string, date: string) => number;
  monthlyStats: MonthlyStats | null;
  selectedDate: string;        // was todayDate
  isEditableDate: boolean;
}
```

Ganti semua referensi `todayDate` → `selectedDate` di dalam component body.

Pass props baru ke `<TodayHabitItem>`:
```tsx
<TodayHabitItem
  habit={habit}
  isCompleted={isCompleted(habit.id, selectedDate, habit.daily_target)}
  count={getCount(habit.id, selectedDate)}
  onToggle={() => onToggle(habit.id, selectedDate)}
  onIncrement={() => onIncrement(habit.id, selectedDate, getCount(habit.id, selectedDate), habit.daily_target)}
  onDecrement={() => onDecrement(habit.id, selectedDate, getCount(habit.id, selectedDate))}
  isEditableDate={isEditableDate}
  streak={perHabitStats?.current_streak ?? 0}
/>
```

---

## Task 9 — Update TodayHabitItem Counter UI

**File:** `src/components/habits/TodayHabitItem.tsx`

Update props interface:
```typescript
interface TodayHabitItemProps {
  habit: Habit;
  isCompleted: boolean;
  count: number;
  onToggle: () => Promise<void>;
  onIncrement: () => Promise<void>;
  onDecrement: () => Promise<void>;
  isEditableDate: boolean;
  streak: number;
}
```

Ganti bagian tombol completion dengan conditional rendering:

```tsx
{/* Right side: completion control */}
<div className="flex items-center gap-2 shrink-0">
  {habit.daily_target > 1 ? (
    // Multi-completion UI
    <>
      {/* Dot progress (max 10 dots) */}
      {habit.daily_target <= 10 && (
        <div className="flex gap-0.5">
          {Array.from({ length: habit.daily_target }).map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < count
                  ? 'bg-green-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      )}
      {/* Count text */}
      <span className={`text-xs font-medium min-w-[28px] text-center ${
        isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
      }`}>
        {count}/{habit.daily_target}
      </span>
      {/* Decrement button */}
      {isEditableDate && count > 0 && (
        <button
          type="button"
          onClick={onDecrement}
          className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-base leading-none"
          aria-label="Kurangi"
        >
          −
        </button>
      )}
      {/* Increment button */}
      {isEditableDate && count < habit.daily_target && (
        <button
          type="button"
          onClick={onIncrement}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors text-base leading-none"
          aria-label="Tambah"
        >
          +
        </button>
      )}
      {/* Done checkmark */}
      {isCompleted && (
        <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </>
  ) : (
    // Original binary checkbox UI (daily_target === 1)
    <button
      type="button"
      onClick={isEditableDate ? onToggle : undefined}
      disabled={!isEditableDate}
      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
        isCompleted
          ? 'bg-green-500 border-green-500 text-white'
          : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
      } ${!isEditableDate ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
      aria-label={isCompleted ? 'Tandai belum selesai' : 'Tandai selesai'}
    >
      {isCompleted && (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  )}
</div>
```

---

## Task 10 — Update HabitForm (daily_target field)

**File:** `src/components/habits/HabitForm.tsx`

Tambah field `daily_target` di form state (cari `useState` atau `useForm` initialization):
```typescript
daily_target: initialData?.daily_target ?? 1,
```

Tambah input field di JSX (letakkan setelah `monthly_goal` field):
```tsx
{/* Daily Target */}
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    Berapa kali per hari?
  </label>
  <input
    type="number"
    min={1}
    max={99}
    value={form.daily_target ?? 1}
    onChange={(e) => setForm({ ...form, daily_target: Math.max(1, parseInt(e.target.value) || 1) })}
    className="w-24 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
  />
  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
    1 = satu kali sehari (on/off), lebih dari 1 = bisa dikerjakan berkali-kali
  </p>
</div>
```

---

## Task 11 — Update HabitFormModal

**File:** `src/components/habits/HabitFormModal.tsx`

Pastikan `daily_target` ikut dikirim saat `onAdd` dan `onUpdate` dipanggil. Jika form data sudah di-spread dari HabitForm, tidak perlu perubahan — cek saja bahwa `HabitFormInput` sudah include `daily_target` (sudah di Task 2).

---

## Final Verification

```bash
# 1. Type check
npm run type-check
# Expected: 0 errors

# 2. Format
npm run format

# 3. Build check
npm run build
# Expected: no build errors
```

**Manual test checklist:**

**Day Navigation:**
- [ ] Today view tampil dengan header `< Senin, 13 Apr 2026 >` (format sesuai locale)
- [ ] Tombol `>` di-disable (grey/opacity) ketika di hari ini
- [ ] Klik `<` → pindah ke kemarin, tombol `>` aktif, muncul "Hari Ini"
- [ ] Klik "Hari Ini" → kembali ke hari ini
- [ ] Navigasi ke bulan lain → completions-nya sesuai bulan tersebut
- [ ] Habit di hari lampau bisa di-toggle/increment/decrement

**Multi-Completion:**
- [ ] Buat habit baru dengan daily_target=3 → simpan berhasil
- [ ] Today view: habit tersebut tampil `○○○ 0/3` + tombol `+`
- [ ] Tap `+` → `●○○ 1/3`, tap lagi → `●●○ 2/3`, tap lagi → `●●● 3/3 ✓`, tombol `+` hilang
- [ ] Tap `−` → count kembali 2/3
- [ ] Habit dengan daily_target=1 → checkbox UI lama tetap tidak berubah
- [ ] Edit habit: field "Berapa kali per hari?" tampil dan tersimpan

**Streak (monthly view):**
- [ ] Habit daily_target=3 dengan 3 completions di satu hari → streak +1
- [ ] Habit daily_target=3 dengan 2 completions di satu hari → streak tidak +1
