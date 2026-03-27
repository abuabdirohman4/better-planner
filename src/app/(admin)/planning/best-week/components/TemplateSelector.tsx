"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import type { BestWeekTemplate } from '@/lib/best-week/types';
import { createTemplate, setActiveTemplate, deleteTemplate } from '../actions';

interface TemplateSelectorProps {
  templates: BestWeekTemplate[];
  activeTemplate: BestWeekTemplate | null;
  onMutate: () => void;
}

export default function TemplateSelector({ templates, activeTemplate, onMutate }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createTemplate(newName.trim());
      onMutate();
      setNewName('');
      setIsCreating(false);
      toast.success('Template berhasil dibuat');
    } catch {
      toast.error('Gagal membuat template');
    }
  };

  const handleSetActive = async (templateId: string) => {
    try {
      await setActiveTemplate(templateId);
      onMutate();
      setIsOpen(false);
    } catch {
      toast.error('Gagal mengaktifkan template');
    }
  };

  const handleDelete = async (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    if (!confirm('Hapus template ini? Semua blocks akan ikut terhapus.')) return;
    try {
      await deleteTemplate(templateId);
      onMutate();
      toast.success('Template berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus template');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <span>{activeTemplate?.name ?? 'Pilih Template'}</span>
        <span className="text-gray-400">▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            {templates.map(t => (
              <div
                key={t.id}
                onClick={() => handleSetActive(t.id)}
                className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <span className={`text-sm ${t.is_active ? 'font-semibold text-blue-600' : ''}`}>
                  {t.is_active ? '✓ ' : ''}{t.name}
                </span>
                {templates.length > 1 && (
                  <button
                    onClick={(e) => handleDelete(e, t.id)}
                    className="text-gray-400 hover:text-red-500 text-xs px-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <div className="border-t border-gray-200 dark:border-gray-700 p-2">
              {isCreating ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    placeholder="Nama template..."
                    className="flex-1 text-sm px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                  <button onClick={handleCreate} className="text-sm text-blue-600 font-medium">OK</button>
                  <button onClick={() => setIsCreating(false)} className="text-sm text-gray-400">✕</button>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full text-left text-sm text-blue-600 hover:text-blue-700 px-1"
                >
                  + Template Baru
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
