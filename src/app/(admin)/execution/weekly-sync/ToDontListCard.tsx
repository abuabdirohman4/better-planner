"use client";

import React, { useEffect, useState, useRef } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import CustomToast from "@/components/ui/toast/CustomToast";
import { getWeeklyRules, addWeeklyRule, updateWeeklyRule, deleteWeeklyRule } from "./actions";

interface ToDontListCardProps {
  year: number;
  weekNumber: number;
}

type Rule = {
  id: string;
  rule_text: string;
  display_order: number;
};

const ToDontListCard: React.FC<ToDontListCardProps> = ({ year, weekNumber }) => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [newRule, setNewRule] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Add new rule
  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    const formData = new FormData();
    formData.append("rule_text", newRule);
    formData.append("year", String(year));
    formData.append("week_number", String(weekNumber));
    const res = await addWeeklyRule(formData);
    if (res.success) {
      setNewRule("");
      CustomToast.success(res.message);
      // Refresh list
      const data = await getWeeklyRules(year, weekNumber);
      setRules(data);
    } else {
      CustomToast.error("Gagal", res.message);
    }
  };

  // Start editing
  const handleEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Save edit
  const handleSaveEdit = async (id: string) => {
    if (!editingText.trim()) return;
    const res = await updateWeeklyRule(id, editingText);
    if (res.success) {
      CustomToast.success(res.message);
      setEditingId(null);
      setEditingText("");
      // Refresh list
      const data = await getWeeklyRules(year, weekNumber);
      setRules(data);
    } else {
      CustomToast.error("Gagal", res.message);
    }
  };

  // Delete rule
  const handleDelete = async (id: string) => {
    if (!confirm("Hapus aturan ini?")) return;
    const res = await deleteWeeklyRule(id);
    if (res.success) {
      CustomToast.success(res.message);
      // Refresh list
      const data = await getWeeklyRules(year, weekNumber);
      setRules(data);
    } else {
      CustomToast.error("Gagal", res.message);
    }
  };

  return (
    <ComponentCard title="To Don't List"  classNameTitle='text-center text-xl !font-extrabold' classNameHeader="pt-8 pb-0" className="mb-6">
      <div className="space-y-2">
        {loading ? (
          <div className="text-gray-400">Memuat...</div>
        ) : rules.length === 0 ? (
          <div className="text-gray-400">Belum ada aturan.</div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {rules.map((rule) => (
              <li key={rule.id} className="flex items-center py-2 group">
                {editingId === rule.id ? (
                  <>
                    <input
                      ref={inputRef}
                      className="flex-1 border rounded px-2 py-1 mr-2 dark:bg-gray-800"
                      value={editingText}
                      onChange={e => setEditingText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") handleSaveEdit(rule.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <Button size="sm" variant="primary" onClick={() => handleSaveEdit(rule.id)} className="mr-1">Simpan</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Batal</Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-gray-900 dark:text-white">{rule.rule_text}</span>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(rule.id, rule.rule_text)} className="mr-1 opacity-0 group-hover:opacity-100 transition">Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(rule.id)} className="!text-red-600 !border-red-400 hover:!bg-red-50 dark:hover:!bg-red-900/20 opacity-0 group-hover:opacity-100 transition">Hapus</Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={handleAddRule} className="flex gap-2 mt-4">
        <Input
          value={newRule}
          onChange={e => setNewRule(e.target.value)}
          placeholder="Tambah aturan baru..."
          className="flex-1"
        />
        <Button type="submit" variant="primary">Tambah</Button>
      </form>
    </ComponentCard>
  );
};

export default ToDontListCard; 