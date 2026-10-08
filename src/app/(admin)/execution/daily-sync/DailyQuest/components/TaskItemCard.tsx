import React, { useState, useEffect, useRef } from 'react';
import { ConfirmModal } from '@/components/ui/modal';
import { Clock, Trash2, Check, GripVertical } from 'lucide-react';
import { ScheduleManagementModal } from './ScheduleManagementModal';
import { useTaskSchedules } from '../hooks/useTaskSchedules';
import { useTaskSession } from '../hooks/useTaskSession';
import { TaskCardProps } from '../types';
import { playSound } from '@/lib/soundUtils';
import { useTimerStore } from '@/stores/timerStore';
import { useSoundStore } from '@/stores/soundStore';
import { kindLabel } from '../utils/dailyFocus';

// ✅ NEW: Reusable Menu Component
interface MenuProps {
  showMenu: boolean;
  setShowMenu: (show: boolean) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onRemove?: (itemId: string) => Promise<void>;
  setShowConfirmModal: (show: boolean) => void;
  itemId: string;
  itemType: string;
  onSchedule: () => void;
}

const TaskItemMenu: React.FC<MenuProps> = ({
  showMenu,
  setShowMenu,
  menuRef,
  onRemove,
  setShowConfirmModal,
  itemId,
  itemType,
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

const TaskItemCardContent = ({
  item,
  onStatusChange,
  selectedDate,
  completedSessions,
  refreshKey,
  forceRefreshTaskId,
  onRemove,
  dragHandleProps
}: TaskCardProps) => {
  const { target } = useTaskSession(
    item,
    selectedDate || '',
    completedSessions,
    refreshKey,
    forceRefreshTaskId
  );

  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const { schedules } = useTaskSchedules(item.item_id);
  const totalScheduled = schedules?.reduce((acc, s) => acc + s.session_count, 0) || 0;
  const isScheduled = totalScheduled > 0;

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
  // Timer dijalankan dari slot Siklus Kerja (app-mgsb); kartu hanya menandai task yang sedang berjalan.
  const isVisuallyDisabled = isCompleted;

  // New hook for schedules
  const MenuProps = {
    showMenu,
    setShowMenu,
    menuRef,
    onRemove,
    setShowConfirmModal,
    itemId: item.id,
    itemType: item.item_type,
    onSchedule: () => {
      setShowMenu(false);
      setShowScheduleModal(true);
    }
  };

  return (
    <div
      data-testid={`task-card-${item.id}`}
      className={`rounded-lg py-2.5 px-3 border mb-2 transition-all duration-200 relative ${isVisuallyDisabled
        ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-60'
        : isActiveInTimer
          ? 'bg-white dark:bg-gray-800 border-brand-400 ring-1 ring-brand-400 dark:border-brand-500'
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

      {/* Satu baris: checkbox | judul + jenis | pegangan drag | menu (app-mgsb) */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          data-testid={`task-status-${item.id}`}
          aria-pressed={isCompleted}
          aria-label={isCompleted ? 'Tandai belum selesai' : 'Tandai selesai'}
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
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-2 transition-colors ${isCompleted
            ? 'border-green-500 bg-green-500 text-white'
            : 'border-gray-300 hover:border-green-400 dark:border-gray-600'
            }`}
        >
          {isCompleted ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          {isScheduled && (
            <span className="flex-shrink-0 text-gray-400" title={`Scheduled: ${totalScheduled} sessions`}>
              <Clock className="w-4 h-4" />
            </span>
          )}
          <h4 className={`min-w-0 font-medium text-sm leading-snug break-words ${isCompleted
            ? 'text-gray-500 dark:text-gray-500 line-through'
            : 'text-gray-900 dark:text-gray-100'
            }`}>
            {item.title || `Task ${item.item_id}`}
          </h4>
          <span
            data-testid="task-kind-badge"
            className={`flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider ${item.item_type === 'MAIN_QUEST'
              ? 'text-brand-600 dark:text-brand-300'
              : 'text-gray-400'
              }`}
          >
            {kindLabel(item.item_type)}
          </span>
        </div>

        {dragHandleProps && (
          <div
            {...dragHandleProps.attributes}
            {...dragHandleProps.listeners}
            style={{ touchAction: 'none' }}
            className="flex flex-shrink-0 cursor-grab items-center justify-center rounded p-1 text-gray-300 hover:text-gray-500 active:cursor-grabbing dark:text-gray-600 dark:hover:text-gray-400"
            title="Geser untuk mengurutkan"
            data-testid={`task-drag-${item.id}`}
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <TaskItemMenu {...MenuProps} />
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
