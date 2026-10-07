import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DailyQuestModal from '../DailyQuestModal';

// Keseragaman modal pilih quest (7 Okt 2026): klik kotak dan klik teks sama-sama memilih, tepat sekali.
describe('DailyQuestModal', () => {
  const tasks = [{ id: 'd1', title: 'Cleaning House' }] as never[];
  it('klik kotak memilih tepat sekali (tidak dibatalkan klik baris)', () => {
    const toggle = vi.fn();
    render(<DailyQuestModal isOpen onClose={() => {}} tasks={tasks} selectedTasks={{}} onTaskToggle={toggle} onSave={() => {}} isLoading={false} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(toggle).toHaveBeenCalledTimes(1);
  });
  it('klik teks juga memilih', () => {
    const toggle = vi.fn();
    render(<DailyQuestModal isOpen onClose={() => {}} tasks={tasks} selectedTasks={{}} onTaskToggle={toggle} onSave={() => {}} isLoading={false} />);
    fireEvent.click(screen.getByText('Cleaning House'));
    expect(toggle).toHaveBeenCalledWith('d1');
    expect(toggle).toHaveBeenCalledTimes(1);
  });
});
