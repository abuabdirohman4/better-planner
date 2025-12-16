import { useEffect, useState } from 'react';
import Button from '@/components/ui/button/Button';

interface BreakPromptProps {
  isVisible: boolean;
  lastFocusDuration: number; // in seconds
  onStartBreak: (type: 'SHORT' | 'MEDIUM' | 'LONG') => void;
  onSkip: () => void;
}

export default function BreakPrompt({
  isVisible,
  lastFocusDuration,
  onStartBreak,
  onSkip
}: BreakPromptProps) {
  // Determine recommended break
  // < 45 mins (2700s) -> Short (5m)
  // 45 - 75 mins (2700s - 4500s) -> Medium (10m)
  // > 75 mins (4500s) -> Long (15m)

  let recommendedType: 'SHORT' | 'MEDIUM' | 'LONG' = 'SHORT';
  if (lastFocusDuration >= 4500) { // 75 mins
    recommendedType = 'LONG';
  } else if (lastFocusDuration >= 2700) { // 45 mins
    recommendedType = 'MEDIUM';
  }

  // Simple animation state
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => setShow(true), 10);
    } else {
      setShow(false);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
    >
      <div className="text-center p-4 flex flex-col items-center gap-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Session Complete!
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Time for a break?
        </p>

        <div className="flex flex-col gap-2 w-full max-w-[120px]">
          {recommendedType === 'SHORT' && (
            <Button
              size="sm"
              variant="primary"
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              onClick={() => onStartBreak('SHORT')}
            >
              Take 5m
            </Button>
          )}

          {recommendedType === 'MEDIUM' && (
            <Button
              size="sm"
              variant="primary"
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              onClick={() => onStartBreak('MEDIUM')}
            >
              Take 10m
            </Button>
          )}

          {recommendedType === 'LONG' && (
            <Button
              size="sm"
              variant="primary"
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              onClick={() => onStartBreak('LONG')}
            >
              Take 15m
            </Button>
          )}

          <div className="pt-1 flex gap-2 justify-center">
            {/* Secondary options if needed, but keeping it simple for now based on request */}
            {/* Maybe a 'Skip' button is enough */}
          </div>

          <Button
            size="sm"
            variant="plain"
            className="text-gray-500 hover:text-gray-700"
            onClick={onSkip}
          >
            Skip Break
          </Button>
        </div>
      </div>
    </div>
  );
}
