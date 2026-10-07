import React from 'react';
import Button from '@/components/ui/button/Button';

interface QuestPickerShellProps {
  title: string;
  selectedCount: number;
  completedTodayCount?: number;
  onClose: () => void;
  onSave: () => void;
  tabs?: React.ReactNode;
  saveDisabled?: boolean;
  cancelDisabled?: boolean;
  saving?: boolean;
  children: React.ReactNode;
}

/** Kerangka bersama empat modal pilih quest (HFG, Work, Side, Daily). */
const QuestPickerShell: React.FC<QuestPickerShellProps> = ({
  title, selectedCount, completedTodayCount = 0, onClose, onSave, tabs,
  saveDisabled, cancelDisabled, saving, children,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] flex flex-col">
      <div className="flex items-start justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Dipilih: {selectedCount}
            {completedTodayCount > 0 && ` · Selesai hari ini: ${completedTodayCount}`}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {tabs}

      <div className="flex-1 overflow-y-auto">{children}</div>

      <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4 flex justify-end gap-3 flex-shrink-0">
        <Button onClick={onClose} disabled={cancelDisabled} variant="outline" size="md">
          Batal
        </Button>
        <Button
          onClick={onSave}
          disabled={saveDisabled}
          loading={saving}
          loadingText="Menyimpan..."
          variant="primary"
          size="md"
        >
          Simpan
        </Button>
      </div>
    </div>
  </div>
);

export default QuestPickerShell;
