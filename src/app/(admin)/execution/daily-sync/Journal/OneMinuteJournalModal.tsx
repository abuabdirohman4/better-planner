'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Spinner from '@/components/ui/spinner/Spinner';

interface OneMinuteJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (whatDone: string, whatThink: string) => Promise<void>;
  taskTitle?: string;
  duration: number;
  isRetrying?: boolean;
  retryCount?: number;
}

const OneMinuteJournalModal: React.FC<OneMinuteJournalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  taskTitle,
  duration,
  isRetrying = false,
  retryCount = 0
}) => {
  const [whatDone, setWhatDone] = useState('');
  const [whatThink, setWhatThink] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setWhatDone('');
      setWhatThink('');
      setIsSaving(false);
    }
  }, [isOpen, taskTitle, duration]);

  const handleSave = async () => {
    if (!whatDone.trim()) {
      toast.error('Silakan isi apa yang telah Anda selesaikan');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(whatDone.trim(), whatThink.trim());
      toast.success('Jurnal berhasil disimpan!');
      onClose();
    } catch (error) {
      console.error('Error saving journal:', error);
      
      // ✅ MOBILE FIX: Better error handling for mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (isMobile) {
        // More specific error messages for mobile
        if (errorMessage.includes('No activity log found')) {
          toast.error('Sesi timer tidak ditemukan. Silakan coba lagi.');
        } else if (errorMessage.includes('User not authenticated')) {
          toast.error('Sesi login telah berakhir. Silakan login ulang.');
        } else {
          toast.error('Gagal menyimpan jurnal. Periksa koneksi internet Anda.');
        }
      } else {
        toast.error('Gagal menyimpan jurnal');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} menit`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h} jam` : `${h} jam ${m} menit`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">One Minute Journal</h2>
            <div className="relative mb-3">
              <button
                type="button"
                className="w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
              >
                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              {/* Tooltip */}
              {showTooltip && (
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                  <div className="space-y-1">
                    <p className="font-medium mb-1">Tips One Minute Journal:</p>
                    <ul className="space-y-1">
                      <li>• Jujur dan spesifik dalam menjawab</li>
                      <li>• Fokus pada pembelajaran dan insight</li>
                      <li>• Bisa diisi singkat atau detail sesuai kebutuhan</li>
                    </ul>
                  </div>
                  {/* Arrow */}
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              )}
            </div>
          </div>
          <h4 className="text-center text-gray-700 mb-4">Jurnalkan jawaban atas pertanyaan berikut setiap kali selesai menjalani Sesi Fokus.</h4>
          {taskTitle && (
            <p className="text-blue-600 font-medium text-center">
              {taskTitle}
            </p>
          )}
          <p className="text-gray-600 text-center">
            Sesi Fokus selesai - {formatDuration(duration)}
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {/* Question 1 */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              1. Proyek/tugas apa yang baru saja saya selesaikan?
            </label>
            <textarea
              value={whatDone}
              onChange={(e) => setWhatDone(e.target.value)}
              placeholder="Jelaskan secara singkat apa yang telah Anda kerjakan atau selesaikan..."
              className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none text-base focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              disabled={isSaving}
              autoFocus
            />
            <div className="text-xs text-gray-500 mt-1">
              {whatDone.length}/500 karakter
            </div>
          </div>

          {/* Question 2 */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              2. Apakah ada bagian proyek/tugas itu yang masih saya pikirkan?
            </label>
            <textarea
              value={whatThink}
              onChange={(e) => setWhatThink(e.target.value)}
              placeholder="Bagikan pemikiran, ide, atau hal yang masih mengganjal di pikiran Anda..."
              className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none text-base focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              disabled={isSaving}
            />
            <div className="text-xs text-gray-500 mt-1">
              {whatThink.length}/500 karakter
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleSkip}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            disabled={isSaving}
          >
            Lewati
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors ${
              isSaving || !whatDone.trim()
                ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                : 'bg-brand-500 text-white hover:bg-brand-600'
            }`}
            disabled={isSaving || !whatDone.trim()}
          >
            {isSaving ? (
              <>
                <Spinner size={16} className="mr-2" />
                {isRetrying ? `Mencoba ulang... (${retryCount}/2)` : 'Menyimpan...'}
              </>
            ) : (
              'Simpan'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OneMinuteJournalModal;
