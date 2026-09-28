"use client";

import React, { useState } from "react";
import type { CarryOverCandidate } from "../actions/carry-over/logic";

interface CarryOverWorkItemProps {
  candidate: CarryOverCandidate;
  selectedProjects: Set<string>;
  selectedTasks: Set<string>;
  onToggleProject: (projectId: string, candidate: CarryOverCandidate) => void;
  onToggleTask: (taskId: string, projectId: string) => void;
}

export default function CarryOverWorkItem({
  candidate,
  selectedProjects,
  selectedTasks,
  onToggleProject,
  onToggleTask,
}: CarryOverWorkItemProps) {
  const [isExpanded, setIsExpanded] = useState(candidate.children.length <= 5);

  const isProjectChecked = selectedProjects.has(candidate.id);
  const allChildrenAlreadyExist = candidate.children.length > 0 && candidate.children.every((c) => c.alreadyExists);
  const isProjectDisabled = candidate.alreadyExists && allChildrenAlreadyExist;

  const visibleChildren = isExpanded ? candidate.children : candidate.children.slice(0, 5);

  return (
    <div
      data-testid={`carry-over-item-${candidate.id}`}
      className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
    >
      {/* Project Row */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-3 min-w-0 pr-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isProjectChecked}
            disabled={isProjectDisabled}
            onChange={() => onToggleProject(candidate.id, candidate)}
            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700"
          />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {candidate.title}
          </span>
        </label>
        {candidate.alreadyExists && (
          <span className="shrink-0 text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
            sudah ada — tambah task
          </span>
        )}
      </div>

      {/* Children Tasks */}
      {candidate.children.length > 0 && (
        <div className="pl-7 mt-2 space-y-2 border-t border-gray-100 dark:border-gray-700/50 pt-2">
          {visibleChildren.map((child) => {
            const isChildChecked = selectedTasks.has(child.id);
            return (
              <div key={child.id} className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2.5 min-w-0 pr-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isChildChecked}
                    disabled={child.alreadyExists}
                    onChange={() => onToggleTask(child.id, candidate.id)}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span
                    className={`truncate ${
                      child.alreadyExists
                        ? "text-gray-400 dark:text-gray-500 line-through"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {child.title}
                  </span>
                </label>
                {child.alreadyExists && (
                  <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    sudah ada
                  </span>
                )}
              </div>
            );
          })}

          {candidate.children.length > 5 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline pt-1"
            >
              {isExpanded
                ? "Sembunyikan"
                : `Tampilkan ${candidate.children.length - 5} task lainnya`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
