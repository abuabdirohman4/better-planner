import { useState } from "react";
import { useSWRConfig } from "swr";
import { format } from "date-fns";
import Modal from "@/components/ui/modal/Modal";
import { Button } from "@/components/ui/button";
import { DailyPlanItem } from "../types";
import { TaskSchedule } from "../actions/scheduleActions";
import { useTaskSchedules } from "../hooks/useTaskSchedules";
import { createSchedule, updateSchedule, deleteSchedule } from "../actions/scheduleActions";
import { ScheduleBlockForm } from "./ScheduleBlockForm";
import { formatTimeRange, getRemainingSessions, SESSION_DURATION_MINUTES } from "../utils/scheduleUtils";

interface ScheduleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: DailyPlanItem;
  selectedDate?: string;
  onScheduleChange?: () => void;
}

export function ScheduleManagementModal({
  isOpen,
  onClose,
  task,
  selectedDate,
  onScheduleChange
}: ScheduleManagementModalProps) {
  const { mutate: globalMutate } = useSWRConfig();
  const { schedules, isLoading, mutate } = useTaskSchedules(task.id);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const dailyTarget = task.daily_session_target || 3;
  const focusDuration = task.focus_duration || SESSION_DURATION_MINUTES;
  const remainingSessions = getRemainingSessions(schedules, dailyTarget);
  const totalScheduled = dailyTarget - remainingSessions;
  const progress = (totalScheduled / dailyTarget) * 100;

  // Helper to revalidate global schedule list (ActivityLog's CalendarView)
  const revalidateGlobalSchedules = async () => {
    const dateKey = selectedDate || format(new Date(), 'yyyy-MM-dd');
    // Force SWR to refetch from server
    await globalMutate(`scheduled-tasks-${dateKey}`);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingId) {
        await updateSchedule(
          editingId,
          data.startTime,
          data.endTime,
          data.duration,
          data.sessionCount
        );
        setEditingId(null);
      } else {
        await createSchedule(
          task.id,
          data.startTime,
          data.endTime,
          data.duration,
          data.sessionCount
        );
        setIsAdding(false);
      }
      await mutate(); // Local revalidation
      await revalidateGlobalSchedules(); // Global revalidation
      onScheduleChange?.(); // Notify parent for instant UI update
    } catch (error) {
      console.error("Failed to save schedule", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this time block?")) {
      await deleteSchedule(id);
      await mutate(); // Local revalidation
      await revalidateGlobalSchedules(); // Global revalidation
      onScheduleChange?.(); // Notify parent for instant UI update
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Schedule: ${task.title}`}
      size="md"
    >
      <div className="space-y-6">
        {/* Progress Section */}
        {task.focus_duration !== 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Scheduled: {totalScheduled} / {dailyTarget} sessions</span>
              <span className="text-muted-foreground">{100 - Math.round(progress)}% remaining</span>
            </div>
            {/* Simple Tailwind Progress Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all duration-500 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Add New Block */}
        {isAdding && (
          <ScheduleBlockForm
            maxSessions={remainingSessions}
            focusDuration={focusDuration}
            isChecklist={task.focus_duration === 0}
            onSave={handleSave}
            onCancel={() => setIsAdding(false)}
          />
        )}

        {/* List of Schedules */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Loading schedules...</div>
          ) : schedules.length === 0 && !isAdding ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
              <p>No time blocks scheduled yet.</p>
              <Button
                variant="plain"
                className="text-brand-600 hover:underline px-0"
                onClick={() => setIsAdding(true)}
                disabled={remainingSessions <= 0}
              >
                Schedule first block
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                editingId === schedule.id ? (
                  <ScheduleBlockForm
                    key={schedule.id}
                    initialStartTime={schedule.scheduled_start_time}
                    initialSessionCount={schedule.session_count}
                    maxSessions={schedule.session_count + remainingSessions}
                    focusDuration={focusDuration}
                    isChecklist={task.focus_duration === 0}
                    initialEndTime={schedule.scheduled_end_time}
                    onSave={handleSave}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg border hover:border-primary/50 transition-colors"
                  >
                    <div>
                      <div className="font-medium">
                        {formatTimeRange(schedule.scheduled_start_time, schedule.scheduled_end_time)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {schedule.session_count} sessions ({schedule.duration_minutes}m)
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="plain"
                        size="sm"
                        onClick={() => setEditingId(schedule.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="plain"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(schedule.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>

        {!isAdding && remainingSessions > 0 && (
          <Button
            className="w-full mt-4"
            variant="outline"
            onClick={() => setIsAdding(true)}
          >
            + Add Time Block
          </Button>
        )}

        {remainingSessions <= 0 && !isAdding && (
          <p className="text-center text-sm text-green-600 font-medium mt-4">
            ✓ All sessions scheduled!
          </p>
        )}
      </div>
    </Modal>
  );
}
