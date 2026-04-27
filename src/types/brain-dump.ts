export interface BrainDumpItem {
  id: string
  user_id: string
  date: string        // YYYY-MM-DD — dipakai sebagai unique key per hari per user
  content: string
  created_at: string
  updated_at: string
}
