"use client";

import React, { useState, useCallback } from 'react';
import { useBestWeekTemplates } from './hooks/useBestWeekTemplates';
import { useBestWeekBlocks } from './hooks/useBestWeekBlocks';
import TemplateSelector from './components/TemplateSelector';
import WeeklyGrid from './components/WeeklyGrid';
import BlockModal from './components/BlockModal';
import HourSummary from './components/HourSummary';
import { createTemplate } from './actions';
import type { BestWeekBlock, DayCode } from '@/lib/best-week/types';

export default function BestWeekClient() {
  const { templates, activeTemplate, mutate: mutateTemplates, isLoading: loadingTemplates } = useBestWeekTemplates();
  const { blocks, mutate: mutateBlocks, isLoading: loadingBlocks } = useBestWeekBlocks(activeTemplate?.id ?? null);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    prefill?: { start_time: string; end_time: string; day: DayCode };
    block?: BestWeekBlock;
  }>({ isOpen: false });

  const handleAddBlock = useCallback((prefill: { start_time: string; end_time: string; day: DayCode }) => {
    setModalState({ isOpen: true, prefill });
  }, []);

  const handleEditBlock = useCallback((block: BestWeekBlock) => {
    setModalState({ isOpen: true, block });
  }, []);

  const handleModalSave = useCallback(() => {
    mutateBlocks();
  }, [mutateBlocks]);

  const handleCreateFirst = async () => {
    await createTemplate('Template Q1');
    mutateTemplates();
  };

  if (loadingTemplates) {
    return <div className="animate-pulse h-96 bg-gray-100 dark:bg-gray-800 rounded-lg" />;
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-4xl mb-4">📅</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Belum Ada Template Best Week</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
          Rancang jadwal ideal mingguanmu untuk menjalani minggu terbaik secara konsisten.
        </p>
        <button
          onClick={handleCreateFirst}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
        >
          Buat Template Pertama
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <TemplateSelector
          templates={templates}
          activeTemplate={activeTemplate}
          onMutate={mutateTemplates}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loadingBlocks ? (
          <div className="animate-pulse h-96 bg-gray-100 dark:bg-gray-800" />
        ) : (
          <>
            <WeeklyGrid
              blocks={blocks}
              onAddBlock={handleAddBlock}
              onEditBlock={handleEditBlock}
            />
            <HourSummary blocks={blocks} />
          </>
        )}
      </div>

      {activeTemplate && (
        <BlockModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState({ isOpen: false })}
          onSave={handleModalSave}
          templateId={activeTemplate.id}
          prefill={modalState.prefill}
          block={modalState.block}
        />
      )}
    </div>
  );
}
