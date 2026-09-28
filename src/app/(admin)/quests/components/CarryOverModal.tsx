"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Spinner from "@/components/ui/spinner/Spinner";
import { toast } from "sonner";
import { getPrevQuarter } from "@/lib/quarterUtils";
import { type CarryOverType } from "../actions/carry-over/logic";
import { getCarryOverCandidates, carryOverQuests } from "../actions/carry-over/actions";

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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const prev = getPrevQuarter(year, quarter);

  const { data: candidates, isLoading, error, mutate } = useSWR(
    isOpen ? ['carry-over', type, year, quarter] : null,
    () => getCarryOverCandidates(type, year, quarter),
    { revalidateOnFocus: false }
  );

  // Reset selected state when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setSelected(new Set());
      setIsSaving(false);
    }
  }, [isOpen]);

  const availableCandidates = (candidates || []).filter((c) => !c.alreadyExists);
  const isAllSelected =
    availableCandidates.length > 0 &&
    availableCandidates.every((c) => selected.has(c.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(availableCandidates.map((c) => c.id)));
    }
  };

  const toggleItem = (id: string, alreadyExists: boolean) => {
    if (alreadyExists) return;
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const handleCarryOver = async () => {
    if (selected.size === 0) return;
    setIsSaving(true);
    try {
      const n = await carryOverQuests(type, Array.from(selected), year, quarter);
      toast.success(`${n} quest dibawa ke quarter ini`);
      setSelected(new Set());
      mutate();
      onDone();
      onClose();
    } catch (err) {
      console.error("Gagal membawa quest:", err);
      toast.error("Gagal membawa quest");
    } finally {
      setIsSaving(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-3 w-full">
      <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
        Batal
      </Button>
      <Button
        size="sm"
        disabled={selected.size === 0 || isSaving}
        loading={isSaving}
        onClick={handleCarryOver}
        data-testid="carry-over-submit-btn"
      >
        Bawa ({selected.size})
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ambil dari Q${prev.quarter} ${prev.year}`}
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
            Gagal memuat daftar quest dari quarter lalu.
          </p>
        )}

        {!isLoading && !error && (!candidates || candidates.length === 0) && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
            Tidak ada quest yang bisa dibawa dari quarter lalu.
          </p>
        )}

        {!isLoading && candidates && candidates.length > 0 && (
          <div>
            {availableCandidates.length > 0 && (
              <div className="flex justify-between items-center mb-3 px-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Pilih quest yang ingin disalin:
                </span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  {isAllSelected ? "Kosongkan" : "Pilih semua"}
                </button>
              </div>
            )}

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {candidates.map((c) => {
                const isChecked = selected.has(c.id);
                return (
                  <label
                    key={c.id}
                    data-testid={`carry-over-item-${c.id}`}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      c.alreadyExists
                        ? "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-60 cursor-not-allowed"
                        : isChecked
                        ? "bg-brand-50/50 dark:bg-brand-900/20 border-brand-300 dark:border-brand-700 cursor-pointer"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={c.alreadyExists}
                        onChange={() => toggleItem(c.id, c.alreadyExists)}
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {c.title}
                        </p>
                        {c.detail && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {c.detail}
                          </p>
                        )}
                      </div>
                    </div>
                    {c.alreadyExists && (
                      <span className="shrink-0 text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        sudah ada
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
