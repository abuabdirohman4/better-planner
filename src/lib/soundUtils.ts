/**
 * Sound Utilities for Timer Notifications
 * Menggunakan Web Audio API untuk built-in sounds dan custom sounds
 */

export interface SoundOption {
  id: string;
  name: string;
  type: 'custom';
  description: string;
  emoji: string;
  filePath: string; // Path untuk custom audio files
}

// Timer sound options using WAV files (for Pomodoro timer)
export const TIMER_SOUND_OPTIONS: SoundOption[] = [
  {
    id: 'none',
    name: 'No Sound',
    type: 'custom',
    description: 'Silent - no timer sound',
    emoji: '🔇',
    filePath: ''
  },
  {
    id: 'boxing',
    name: 'Boxing',
    type: 'custom',
    description: 'Punchy boxing bell',
    emoji: '🥊',
    filePath: '/audio/boxing.WAV'
  },
  {
    id: 'children',
    name: 'Children',
    type: 'custom',
    description: 'Playful children chime',
    emoji: '👶',
    filePath: '/audio/children.WAV'
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    type: 'custom',
    description: 'Epic cinematic sound',
    emoji: '🎬',
    filePath: '/audio/cinematic.WAV'
  },
  {
    id: 'crowd',
    name: 'Crowd',
    type: 'custom',
    description: 'Crowd cheering',
    emoji: '👥',
    filePath: '/audio/crowd.WAV'
  },
  {
    id: 'crystal',
    name: 'Crystal',
    type: 'custom',
    description: 'Crystal clear chime',
    emoji: '💎',
    filePath: '/audio/crystal.WAV'
  },
  {
    id: 'forecast',
    name: 'Forecast',
    type: 'custom',
    description: 'Weather forecast tone',
    emoji: '🌤️',
    filePath: '/audio/forecast.WAV'
  }
];

// Task completion sound options (for task completion notifications)
export const COMPLETION_SOUND_OPTIONS: SoundOption[] = [
  {
    id: 'smooth-notify',
    name: 'Smooth Notify',
    type: 'custom',
    description: 'Smooth notification alert',
    emoji: '🔔',
    filePath: '/audio/smooth-notify-alert-toast-warn.wav'
  },
  {
    id: 'pop-up-notify',
    name: 'Pop Up Notify',
    type: 'custom',
    description: 'Pop up notification alert',
    emoji: '🔔',
    filePath: '/audio/pop-up-notify-smooth-modern.wav'
  }
];

// Backward compatibility - keep SOUND_OPTIONS for timer
export const SOUND_OPTIONS = TIMER_SOUND_OPTIONS;

// Load custom audio file
async function loadCustomAudio(filePath: string): Promise<AudioBuffer> {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load audio file: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error('Error loading custom audio:', error);
    throw error;
  }
}

// Play sound function
export async function playSound(soundId: string, volume: number = 0.5): Promise<void> {
  try {
    // Handle "No Sound" option
    if (soundId === 'none') {
      return; // Silent - no sound played
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (!audioContext) {
      console.warn('Web Audio API not supported, falling back to system sound');
      // Fallback to system beep
      return;
    }

    // Find sound option
    const soundOption = SOUND_OPTIONS.find(option => option.id === soundId);
    if (!soundOption) {
      throw new Error(`Sound option not found: ${soundId}`);
    }

    let buffer: AudioBuffer;

    if (soundOption.type === 'custom' && soundOption.filePath) {
      // Load custom audio file
      buffer = await loadCustomAudio(soundOption.filePath);
    } else {
      throw new Error(`Unsupported sound type: ${soundOption.type}`);
    }

    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    
    source.buffer = buffer;
    gainNode.gain.value = volume;
    
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    source.start();
  } catch (error) {
    console.error('Error playing sound:', error);
    // Fallback to system notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer Complete!');
    }
  }
}

// Play timer completion sound
export async function playTimerCompleteSound(
  soundId: string, 
  volume: number = 0.5, 
  taskTitle?: string
): Promise<void> {
  // Play the selected sound
  await playSound(soundId, volume);
}

// Get sound option by ID
export function getSoundOption(soundId: string): SoundOption | undefined {
  return SOUND_OPTIONS.find(option => option.id === soundId);
}

// Default sound settings
export const DEFAULT_SOUND_SETTINGS = {
  soundId: 'success',
  volume: 0.5,
  enabled: true
};
