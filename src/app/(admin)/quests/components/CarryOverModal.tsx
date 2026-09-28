"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Spinner from "@/components/ui/spinner/Spinner";
import { toast } from "sonner";
import { type CarryOverType, type CarryOverCandidate } from "../actions/carry-over/logic";
import {
  getCarryOverGroups,
  carryOverQuests,
  carryOverWorkQuests,
} from "../actions/carry-over/actions";
import CarryOverWorkItem from "./CarryOverWorkItem";

interface CarryOverModalProps {
  type: CarryOverType;
  year: number;
  quarter: number;
  isOpen: boolean;
  onClose: () => void;
  onDone: () => void;
}

export default function CarryOverModal({
  type,
  year,
  quarter,
  isOpen,
  onClose,
  onDone,
}: CarryOverModalProps) {
  // State for Daily / Side
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // State for Work
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const [isSaving, setIsSaving] = useState(false);

  const isWork = type === 'WORK_QUEST';

  const { data: groups, isLoading, error, mutate } = useSWR(
    // Key beda dari versi lama: cache SWR disimpan di localStorage, bentuk data lama (array kandidat) bikin crash.
    isOpen ? ['carry-over-groups', type, year, quarter] : null,
    () => getCarryOverGroups(type, year, quarter),
    { revalidateOnFocus: false }
  );

  // Reset selected state when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setSelected(new Set());
      setSelectedProjects(new Set());
      setSelectedTasks(new Set());
      setIsSaving(false);
    }
  }, [isOpen]);

  const allCandidates = (groups || []).flatMap((g) => g.candidates);

  // Daily / Side selection logic
  const availableDailySide = allCandidates.filter((c) => !c.alreadyExists);
  const isAllDailySideSelected =
    availableDailySide.length > 0 &&
    availableDailySide.every((c) => selected.has(c.id));

  // Work selection logic
  const availableWorkTasks = allCandidates.flatMap((p) => p.children).filter((c) => !c.alreadyExists);
  const availableWorkProjects = allCandidates.filter((p) => !p.alreadyExists || p.children.some((c) => !c.alreadyExists));
  const isAllWorkSelected =
    availableWorkProjects.length > 0 &&
    availableWorkProjects.every((p) => selectedProjects.has(p.id)) &&
    availableWorkTasks.every((t) => selectedTasks.has(t.id));

  const handleSelectAll = () => {
    if (isWork) {
      if (isAllWorkSelected) {
        setSelectedProjects(new Set());
        setSelectedTasks(new Set());
      } else {
        setSelectedProjects(new Set(availableWorkProjects.map((p) => p.id)));
        setSelectedTasks(new Set(availableWorkTasks.map((t) => t.id)));
      }
    } else {
      if (isAllDailySideSelected) {
        setSelected(new Set());
      } else {
        setSelected(new Set(availableDailySide.map((c) => c.id)));
      }
    }
  };

  const toggleDailySide = (id: string, alreadyExists: boolean) => {
    if (alreadyExists) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleToggleProject = (projectId: string, candidate: CarryOverCandidate) => {
    const nextProjects = new Set(selectedProjects);
    const nextTasks = new Set(selectedTasks);

    if (nextProjects.has(projectId)) {
      nextProjects.delete(projectId);
      candidate.children.forEach((c) => nextTasks.delete(c.id));
    } else {
      nextProjects.add(projectId);
      candidate.children.forEach((c) => {
        if (!c.alreadyExists) nextTasks.add(c.id);
      });
    }

    setSelectedProjects(nextProjects);
    setSelectedTasks(nextTasks);
  };

  const handleToggleTask = (taskId: string, projectId: string) => {
    const nextTasks = new Set(selectedTasks);
    const nextProjects = new Set(selectedProjects);

    if (nextTasks.has(taskId)) {
      nextTasks.delete(taskId);
    } else {
      nextTasks.add(taskId);
      nextProjects.add(projectId);
    }

    setSelectedTasks(nextTasks);
    setSelectedProjects(nextProjects);
  };

  // Hitung jumlah item yang akan disalin
  const newProjectsCount = isWork
    ? Array.from(selectedProjects).filter((id) => {
        const cand = allCandidates.find((c) => c.id === id);
        return cand && !cand.alreadyExists;
      }).length
    : 0;

  const totalCount = isWork ? selectedTasks.size + newProjectsCount : selected.size;

  const handleCarryOver = async () => {
    if (totalCount === 0) return;
    setIsSaving(true);
    try {
      let n = 0;
      if (isWork) {
        const selections = Array.from(selectedProjects).map((pId) => {
          const cand = allCandidates.find((c) => c.id === pId);
          const taskIds = (cand?.children || [])
            .filter((c) => selectedTasks.has(c.id))
            .map((c) => c.id);
          return { projectId: pId, taskIds };
        });
        n = await carryOverWorkQuests(selections, year, quarter);
      } else {
        n = await carryOverQuests(type, Array.from(selected), year, quarter);
      }

      toast.success(`${n} item dibawa ke quarter ini`);
      setSelected(new Set());
      setSelectedProjects(new Set());
      setSelectedTasks(new Set());
      await mutate();
      onDone();
      onClose();
    } catch (err) {
      console.error("Gagal membawa quest:", err);
      toast.error("Gagal membawa quest");
    } finally {
      setIsSaving(false);
    }
  };

  const hasCandidates = allCandidates.length > 0;
  const isSelectAllActive = isWork ? isAllWorkSelected : isAllDailySideSelected;

  const footer = (
    <div className="flex justify-end gap-3 w-full">
      <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
        Batal
      </Button>
      <Button
        size="sm"
        disabled={totalCount === 0 || isSaving}
        loading={isSaving}
        onClick={handleCarryOver}
        data-testid="carry-over-submit-btn"
      >
        Bawa ({totalCount})
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ambil dari quarter sebelumnya"
      size="md"
      footer={footer}
    >
      <div className="py-2">
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Spinner size={32} />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 text-center py-4">
            Gagal memuat daftar quest dari quarter sebelumnya.
          </p>
        )}

        {!isLoading && !error && !hasCandidates && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
            Tidak ada quest yang bisa dibawa dari quarter sebelumnya.
          </p>
        )}

        {!isLoading && hasCandidates && (
          <div>
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Pilih quest yang ingin disalin:
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                {isSelectAllActive ? "Kosongkan" : "Pilih semua"}
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {(groups || []).map((group) => (
                <div key={`${group.year}-${group.quarter}`} className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1 pt-1">
                    Q{group.quarter} {group.year}
                  </div>

                  <div className="space-y-2">
                    {group.candidates.map((c) => {
                      if (isWork) {
                        return (
                          <CarryOverWorkItem
                            key={c.id}
                            candidate={c}
                            selectedProjects={selectedProjects}
                            selectedTasks={selectedTasks}
                            onToggleProject={handleToggleProject}
                            onToggleTask={handleToggleTask}
                          />
                        );
                      }

                      const isChecked = selected.has(c.id);
                      return (
                        <div
                          key={c.id}
                          data-testid={`carry-over-item-${c.id}`}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            c.alreadyExists
                              ? "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-60"
                              : isChecked
                              ? "bg-brand-50/50 dark:bg-brand-900/20 border-brand-300 dark:border-brand-700"
                              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                          }`}
                        >
                          <label className="flex items-center gap-3 min-w-0 pr-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={c.alreadyExists}
                              onChange={() => toggleDailySide(c.id, c.alreadyExists)}
                              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700"
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {c.title}
                            </span>
                          </label>
                          {c.alreadyExists && (
                            <span className="shrink-0 text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              sudah ada
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
