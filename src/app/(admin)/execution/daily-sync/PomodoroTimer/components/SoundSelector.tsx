'use client';
import React, { useState, useEffect } from 'react';
import { useSoundStore } from '@/stores/soundStore';
import { SOUND_OPTIONS, playSound } from '@/lib/soundUtils';

interface SoundSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const SoundSelector: React.FC<SoundSelectorProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, isLoading, loadSettings } = useSoundStore();
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  // Load settings from server when component mounts
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, loadSettings]);

  if (!isOpen) return null;

  const handleSoundSelect = async (soundId: string) => {
    updateSettings({ soundId });
    // Auto-play sound when selected
    await playPreview(soundId);
  };

  const handleVolumeChange = (volume: number) => {
    updateSettings({ volume: volume / 100 });
  };

  const playPreview = async (soundId: string) => {
    if (isPlaying) return;
    
    setIsPlaying(soundId);
    try {
      await playSound(soundId, settings.volume);
    } catch (error) {
      console.error('Error playing preview:', error);
    } finally {
      setTimeout(() => setIsPlaying(null), 1000);
    }
  };

  return (
    <>
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-webkit-slider-track {
          height: 8px;
          border-radius: 4px;
        }
        
        .slider::-moz-range-track {
          height: 8px;
          border-radius: 4px;
        }
      `}</style>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Timer Sound Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="mb-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500"></div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              Loading settings...
            </span>
          </div>
        )}

        {/* Sound Options */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Choose Sound
          </h3>
          {SOUND_OPTIONS.map((option) => (
            <div
              key={option.id}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                settings.soundId === option.id
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleSoundSelect(option.id)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{option.emoji}</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {option.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {option.description}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playPreview(option.id);
                  }}
                  disabled={isPlaying === option.id}
                  className="p-2 text-gray-500 hover:text-brand-500 disabled:opacity-50"
                >
                  {isPlaying === option.id ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
                    </svg>
                  )}
                </button>
                {settings.soundId === option.id && (
                  <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Volume Control */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Volume: {Math.round(settings.volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(settings.volume * 100)}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${settings.volume * 100}%, #e5e7eb ${settings.volume * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Close
          </button>
          <button
            onClick={() => playPreview(settings.soundId)}
            disabled={isPlaying === settings.soundId}
            className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 disabled:opacity-50"
          >
            {isPlaying === settings.soundId ? 'Playing...' : 'Test Sound'}
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default SoundSelector;
