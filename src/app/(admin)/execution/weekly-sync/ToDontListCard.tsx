"use client";

import React, { useEffect, useState, useRef, forwardRef } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import CustomToast from "@/components/ui/toast/CustomToast";
import { getWeeklyRules, addWeeklyRule, updateWeeklyRule, deleteWeeklyRule, updateWeeklyRuleOrder } from "./actions";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ToDontListCardProps {
  year: number;
  weekNumber: number;
}

type Rule = {
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
  handleAddEmptyRule: () => void;
  handleBulkPasteLast: (e: React.ClipboardEvent<HTMLInputElement>) => void;
}>(
  ({ rule, editingId, editingText, setEditingId, setEditingText, handleSaveEdit, handleDelete, setFocusRuleId, focusRuleId, focusInputAbove, isLastItem, handleAddEmptyRule, handleBulkPasteLast }, ref) => {
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
      if (focusRuleId === rule.id && ref && typeof ref !== 'function' && ref.current) {
        ref.current.focus();
      }
    }, [focusRuleId, rule.id, ref]);
    return (
      <div ref={setNodeRef} style={style} className="flex items-center py-2 group w-full">
        <span {...attributes} {...listeners} className="flex items-center cursor-grab select-none mr-2 text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="4" y="6" width="12" height="1.5" rx="0.75" fill="currentColor" /><rect x="4" y="9.25" width="12" height="1.5" rx="0.75" fill="currentColor" /><rect x="4" y="12.5" width="12" height="1.5" rx="0.75" fill="currentColor" /></svg>
        </span>
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
            if (e.key === "Enter" && isLastItem) handleAddEmptyRule();
            if (e.key === "Enter") handleSaveEdit(rule.id);
            if (e.key === "Escape") setEditingId(null);
            if ((e.key === "Backspace" || e.key === "Delete") && (editingId === rule.id ? editingText : rule.rule_text).length === 0) {
              e.preventDefault();
              handleDelete(rule.id);
              focusInputAbove(rule.display_order - 1);
            }
          }}
          onPaste={isLastItem ? handleBulkPasteLast : undefined}
        />
      </div>
    );
  }
);
SortableRuleItem.displayName = "SortableRuleItem";

const ToDontListCard: React.FC<ToDontListCardProps> = ({ year, weekNumber }) => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [focusRuleId, setFocusRuleId] = useState<string | null>(null);
  const [newRule, setNewRule] = useState("");
  const [newRuleLoading, setNewRuleLoading] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Fetch rules on mount or when year/weekNumber changes
  useEffect(() => {
    const fetchRules = async () => {
      setLoading(true);
      const data = await getWeeklyRules(year, weekNumber);
      setRules(data);
      setLoading(false);
    };
    fetchRules();
  }, [year, weekNumber]);

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
      setRules(rules => rules.map(r => r.id === id ? { ...r, rule_text: editingText.trim() } : r));
      // CustomToast.success(res.message);
    } else {
      CustomToast.error("Gagal", res.message);
    }
    setEditingId(null);
    setEditingText("");
  };

  // Delete rule (by keyboard)
  const handleDelete = async (id: string) => {
    setRules(rules => rules.filter(r => r.id !== id)); // Optimistic
    const res = await deleteWeeklyRule(id);
    if (!res.success) {
      CustomToast.error("Gagal", res.message);
      // Re-fetch jika gagal
      const data = await getWeeklyRules(year, weekNumber);
      setRules(data);
    } else {
      const data = await getWeeklyRules(year, weekNumber);
      setRules(data);
      // Fokus ke input baru
      setTimeout(() => {
        if (inputRefs.current[rules.length]) inputRefs.current[rules.length]?.focus();
      }, 100);
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
      // CustomToast.success(res.message);
      // Refresh list
      const data = await getWeeklyRules(year, weekNumber);
      setRules(data);
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
    const data = await getWeeklyRules(year, weekNumber);
    setRules(data);
    setNewRuleLoading(false);
    // Fokus ke input baru
    setTimeout(() => {
      if (inputRefs.current[rules.length]) inputRefs.current[rules.length]?.focus();
    }, 100);
  };

  // Drag & drop handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rules.findIndex(r => r.id === active.id);
    const newIndex = rules.findIndex(r => r.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newRules = arrayMove(rules, oldIndex, newIndex).map((r, idx) => ({ ...r, display_order: idx + 1 }));
    setRules(newRules); // Optimistic
    const res = await updateWeeklyRuleOrder(newRules.map(r => ({ id: r.id, display_order: r.display_order })));
    if (!res.success) {
      CustomToast.error("Gagal update urutan", res.message);
      // Re-fetch jika gagal
      const data = await getWeeklyRules(year, weekNumber);
      setRules(data);
    }
  };

  // Fokus ke input atas setelah hapus
  const focusInputAbove = (idx: number) => {
    setTimeout(() => {
      if (inputRefs.current[idx - 1]) inputRefs.current[idx - 1]?.focus();
    }, 100);
  };

  // Tambah aturan kosong dari input terakhir
  const handleAddEmptyRule = async () => {
    setNewRuleLoading(true);
    const formData = new FormData();
    formData.append("rule_text", "");
    formData.append("year", String(year));
    formData.append("week_number", String(weekNumber));
    const res = await addWeeklyRule(formData);
    if (res.success) {
      // CustomToast.success(res.message);
      // Refresh list
      const data = await getWeeklyRules(year, weekNumber);
      setRules(data);
      setTimeout(() => {
        if (inputRefs.current[data.length - 1]) inputRefs.current[data.length - 1]?.focus();
      }, 100);
    } else {
      CustomToast.error("Gagal", res.message);
    }
    setNewRuleLoading(false);
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
    const data = await getWeeklyRules(year, weekNumber);
    setRules(data);
    setTimeout(() => {
      if (inputRefs.current[data.length - 1]) inputRefs.current[data.length - 1]?.focus();
    }, 100);
    setNewRuleLoading(false);
  };

  return (
    <ComponentCard title="To Don't List" classNameTitle='text-center text-xl !font-extrabold' classNameHeader="pt-8 pb-0" className="my-6">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={rules.map(r => r.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1">
            {loading ? (
              <div className="text-gray-400 ml-8">Memuat...</div>
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
              rules.map((rule, idx) => (
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
                  handleAddEmptyRule={handleAddEmptyRule}
                  handleBulkPasteLast={handleBulkPasteLast}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </ComponentCard>
  );
};

export default ToDontListCard; 