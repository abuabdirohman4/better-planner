import { useState } from 'react';

export function useSubtaskState() {
  const [focusSubtaskId, setFocusSubtaskId] = useState<string | null>(null);
  const [draftTitles, setDraftTitles] = useState<Record<string, string>>({});

  return {
    focusSubtaskId,
    setFocusSubtaskId,
    draftTitles,
    setDraftTitles
  };
}
