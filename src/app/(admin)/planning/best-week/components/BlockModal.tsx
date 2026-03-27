"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CATEGORY_CONFIG, DAY_CODES, DAY_SHORT_LABELS } from '@/lib/best-week/constants';
import type { ActivityCategory, BlockFormData, DayCode, BestWeekBlock } from '@/lib/best-week/types';
import { addBlock, updateBlock, deleteBlock } from '../actions';

interface BlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  templateId: string;
  prefill?: { start_time: string; end_time: string; day: DayCode };
  block?: BestWeekBlock;
}

const DEFAULT_FORM: BlockFormData = {
  title: '',
  category: 'high_lifetime_value',
  days: [],
  start_time: '09:00',
  end_time: '10:00',
  description: '',
};

export default function BlockModal({
  isOpen, onClose, onSave, templateId, prefill, block
}: BlockModalProps) {
  const [form, setForm] = useState<BlockFormData>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = !!block;

  useEffect(() => {
    if (!isOpen) return;
    if (block) {
      setForm({
        title: block.title,
        category: block.category,
        days: block.days,
        start_time: block.start_time.substring(0, 5),
        end_time: block.end_time.substring(0, 5),
        description: block.description ?? '',
      });
    } else if (prefill) {
      setForm({ ...DEFAULT_FORM, start_time: prefill.start_time, end_time: prefill.end_time, days: [prefill.day] });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [isOpen, block, prefill]);

  const toggleDay = (day: DayCode) => {
    setForm(f => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isEdit && block) {
        await updateBlock(block.id, form);
        toast.success('Block berhasil diupdate');
      } else {
        await addBlock(templateId, form);
        toast.success('Block berhasil ditambahkan');
      }
      onSave();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Gagal menyimpan block');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!block) return;
    if (!confirm('Hapus block ini?')) return;
    setIsSaving(true);
    try {
      await deleteBlock(block.id);
      toast.success('Block berhasil dihapus');
      onSave();
      onClose();
    } catch {
      toast.error('Gagal menghapus block');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
            {isEdit ? 'Edit Block' : 'Tambah Block'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Judul</label>
            <input
              autoFocus
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Shalat Tahajud, Kerja, Free..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kategori</label>
            <div className="space-y-1">
              {(Object.keys(CATEGORY_CONFIG) as ActivityCategory[]).map(cat => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.category === cat}
                    onChange={() => setForm(f => ({ ...f, category: cat }))}
                  />
                  <span className="text-sm">
                    {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hari</label>
            <div className="flex gap-2 flex-wrap">
              {DAY_CODES.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                    form.days.includes(day)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {DAY_SHORT_LABELS[day]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mulai</label>
              <input
                type="time"
                value={form.start_time}
                onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selesai</label>
              <input
                type="time"
                value={form.end_time}
                onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deskripsi <span className="text-gray-400">(opsional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Keterangan tambahan..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-gray-100 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div>
            {isEdit && (
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Hapus Block
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
