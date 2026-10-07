import React from 'react';
import Checkbox from '@/components/form/input/Checkbox';

interface QuestPickRowProps {
  title: string;
  subtitle?: string;
  selected: boolean;
  done?: boolean;
  /** false = induk virtual tanpa kotak centang. */
  showCheckbox?: boolean;
  disabled?: boolean;
  onToggle: () => void;
  /** Slot kiri (w-4): tombol panah, atau spacer supaya sejajar. */
  chevron?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const ChevronButton: React.FC<{ expanded: boolean; onClick: () => void }> = ({ expanded, onClick }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
  >
    <svg
      className={`w-3 h-3 transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </button>
);

export const ChevronSpacer = () => <div className="w-4 h-4" />;

/** Baris pilih quest yang sama di semua modal. Klik kotak ATAU judul = toggle sekali. */
const QuestPickRow: React.FC<QuestPickRowProps> = ({
  title, subtitle, selected, done, showCheckbox = true, disabled, onToggle, chevron, trailing,
}) => (
  <div
    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
      selected ? 'bg-brand-50 dark:bg-brand-500/15' : 'hover:bg-gray-50 dark:hover:bg-white/5'
    }`}
  >
    {chevron}
    {showCheckbox ? (
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onChange={onToggle} disabled={disabled} />
      </div>
    ) : (
      <div className="w-5 h-5" />
    )}
    <div className="flex-1 min-w-0">
      <div
        onClick={() => { if (!disabled) onToggle(); }}
        className={`text-sm font-medium cursor-pointer select-none ${
          done ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'
        }`}
      >
        {title}
      </div>
      {subtitle && <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>}
    </div>
    {trailing}
  </div>
);

export default QuestPickRow;
