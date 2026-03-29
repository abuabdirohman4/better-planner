"use client";

import { useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/modal/Modal";
import HabitForm from "@/components/habits/HabitForm";
import type { Habit, HabitFormInput } from "@/types/habit";

export interface HabitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit?: Habit;
  onAdd: (input: HabitFormInput) => Promise<Habit>;
  onUpdate: (habitId: string, updates: Partial<HabitFormInput>) => Promise<Habit>;
  onArchive?: (habitId: string) => Promise<void>;
}

export default function HabitFormModal({
  isOpen,
  onClose,
  habit,
  onAdd,
  onUpdate,
  onArchive,
}: HabitFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const isEditMode = !!habit;

  const handleSubmit = async (input: HabitFormInput) => {
    setIsSubmitting(true);
    try {
      if (isEditMode && habit) {
        await onUpdate(habit.id, input);
        toast.success("Habit updated successfully!");
      } else {
        await onAdd(input);
        toast.success("Habit added successfully!");
      }
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      toast.error(`Failed to ${isEditMode ? "update" : "add"} habit: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!habit || !onArchive) return;
    setIsArchiving(true);
    try {
      await onArchive(habit.id);
      toast.success("Habit archived.");
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(`Failed to archive habit: ${message}`);
    } finally {
      setIsArchiving(false);
    }
  };

  const initialValues = habit
    ? {
        name: habit.name,
        category: habit.category,
        frequency: habit.frequency,
        monthly_goal: habit.monthly_goal,
        tracking_type: habit.tracking_type,
        description: habit.description ?? undefined,
        target_time: habit.target_time ?? undefined,
      }
    : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Habit" : "Add Habit"}
      size="md"
      closeOnBackdropClick={!isSubmitting && !isArchiving}
      closeOnEscape={!isSubmitting && !isArchiving}
    >
      <HabitForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        onArchive={isEditMode && onArchive ? handleArchive : undefined}
        isArchiving={isArchiving}
      />
    </Modal>
  );
}
