"use client";

import React, { useEffect, useState, useRef, forwardRef } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import CustomToast from "@/components/ui/toast/CustomToast";
import { addWeeklyRule, updateWeeklyRule, deleteWeeklyRule, updateWeeklyRuleOrder } from "./actions";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ToDontListCardProps {
  year: number;
  weekNumber: number;
  rules: Rule[];
  loading: boolean;
  onRefresh: () => void;
}

export type Rule = {
  id: string;
  rule_text: string;
  display_order: number;
};

const SortableRuleItem = forwardRef<HTMLInputElement, {
  rule: Rule;
  editingId: string | null;
  editingText: string;
  setEditingId: (id: string | null) => void;
  setEditingText: (text: string) => void;
  handleSaveEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  setFocusRuleId: (id: string | null) => void;
  focusRuleId: string | null;
  focusInputAbove: (idx: number) => void;
  isLastItem: boolean;
  handleAddEmptyRuleAt: () => void;
  handleBulkPasteLast: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  focusRuleIdAfterInsert: string | null;
  setFocusRuleIdAfterInsert: (id: string | null) => void;
  idx: number;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
}>(
  ({ rule, editingId, editingText, setEditingId, setEditingText, handleSaveEdit, handleDelete, setFocusRuleId, focusRuleId, focusInputAbove, isLastItem, handleAddEmptyRuleAt, handleBulkPasteLast, focusRuleIdAfterInsert, setFocusRuleIdAfterInsert, idx, inputRefs }, ref) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: rule.id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.7 : 1,
      zIndex: isDragging ? 20 : 'auto',
      background: 'inherit',
    };
    useEffect(() => {
      if ((focusRuleId === rule.id || focusRuleIdAfterInsert === rule.id) && ref && typeof ref !== 'function' && ref.current) {
        ref.current.focus();
        if (focusRuleIdAfterInsert === rule.id) setFocusRuleIdAfterInsert(null);
      }
    }, [focusRuleId, focusRuleIdAfterInsert, rule.id, ref, setFocusRuleIdAfterInsert]);
    return (
      <div ref={setNodeRef} style={style} className="flex items-center py-2 px-4 group w-full">
        <span {...attributes} {...listeners} className="flex items-center cursor-grab select-none mr-2 text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="4" y="6" width="12" height="1.5" rx="0.75" fill="currentColor" /><rect x="4" y="9.25" width="12" height="1.5" rx="0.75" fill="currentColor" /><rect x="4" y="12.5" width="12" height="1.5" rx="0.75" fill="currentColor" /></svg>
        </span>
        <span className="w-6 mr-2 select-none text-right">{idx + 1}.</span>
        <input
          ref={ref}
          className="flex-1 border rounded px-2 py-1 mr-2 dark:bg-gray-800"
          value={editingId === rule.id ? editingText : rule.rule_text}
          onChange={e => {
            setEditingId(rule.id);
            setEditingText(e.target.value);
          }}
          onFocus={() => setFocusRuleId(rule.id)}
          onBlur={() => {
            if (editingId === rule.id) handleSaveEdit(rule.id);
          }}
          onKeyDown={e => {
            if (e.key === "Enter") handleAddEmptyRuleAt();
            if (e.key === "Enter") handleSaveEdit(rule.id);
            if (e.key === "Escape") setEditingId(null);
            if ((e.key === "Backspace" || e.key === "Delete") && (editingId === rule.id ? editingText : rule.rule_text).length === 0) {
              e.preventDefault();
              handleDelete(rule.id);
              focusInputAbove(rule.display_order - 1);
            }
            if (e.key === "ArrowUp" && idx > 0) {
              e.preventDefault();
              inputRefs.current[idx - 1]?.focus();
            }
            if (e.key === "ArrowDown" && inputRefs.current[idx + 1]) {
              e.preventDefault();
              inputRefs.current[idx + 1]?.focus();
            }
          }}
          onPaste={isLastItem ? handleBulkPasteLast : undefined}
        />
      </div>
    );
  }
);
SortableRuleItem.displayName = "SortableRuleItem";

const ToDontListCard: React.FC<ToDontListCardProps> = ({ year, weekNumber, rules, loading, onRefresh }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [focusRuleId, setFocusRuleId] = useState<string | null>(null);
  const [newRule, setNewRule] = useState("");
  const [newRuleLoading, setNewRuleLoading] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusRuleIdAfterInsert, setFocusRuleIdAfterInsert] = useState<string | null>(null);
  const [loadingInsertAt, setLoadingInsertAt] = useState<number | null>(null);

  // Save edit
  const handleSaveEdit = async (id: string) => {
    if (editingId !== id) return;
    const rule = rules.find(r => r.id === id);
    if (!rule || editingText.trim() === rule.rule_text) {
      setEditingId(null);
      setEditingText("");
      return;
    }
    const res = await updateWeeklyRule(id, editingText.trim());
    if (res.success) {
      onRefresh();
      // CustomToast.success(res.message);
    } else {
      CustomToast.error("Gagal", res.message);
    }
    setEditingId(null);
    setEditingText("");
  };

  // Delete rule (by keyboard)
  const handleDelete = async (id: string) => {
    const idx = rules.findIndex(r => r.id === id);
    const res = await deleteWeeklyRule(id);
    if (!res.success) {
      CustomToast.error("Gagal", res.message);
      onRefresh();
    } else {
      // Fokus ke input di atasnya
      setTimeout(() => {
        if (inputRefs.current[idx - 1]) inputRefs.current[idx - 1]?.focus();
      }, 100);
      onRefresh();
    }
  };

  // Add new rule (inline input bawah)
  const handleAddRule = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newRule.trim()) return;
    setNewRuleLoading(true);
    const formData = new FormData();
    formData.append("rule_text", newRule);
    formData.append("year", String(year));
    formData.append("week_number", String(weekNumber));
    const res = await addWeeklyRule(formData);
    if (res.success) {
      setNewRule("");
      onRefresh();
    } else {
      CustomToast.error("Gagal", res.message);
    }
    setNewRuleLoading(false);
    // Fokus ke input baru
    setTimeout(() => {
      if (inputRefs.current[rules.length]) inputRefs.current[rules.length]?.focus();
    }, 100);
  };

  // Bulk paste handler
  const handleBulkPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length <= 1) return; // Bukan multi-line
    e.preventDefault();
    setNewRuleLoading(true);
    for (const line of lines) {
      const formData = new FormData();
      formData.append("rule_text", line);
      formData.append("year", String(year));
      formData.append("week_number", String(weekNumber));
      await addWeeklyRule(formData);
    }
    setNewRule("");
    onRefresh();
    setTimeout(() => {
      if (inputRefs.current[rules.length]) inputRefs.current[rules.length]?.focus();
    }, 100);
    setNewRuleLoading(false);
  };

  // Drag & drop handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rules.findIndex(r => r.id === active.id);
    const newIndex = rules.findIndex(r => r.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newRules = arrayMove(rules, oldIndex, newIndex).map((r, idx) => ({ ...r, display_order: idx + 1 }));
    const res = await updateWeeklyRuleOrder(newRules.map(r => ({ id: r.id, display_order: r.display_order })));
    if (!res.success) {
      CustomToast.error("Gagal update urutan", res.message);
    }
    onRefresh();
  };

  // Fokus ke input atas setelah hapus
  const focusInputAbove = (idx: number) => {
    setTimeout(() => {
      if (inputRefs.current[idx - 1]) inputRefs.current[idx - 1]?.focus();
    }, 100);
  };

  // Handler insert di posisi mana pun
  const handleAddEmptyRuleAt = async (idx: number) => {
    setLoadingInsertAt(idx + 1);
    // Hitung display_order baru (selalu tambah di paling bawah)
    const newOrder = (rules[rules.length - 1]?.display_order ?? 0) + 1;
    const formData = new FormData();
    formData.append("rule_text", "");
    formData.append("year", String(year));
    formData.append("week_number", String(weekNumber));
    formData.append("display_order", String(newOrder));
    const res = await addWeeklyRule(formData);
    if (res.success && res.id) {
      setFocusRuleIdAfterInsert(res.id);
      onRefresh();
    } else if (res.success) {
      setTimeout(() => {
        if (inputRefs.current[idx + 1]) inputRefs.current[idx + 1]?.focus();
      }, 100);
      onRefresh();
    } else {
      CustomToast.error("Gagal menambah aturan", res.message);
    }
    setLoadingInsertAt(null);
  };

  // Bulk paste handler untuk input terakhir
  const handleBulkPasteLast = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length <= 1) return; // Bukan multi-line
    e.preventDefault();
    setNewRuleLoading(true);
    for (const line of lines) {
      const formData = new FormData();
      formData.append("rule_text", line);
      formData.append("year", String(year));
      formData.append("week_number", String(weekNumber));
      await addWeeklyRule(formData);
    }
    onRefresh();
    setTimeout(() => {
      if (inputRefs.current[rules.length]) inputRefs.current[rules.length]?.focus();
    }, 100);
    setNewRuleLoading(false);
  };

  return (
    <ComponentCard title="To Don't List" classNameTitle='text-center text-xl !font-extrabold' classNameHeader="pt-8 pb-0" className="my-6">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={rules.map(r => r.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1">
            {loading ? (
              <div className="flex items-center py-2 group w-full animate-pulse">
                <span className="w-6 mr-2" />
                <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ) : rules.length === 0 ? (
              <div className="flex items-center py-2 group w-full">
                <span className="w-6 mr-1" />
                <input
                  ref={el => { inputRefs.current[0] = el; }}
                  className="flex-1 border rounded px-2 py-1 mr-2 dark:bg-gray-800"
                  value={newRule}
                  onChange={e => setNewRule(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      handleAddRule();
                      setNewRule("");
                    }
                  }}
                  onPaste={handleBulkPaste}
                  placeholder="Masukkan aturan..."
                  disabled={newRuleLoading}
                  autoFocus
                />
              </div>
            ) : (
              rules.map((rule, idx) => [
                <SortableRuleItem
                  key={rule.id}
                  rule={rule}
                  editingId={editingId}
                  editingText={editingText}
                  setEditingId={setEditingId}
                  setEditingText={setEditingText}
                  handleSaveEdit={handleSaveEdit}
                  handleDelete={handleDelete}
                  setFocusRuleId={setFocusRuleId}
                  focusRuleId={focusRuleId}
                  focusInputAbove={focusInputAbove}
                  ref={el => { inputRefs.current[idx] = el; }}
                  isLastItem={idx === rules.length - 1}
                  handleAddEmptyRuleAt={() => handleAddEmptyRuleAt(idx)}
                  handleBulkPasteLast={handleBulkPasteLast}
                  focusRuleIdAfterInsert={focusRuleIdAfterInsert}
                  setFocusRuleIdAfterInsert={setFocusRuleIdAfterInsert}
                  idx={idx}
                  inputRefs={inputRefs}
                />,
                loadingInsertAt === idx + 1 && (
                  <div key={`skeleton-${idx + 1}`} className="flex items-center py-2 group w-full animate-pulse">
                    <span className="w-6 mr-2" />
                    <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                )
              ])
            )}
            {/* Skeleton loading bar saat insert */}
            {newRuleLoading && (
              <div className="flex items-center py-2 group w-full animate-pulse">
                <span className="w-6 mr-2" />
                <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </ComponentCard>
  );
};

export default ToDontListCard; 