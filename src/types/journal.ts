import type { Energy } from '@/lib/energy';

export interface JournalEntry {
  id: string
  what_done: string | null
  what_think: string | null
  energy?: Energy | null
  created_at: string
  updated_at: string
}

export interface JournalData {
  whatDone: string
  whatThink: string
  energy?: Energy | null
}
