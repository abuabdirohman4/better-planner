import { renderHook, act } from '@testing-library/react';

import { usePageTimer } from '../usePageTimer';

// Mock timer functions
jest.useFakeTimers();

describe('usePageTimer', () => {
  it('should start at 0 seconds', () => {
    const { result } = renderHook(() => usePageTimer());
    expect(result.current).toBe(0);
  });

  it('should increment every second', () => {
    const { result } = renderHook(() => usePageTimer());
    
    // Advance timer by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(1);
    
    // Advance timer by another 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current).toBe(3);
  });

  it('should cleanup interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const { unmount } = renderHook(() => usePageTimer());
    
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
}); 