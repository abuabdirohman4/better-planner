import type { ActivityCategory, DayCode } from './types';

export const CATEGORY_CONFIG: Record<ActivityCategory, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  high_lifetime_value: {
    label: 'High Lifetime Value',
    color: '#047857',
    bgColor: '#D1FAE5',
    borderColor: '#10B981',
    icon: '🌟',
  },
  high_rupiah_value: {
    label: 'High Rupiah Value',
    color: '#1E40AF',
    bgColor: '#DBEAFE',
    borderColor: '#3B82F6',
    icon: '💰',
  },
  low_rupiah_value: {
    label: 'Low Rupiah Value',
    color: '#D97706',
    bgColor: '#FEF3C7',
    borderColor: '#F59E0B',
    icon: '📋',
  },
  zero_rupiah_value: {
    label: 'Zero Rupiah Value',
    color: '#B91C1C',
    bgColor: '#FEE2E2',
    borderColor: '#EF4444',
    icon: '⛔',
  },
  transition: {
    label: 'Transition',
    color: '#6D28D9',
    bgColor: '#EDE9FE',
    borderColor: '#8B5CF6',
    icon: '⏸️',
  },
};

export const DAY_CODES: DayCode[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const DAY_LABELS: Record<DayCode, string> = {
  mon: 'Senin',
  tue: 'Selasa',
  wed: 'Rabu',
  thu: 'Kamis',
  fri: 'Jumat',
  sat: 'Sabtu',
  sun: 'Minggu',
};

export const DAY_SHORT_LABELS: Record<DayCode, string> = {
  mon: 'Sen',
  tue: 'Sel',
  wed: 'Rab',
  thu: 'Kam',
  fri: 'Jum',
  sat: 'Sab',
  sun: 'Min',
};

// Grid: 30-minute slots from 00:00 to 23:30
export const TIME_SLOTS: string[] = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2).toString().padStart(2, '0');
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour}:${min}`;
});
