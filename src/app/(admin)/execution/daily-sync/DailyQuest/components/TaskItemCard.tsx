import React, { useState, useEffect, useRef } from 'react';
import { ConfirmModal } from '@/components/ui/modal';
import { Clock, Swords, ListChecks, Trash2 } from 'lucide-react';
import { ScheduleManagementModal } from './ScheduleManagementModal';
import { useTaskSchedules } from '../hooks/useTaskSchedules';
import { useTaskSession } from '../hooks/useTaskSession';
import { TaskCardProps } from '../types';
import { playSound } from '@/lib/soundUtils';
import { useTimerStore } from '@/stores/timerStore';
import { useSoundStore } from '@/stores/soundStore';
import { kindLabel, CYCLES } from '../utils/dailyFocus';

// ✅ NEW: Reusable Menu Component
interface MenuProps {
  showMenu: boolean;
  setShowMenu: (show: boolean) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  isChecklistMode: boolean;
  onConvertToChecklist?: (itemId: string) => Promise<void>;
  onConvertToQuest?: (itemId: string) => Promise<void>;
  onRemove?: (itemId: string) => Promise<void>;
  setShowConfirmModal: (show: boolean) => void;
  itemId: string;
  itemType: string;
  setIsChecklistMode: (mode: boolean) => void;
  onSchedule: () => void;
}

const TaskItemMenu: React.FC<MenuProps> = ({
  showMenu,
  setShowMenu,
  menuRef,
  isChecklistMode,
  onConvertToChecklist,
  onConvertToQuest,
  onRemove,
  setShowConfirmModal,
  itemId,
  itemType,
  setIsChecklistMode,
  onSchedule
}) => {
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded transition-colors"
        title="Menu"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-0 top-8 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSchedule();
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Schedule Time
          </button>

          {isChecklistMode ? (
            onConvertToQuest && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  try {
                    await onConvertToQuest(itemId);
                    setIsChecklistMode(false);
                  } catch (error) {
                    console.error('Error converting to quest:', error);
                  }
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Swords className="w-4 h-4" />
                Convert to Quest
              </button>
            )
          ) : (
            onConvertToChecklist && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  try {
                    await onConvertToChecklist(itemId);
                    setIsChecklistMode(true);
                  } catch (error) {
                    console.error('Error converting to checklist:', error);
                  }
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <ListChecks className="w-4 h-4" />
                Convert to Checklist
              </button>
            )
          )}

          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                setShowConfirmModal(true);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Chip siklus ringkas "⏱ 60/10 ▾" → menu kecil; opsi dev 1m/5m dipisah di bawah (app-70vs).
const CycleChip: React.FC<{
  value: number;
  options: { value: number; label: string; dev?: boolean }[];
  disabled: boolean;
  onSelect: (value: number) => void;
}> = ({ value, options, disabled, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);
  const main = options.filter((o) => !o.dev);
  const dev = options.filter((o) => o.dev);
  const itemClass = (selected: boolean) =>
    `block w-full px-3 py-1.5 text-left text-xs font-semibold ${selected
      ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'}`;

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        data-testid="task-cycle"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-600 transition-colors hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
      >
        <span aria-hidden="true">⏱</span>
        {current?.label ?? `${value}m`}
        <span aria-hidden="true" className="text-[9px]">▾</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-7 z-50 w-24 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {main.map((o) => (
            <button key={o.value} type="button" role="menuitem" className={itemClass(o.value === value)}
              onClick={() => { setOpen(false); onSelect(o.value); }}>
              {o.label}
            </button>
          ))}
          {dev.length > 0 && (
            <>
              <p className="border-t border-gray-200 px-3 pt-1 text-[10px] uppercase tracking-wider text-gray-400 dark:border-gray-700">dev</p>
              {dev.map((o) => (
                <button key={o.value} type="button" role="menuitem" className={itemClass(o.value === value)}
                  onClick={() => { setOpen(false); onSelect(o.value); }}>
                  {o.label}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const TaskItemCardContent = ({
  item,
  onStatusChange,
  onSetActiveTask,
  selectedDate,
  onFocusDurationChange,
  completedSessions,
  refreshKey,
  forceRefreshTaskId,
  onRemove,
  onConvertToChecklist,
  onConvertToQuest,
  dragHandleProps
}: TaskCardProps) => {
  const { completed, target } = useTaskSession(
    item,
    selectedDate || '',
    completedSessions,
    refreshKey,
    forceRefreshTaskId
  );

  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const [optimisticFocusDuration, setOptimisticFocusDuration] = useState<number | null>(null);
  // Auto-detect checklist mode from focus_duration = 0
  const [isChecklistMode, setIsChecklistMode] = useState(item.focus_duration === 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const { schedules } = useTaskSchedules(item.item_id);
  const totalScheduled = schedules?.reduce((acc, s) => acc + s.session_count, 0) || 0;
  const isScheduled = totalScheduled > 0;

  // Update checklist mode when focus_duration changes
  useEffect(() => {
    setIsChecklistMode((item.focus_duration || 0) === 0);
  }, [item.focus_duration]);

  // Get active task from timer store
  const { activeTask, timerState } = useTimerStore();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Get task completion sound settings
  const { taskCompletionSettings } = useSoundStore();

  const isCompleted = (optimisticStatus || item.status) === 'DONE';
  const isActiveInTimer = activeTask?.id === item.item_id && (timerState === 'FOCUSING' || timerState === 'PAUSED');
  const isVisuallyDisabled = isCompleted || (activeTask && !isActiveInTimer); // Visual disable only - functionality remains normal

  // Hamburger icon for drag handle (only when dragHandleProps is provided)
  const HamburgerIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
    >
      <rect x="4" y="6" width="12" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="4" y="9.25" width="12" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="4" y="12.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  );

  // New hook for schedules
  const MenuProps = {
    showMenu,
    setShowMenu,
    menuRef,
    isChecklistMode,
    onConvertToChecklist,
    onConvertToQuest,
    onRemove,
    setShowConfirmModal,
    itemId: item.id,
    itemType: item.item_type,
    setIsChecklistMode,
    onSchedule: () => {
      setShowMenu(false);
      setShowScheduleModal(true);
    }
  };

  // Opsi dev 1m/5m tetap ada; nilai tersimpan di luar daftar (mis. 30) tampil sebagai chip terpilih.
  const currentDuration = optimisticFocusDuration ?? item.focus_duration ?? 25;
  const cycleOptions: { value: number; label: string; dev?: boolean }[] = [
    ...CYCLES.map((c) => ({ value: c.focus as number, label: c.label })),
    ...(process.env.NODE_ENV === 'development'
      ? [{ value: 1, label: '1m', dev: true }, { value: 5, label: '5m', dev: true }]
      : []),
  ];
  if (!cycleOptions.some((o) => o.value === currentDuration)) {
    cycleOptions.unshift({ value: currentDuration, label: `${currentDuration}m` });
  }

  return (
    <div
      draggable={true}  // ✅ CHECKLIST DND: Enable drag for all tasks including checklist
      onDragStart={(e) => {
        e.dataTransfer.setData('application/task-schedule', JSON.stringify({
          dailyPlanItemId: item.id,
          itemId: item.item_id,
          title: item.title || 'Task',
          focusDuration: isChecklistMode ? 30 : (item.focus_duration || 25),  // ✅ Default 30 min for checklist
          sessionCount: 1,
          itemType: item.item_type,
          isChecklist: isChecklistMode,  // ✅ Flag untuk CalendarView handler
        }));
        e.dataTransfer.effectAllowed = 'copy';
      }}
      data-testid={`task-card-${item.id}`}
      className={`rounded-lg py-4 px-2 shadow-sm border mb-3 transition-all duration-200 relative ${isVisuallyDisabled
        ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-60'
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>

      {/* Schedule Management Modal */}
      {showScheduleModal && (
        <ScheduleManagementModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          task={{
            id: item.id,
            item_id: item.item_id,
            item_type: item.item_type,
            status: item.status as any,
            title: item.title,
            focus_duration: item.focus_duration,
            daily_session_target: target
          }}
          selectedDate={selectedDate}
        />
      )}

      {/* Grid 2 baris: handle + play (tengah vertikal) | judul + checkbox/menu | chip jenis kiri, siklus kanan */}
      <div className="flex items-center gap-2">
        {dragHandleProps && (
          <div
            {...dragHandleProps.attributes}
            {...dragHandleProps.listeners}
            className="flex items-center justify-center cursor-grab active:cursor-grabbing select-none flex-shrink-0"
            title="Drag to reorder"
          >
            <HamburgerIcon />
          </div>
        )}

        {!isChecklistMode && onSetActiveTask ? (
          <button
            data-testid={`task-play-${item.id}`}
            className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full transition-colors ${isVisuallyDisabled
              ? 'bg-gray-100 text-gray-400'
              : `${isActiveInTimer
                ? 'bg-gray-50 text-orange-500 hover:bg-orange-100'
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}`}
            onClick={() => onSetActiveTask({
              id: item.item_id,
              title: item.title || `Task ${item.item_id}`,
              item_type: item.item_type,
              focus_duration: item.focus_duration || 25,
              completed_sessions: completed,
              target_sessions: target
            })}
            title={
              isCompleted
                ? "Quest sudah selesai"
                : isActiveInTimer
                  ? "Quest sedang aktif di timer"
                  : activeTask
                    ? "Ada quest lain yang sedang aktif di timer"
                    : "Mulai Pomodoro"
            }
          >
            {isActiveInTimer ? (
              <svg width="35" height="35" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="9" fill="currentColor" className='text-orange-500' opacity="0.15" />
                <rect x="7" y="6" width="2" height="8" rx="1" fill="white" stroke="currentColor" />
                <rect x="11" y="6" width="2" height="8" rx="1" fill="white" stroke="currentColor" />
              </svg>
            ) : (
              <svg width="35" height="35" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.15" />
                <polygon points="8,6 14,10 8,14" fill="currentColor" />
              </svg>
            )}
          </button>
        ) : null}

        <div className="min-w-0 flex-1">
          {/* Baris 1: judul + checkbox + menu */}
          <div className="flex items-start gap-2">
            <div className="flex min-w-0 flex-1 items-start gap-1.5 pt-1.5">
              {isScheduled && (
                <span className="mt-0.5 flex-shrink-0 text-gray-400" title={`Scheduled: ${totalScheduled} sessions`}>
                  <Clock className="w-4 h-4" />
                </span>
              )}
              <h4 className={`min-w-0 font-medium text-sm leading-tight break-words ${isCompleted
                ? 'text-gray-500 dark:text-gray-500 line-through'
                : 'text-gray-900 dark:text-gray-100'
                }`}>
                {item.title || `Task ${item.item_id}`}
              </h4>
            </div>
            <div className="flex flex-shrink-0 items-center space-x-2">
              <button
                type="button"
                data-testid={`task-status-${item.id}`}
                onClick={async () => {
                  const newStatus = isCompleted ? 'TODO' : 'DONE';
                  if (newStatus === 'DONE') {
                    try {
                      await playSound(taskCompletionSettings.soundId, taskCompletionSettings.volume);
                    } catch (error) {
                      console.warn('Failed to play completion sound:', error);
                    }
                  }
                  setOptimisticStatus(newStatus);
                  try {
                    await onStatusChange(item.id, newStatus);
                    setOptimisticStatus(null);
                  } catch (error) {
                    setOptimisticStatus(null);
                    console.error('Error updating status:', error);
                  }
                }}
                className={`w-8 h-8 rounded focus:ring-2 cursor-pointer flex items-center justify-center transition-colors border border-gray-300 ${isVisuallyDisabled
                  ? 'bg-gray-100 text-gray-400 focus:ring-brand-400'
                  : ''
                  }`}
              >
                {isCompleted && (
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
              <TaskItemMenu {...MenuProps} />
            </div>
          </div>

          {/* Baris 2: chip jenis kiri, siklus kanan (kolom tetap, tak ikut panjang judul) */}
          <div className="mt-1 flex items-center justify-between gap-2">
            <span
              data-testid="task-kind-badge"
              className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${item.item_type === 'MAIN_QUEST'
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400'
                }`}
            >
              {kindLabel(item.item_type)}
            </span>
            {!isChecklistMode && (
              <CycleChip
                value={currentDuration}
                options={cycleOptions}
                disabled={isCompleted}
                onSelect={async (value) => {
                  if (value === currentDuration) return;
                  setOptimisticFocusDuration(value);
                  try {
                    await onFocusDurationChange(item.id, value);
                  } catch (error) {
                    console.error('Error updating focus duration:', error);
                  } finally {
                    setOptimisticFocusDuration(null);
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* ConfirmModal for Remove */}
      {onRemove && (
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={async () => {
            setIsRemoving(true);
            try {
              await onRemove(item.id);
              setShowConfirmModal(false);
            } catch (error) {
              console.error('Error removing item:', error);
            } finally {
              setIsRemoving(false);
            }
          }}
          title="Hapus dari Plan Hari Ini"
          message="Apakah Anda yakin ingin menghapus item ini dari plan hari ini? Tindakan ini tidak dapat dibatalkan."
          confirmText="Hapus"
          cancelText="Batal"
          confirmVariant="danger"
          isLoading={isRemoving}
          size="sm"
        />
      )}
    </div>
  );
};


const TaskItemCard = TaskItemCardContent;

export default TaskItemCard;
