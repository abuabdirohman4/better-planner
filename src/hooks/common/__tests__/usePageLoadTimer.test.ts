import { renderHook, act } from '@testing-library/react';
import { usePageLoadTimer } from '../usePageLoadTimer';

// Mock timer functions
jest.useFakeTimers();

describe('usePageLoadTimer', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  it('should start timing immediately when component mounts', () => {
    const { result } = renderHook(() => usePageLoadTimer(true));
    
    // Advance timer by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(result.current).toBe(1.0);
  });

  it('should stop timing when loading becomes false', () => {
    const { result, rerender } = renderHook(
      ({ isLoading }) => usePageLoadTimer(isLoading),
      { initialProps: { isLoading: true } }
    );
    
    // Advance timer by 2 seconds while loading
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current).toBe(2.0);
    
    // Stop loading
    act(() => {
      rerender({ isLoading: false });
    });
    
    // Advance timer more - should not change
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(result.current).toBe(2.0);
  });

  it('should format time to 1 decimal place', () => {
    const { result } = renderHook(() => usePageLoadTimer(true));
    
    // Advance timer by 1.23 seconds
    act(() => {
      jest.advanceTimersByTime(1230);
    });
    
    expect(result.current).toBe(1.2);
  });

  it('should cleanup interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const { unmount } = renderHook(() => usePageLoadTimer(true));
    
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
}); 