export type DayCode = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type ActivityCategory =
  | 'high_lifetime_value'
  | 'high_rupiah_value'
  | 'low_rupiah_value'
  | 'zero_rupiah_value'
  | 'transition';

export interface BestWeekTemplate {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BestWeekBlock {
  id: string;
  template_id: string;
  days: DayCode[];
  start_time: string;  // "HH:MM:SS" from Supabase TIME
  end_time: string;    // "HH:MM:SS"
  category: ActivityCategory;
  title: string;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

// Form data for BlockModal
export interface BlockFormData {
  title: string;
  category: ActivityCategory;
  days: DayCode[];
  start_time: string;  // "HH:MM" format for UI
  end_time: string;    // "HH:MM" format for UI
  description?: string;
}
