"use client";

import { useState } from "react";
import type { HabitFormInput, HabitCategory, HabitFrequency, HabitTrackingType } from "@/types/habit";

interface HabitFormProps {
  initialValues?: Partial<HabitFormInput>;
  onSubmit: (input: HabitFormInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  onArchive?: () => void;
  isArchiving?: boolean;
}

const CATEGORY_OPTIONS: { value: HabitCategory; label: string }[] = [
  { value: "spiritual", label: "Spiritual" },
  { value: "kesehatan", label: "Kesehatan" },
  { value: "karir", label: "Karir" },
  { value: "keuangan", label: "Keuangan" },
  { value: "relasi", label: "Relasi" },
  { value: "petualangan", label: "Petualangan" },
  { value: "kontribusi", label: "Kontribusi" },
  { value: "other", label: "Other" },
];

const FREQUENCY_OPTIONS: { value: HabitFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "flexible", label: "Flexible" },
];

const DEFAULT_VALUES: HabitFormInput = {
  name: "",
  category: "spiritual",
  frequency: "flexible",
  monthly_goal: 20,
  tracking_type: "positive",
  description: "",
  target_time: undefined,
};

export default function HabitForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  onArchive,
  isArchiving = false,
}: HabitFormProps) {
  const isEditMode = initialValues !== undefined;

  const [values, setValues] = useState<HabitFormInput>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });

  const [hasTargetTime, setHasTargetTime] = useState(
    !!initialValues?.target_time
  );

  const [errors, setErrors] = useState<Partial<Record<keyof HabitFormInput, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof HabitFormInput, string>> = {};

    if (!values.name.trim()) {
      newErrors.name = "Habit name is required.";
    }
    if (values.monthly_goal < 1 || values.monthly_goal > 31) {
      newErrors.monthly_goal = "Monthly goal must be between 1 and 31.";
    }
    if (hasTargetTime && values.target_time) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(values.target_time)) {
        newErrors.target_time = "Time must be in HH:MM format.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = <K extends keyof HabitFormInput>(
    key: K,
    value: HabitFormInput[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: HabitFormInput = {
      ...values,
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      target_time: hasTargetTime && values.target_time ? values.target_time : undefined,
    };

    await onSubmit(payload);
  };

  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const inputClass =
    "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition";
  const errorClass = "mt-1 text-xs text-red-500 dark:text-red-400";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="habit-name" className={labelClass}>
          Habit Name <span className="text-red-500">*</span>
        </label>
        <input
          id="habit-name"
          type="text"
          value={values.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="e.g., Shalat Tahajud"
          className={inputClass}
          disabled={isSubmitting}
          autoFocus
        />
        {errors.name && <p className={errorClass}>{errors.name}</p>}
      </div>

      {/* Category + Frequency (side by side) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="habit-category" className={labelClass}>
            Category
          </label>
          <select
            id="habit-category"
            value={values.category}
            onChange={(e) => handleChange("category", e.target.value as HabitCategory)}
            className={inputClass}
            disabled={isSubmitting}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="habit-frequency" className={labelClass}>
            Frequency
          </label>
          <select
            id="habit-frequency"
            value={values.frequency}
            onChange={(e) => handleChange("frequency", e.target.value as HabitFrequency)}
            className={inputClass}
            disabled={isSubmitting}
          >
            {FREQUENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Monthly Goal */}
      <div>
        <label htmlFor="habit-monthly-goal" className={labelClass}>
          Monthly Goal <span className="text-xs text-gray-400">(days/month)</span>
        </label>
        <input
          id="habit-monthly-goal"
          type="number"
          min={1}
          max={31}
          value={values.monthly_goal}
          onChange={(e) => handleChange("monthly_goal", parseInt(e.target.value, 10) || 1)}
          className={inputClass}
          disabled={isSubmitting}
        />
        {errors.monthly_goal && <p className={errorClass}>{errors.monthly_goal}</p>}
      </div>

      {/* Tracking Type */}
      <div>
        <label className={labelClass}>Tracking Type</label>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          {(
            [
              {
                value: "positive" as HabitTrackingType,
                label: "Positive",
                description: "Track doing it",
                emoji: "✅",
              },
              {
                value: "negative" as HabitTrackingType,
                label: "Negative",
                description: "Track avoiding it",
                emoji: "🚫",
              },
            ] as const
          ).map(({ value, label, description, emoji }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleChange("tracking_type", value)}
              disabled={isSubmitting}
              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${
                values.tracking_type === value
                  ? "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 font-medium"
                  : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <span>{emoji}</span>
              <span>
                <span className="font-medium">{label}</span>
                <span className="text-xs block text-gray-500 dark:text-gray-400">
                  {description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Target Time toggle */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasTargetTime}
            onChange={(e) => {
              setHasTargetTime(e.target.checked);
              if (!e.target.checked) {
                handleChange("target_time", undefined);
              }
            }}
            className="w-4 h-4 rounded border-gray-300 text-green-500 focus:ring-green-500"
            disabled={isSubmitting}
          />
          <span className={labelClass.replace("mb-1", "mb-0")}>Has target time?</span>
        </label>

        {hasTargetTime && (
          <div className="mt-2">
            <input
              type="time"
              value={values.target_time ?? ""}
              onChange={(e) => handleChange("target_time", e.target.value || undefined)}
              className={inputClass}
              disabled={isSubmitting}
            />
            {errors.target_time && <p className={errorClass}>{errors.target_time}</p>}
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="habit-description" className={labelClass}>
          Description <span className="text-xs text-gray-400">(optional)</span>
        </label>
        <textarea
          id="habit-description"
          value={values.description ?? ""}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Why is this habit important to you?"
          rows={2}
          className={`${inputClass} resize-none`}
          disabled={isSubmitting}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        {/* Archive — far left, only in edit mode */}
        {isEditMode && onArchive && (
          <button
            type="button"
            onClick={onArchive}
            disabled={isArchiving || isSubmitting}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {isArchiving ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            )}
            Archive
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting || isArchiving}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isArchiving}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
              />
            </svg>
          )}
          {isEditMode ? "Save Habit" : "Add Habit"}
        </button>
      </div>
    </form>
  );
}
