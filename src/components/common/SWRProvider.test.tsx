import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import SWRProvider from './SWRProvider';

// Mock SWR to capture the configuration and provider function
type SWRConfigValue = {
  provider?: () => Map<string, unknown>;
  [key: string]: unknown;
};
const mockSWRConfig = jest.fn();
jest.mock('swr', () => ({
  SWRConfig: ({ children, value }: { children: React.ReactNode; value: SWRConfigValue }) => {
    mockSWRConfig(value);
    // Call the provider function to test localStorage interactions
    if (value.provider) {
      value.provider();
    }
    return children;
  },
}));

// Mock localStorage
const localStorageMock: Storage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

// Mock window.addEventListener
const addEventListenerMock = jest.fn();

describe('SWRProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (localStorageMock.getItem as jest.Mock).mockReturnValue('[]');
    
    // Setup window mocks
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    Object.defineProperty(window, 'addEventListener', {
      value: addEventListenerMock,
      writable: true,
    });
  });

  it('should render children correctly', () => {
    render(
      <SWRProvider>
        <div data-testid="test-child">Test Child</div>
      </SWRProvider>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should configure SWR with localStorage provider', () => {
    render(
      <SWRProvider>
        <div>Test</div>
      </SWRProvider>
    );

    expect(mockSWRConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: expect.any(Function),
      })
    );
  });

  it('should restore cache from localStorage on initialization', () => {
    const mockCacheData: [string, unknown][] = [
      ['test-key-1', { data: 'test-data-1' }],
      ['test-key-2', { data: 'test-data-2' }],
    ];
    (localStorageMock.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockCacheData));

    render(
      <SWRProvider>
        <div>Test</div>
      </SWRProvider>
    );

    expect(localStorageMock.getItem).toHaveBeenCalledWith('swr-cache');
  });

  it('should handle empty localStorage gracefully', () => {
    (localStorageMock.getItem as jest.Mock).mockReturnValue(null);

    render(
      <SWRProvider>
        <div>Test</div>
      </SWRProvider>
    );

    expect(localStorageMock.getItem).toHaveBeenCalledWith('swr-cache');
    // Should not throw error
  });

  it('should handle invalid localStorage data gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    (localStorageMock.getItem as jest.Mock).mockReturnValue('invalid-json');

    render(
      <SWRProvider>
        <div>Test</div>
      </SWRProvider>
    );

    expect(localStorageMock.getItem).toHaveBeenCalledWith('swr-cache');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to parse SWR cache from localStorage:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should add beforeunload event listener', () => {
    render(
      <SWRProvider>
        <div>Test</div>
      </SWRProvider>
    );

    expect(addEventListenerMock).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });

  it('should persist cache to localStorage on beforeunload', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    render(
      <SWRProvider>
        <div>Test</div>
      </SWRProvider>
    );

    // Get the beforeunload handler
    const beforeunloadHandler = addEventListenerMock.mock.calls[0][1];
    
    // Simulate beforeunload event
    beforeunloadHandler();

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'swr-cache',
      expect.any(String)
    );

    consoleSpy.mockRestore();
  });

  it('should handle localStorage setItem errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    (localStorageMock.setItem as jest.Mock).mockImplementation(() => {
      throw new Error('localStorage quota exceeded');
    });

    render(
      <SWRProvider>
        <div>Test</div>
      </SWRProvider>
    );

    // Get the beforeunload handler
    const beforeunloadHandler = addEventListenerMock.mock.calls[0][1];
    
    // Simulate beforeunload event
    beforeunloadHandler();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to persist SWR cache to localStorage:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should include all swrConfig properties', () => {
    render(
      <SWRProvider>
        <div>Test</div>
      </SWRProvider>
    );

    const config = mockSWRConfig.mock.calls[0][0];
    
    // Check that all swrConfig properties are included
    expect(config).toHaveProperty('revalidateOnFocus');
    expect(config).toHaveProperty('revalidateOnReconnect');
    expect(config).toHaveProperty('revalidateIfStale');
    expect(config).toHaveProperty('dedupingInterval');
    expect(config).toHaveProperty('focusThrottleInterval');
    expect(config).toHaveProperty('errorRetryCount');
    expect(config).toHaveProperty('errorRetryInterval');
    expect(config).toHaveProperty('keepPreviousData');
    expect(config).toHaveProperty('refreshInterval');
    expect(config).toHaveProperty('provider');
  });
}); 