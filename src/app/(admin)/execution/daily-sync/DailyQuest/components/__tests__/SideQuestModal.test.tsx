import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/stores/quarterStore', () => ({ useQuarterStore: () => ({ year: 2026, quarter: 4 }) }));
vi.mock('@/lib/icons', () => ({ EyeIcon: () => null, EyeCloseIcon: () => null }));
const quests = [
  { id: 'q1', title: 'Balas email klien', status: 'TODO', description: null },
  { id: 'q2', title: 'Telepon bengkel', status: 'TODO', description: null },
];
vi.mock('@/app/(admin)/quests/side-quests/hooks/useSideQuests', () => ({
  useSideQuests: () => ({ sideQuests: quests, isLoading: false, error: null, refetch: vi.fn() }),
}));

import SideQuestModal from '../SideQuestModal';

// Seperti DailySyncClient: pilihan dikirim ke induk, induk render ulang dengan array existing yang baru.
function Host() {
  const [picks, setPicks] = useState<{ id: string }[]>([]);
  const existing = ['q1'].filter(Boolean); // array baru tiap render
  return (
    <>
      <SideQuestModal isOpen onClose={() => {}} onSave={() => {}} onSelectionChange={setPicks} existingSideQuests={existing} />
      <output data-testid="picks">{picks.map((p) => p.id).join(',')}</output>
    </>
  );
}

describe('SideQuestModal (bug 7 Okt 2026: Side Quest tidak bisa dipilih)', () => {
  it('centang bertahan walau induk render ulang setelah menerima pilihan', () => {
    render(<Host />);
    expect(screen.getByTestId('picks').textContent).toBe('q1');
    const boxes = screen.getAllByRole('checkbox');
    fireEvent.click(boxes[1]); // pilih q2
    expect(screen.getByTestId('picks').textContent).toBe('q1,q2');
    fireEvent.click(boxes[0]); // lepas q1
    expect(screen.getByTestId('picks').textContent).toBe('q2');
  });
});
