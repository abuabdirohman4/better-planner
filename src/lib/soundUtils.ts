/**
 * Sound Utilities for Timer Notifications
 * Menggunakan Web Audio API untuk built-in sounds dan custom sounds
 */

export interface SoundOption {
  id: string;
  name: string;
  type: 'builtin' | 'custom' | 'tts';
  description: string;
  emoji: string;
}

// Built-in sound options menggunakan Web Audio API
export const SOUND_OPTIONS: SoundOption[] = [
  {
    id: 'boxing',
    name: 'Boxing',
    type: 'builtin',
    description: 'Punchy boxing bell',
    emoji: '🥊'
  },
  {
    id: 'children',
    name: 'Children',
    type: 'builtin',
    description: 'Playful children chime',
    emoji: '👶'
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    type: 'builtin',
    description: 'Epic cinematic sound',
    emoji: '🎬'
  },
  {
    id: 'crowd',
    name: 'Crowd',
    type: 'builtin',
    description: 'Crowd cheering',
    emoji: '👥'
  },
  {
    id: 'crystal',
    name: 'Crystal',
    type: 'builtin',
    description: 'Crystal clear chime',
    emoji: '💎'
  },
  {
    id: 'forecast',
    name: 'Forecast',
    type: 'builtin',
    description: 'Weather forecast tone',
    emoji: '🌤️'
  },
  {
    id: 'hitech',
    name: 'Hi-Tech',
    type: 'builtin',
    description: 'Futuristic tech sound',
    emoji: '🤖'
  },
  {
    id: 'jingle',
    name: 'Jingle',
    type: 'builtin',
    description: 'Festive jingle bells',
    emoji: '🔔'
  },
  {
    id: 'reveal',
    name: 'Reveal',
    type: 'builtin',
    description: 'Mysterious reveal sound',
    emoji: '✨'
  },
  {
    id: 'simple',
    name: 'Simple',
    type: 'builtin',
    description: 'Simple beep sound',
    emoji: '🔔'
  },
  {
    id: 'success',
    name: 'Success',
    type: 'builtin',
    description: 'Success notification',
    emoji: '✅'
  },
  {
    id: 'success_trumpet',
    name: 'Success Trumpet',
    type: 'builtin',
    description: 'Victory trumpet fanfare',
    emoji: '🎺'
  },
  {
    id: 'ragtime',
    name: 'Ragtime',
    type: 'builtin',
    description: 'Classic ragtime piano',
    emoji: '🎹'
  },
  {
    id: 'uprise',
    name: 'Uprise',
    type: 'builtin',
    description: 'Rising motivational tone',
    emoji: '📈'
  },
  {
    id: 'yay',
    name: 'Yay!',
    type: 'builtin',
    description: 'Celebratory yay sound',
    emoji: '🎉'
  },
  {
    id: 'tts',
    name: 'Voice Announcement',
    type: 'tts',
    description: 'Text-to-speech announcement',
    emoji: '🗣️'
  }
];

// Generate built-in sounds using Web Audio API
export function generateBuiltInSound(soundId: string): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (!audioContext) {
      reject(new Error('Web Audio API not supported'));
      return;
    }

    const duration = 0.5; // 0.5 seconds
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate different sound patterns
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let value = 0;

      switch (soundId) {
        case 'boxing':
          // Punchy boxing bell - sharp attack, quick decay
          value = Math.sin(2 * Math.PI * 1200 * t) * Math.exp(-t * 8) + 
                  Math.sin(2 * Math.PI * 800 * t) * 0.3 * Math.exp(-t * 6);
          break;
        case 'children':
          // Playful children chime - high pitched, bouncy
          value = (Math.sin(2 * Math.PI * 1047 * t) + Math.sin(2 * Math.PI * 1319 * t)) * 0.4 * 
                  (1 + 0.3 * Math.sin(2 * Math.PI * 3 * t)) * Math.exp(-t * 2);
          break;
        case 'cinematic':
          // Epic cinematic sound - dramatic sweep
          value = Math.sin(2 * Math.PI * (200 + 400 * t) * t) * Math.exp(-t * 1.5) + 
                  Math.sin(2 * Math.PI * 440 * t) * 0.5 * Math.exp(-t * 2);
          break;
        case 'crowd':
          // Crowd cheering - multiple voices
          value = (Math.sin(2 * Math.PI * 300 * t) + 
                   Math.sin(2 * Math.PI * 400 * t) + 
                   Math.sin(2 * Math.PI * 500 * t)) * 0.2 * 
                  (1 + 0.5 * Math.sin(2 * Math.PI * 2 * t)) * Math.exp(-t * 1.5);
          break;
        case 'crystal':
          // Crystal clear chime - pure, bell-like
          value = (Math.sin(2 * Math.PI * 523 * t) + 
                   Math.sin(2 * Math.PI * 659 * t) + 
                   Math.sin(2 * Math.PI * 784 * t) + 
                   Math.sin(2 * Math.PI * 1047 * t)) * 0.15 * Math.exp(-t * 3);
          break;
        case 'forecast':
          // Weather forecast tone - calm, professional
          value = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 2) + 
                  Math.sin(2 * Math.PI * 554 * t) * 0.3 * Math.exp(-t * 2.5);
          break;
        case 'hitech':
          // Futuristic tech sound - electronic, synthetic
          value = Math.sin(2 * Math.PI * 800 * t) * (1 + 0.5 * Math.sin(2 * Math.PI * 10 * t)) * 
                  Math.exp(-t * 1.5) + 
                  Math.sin(2 * Math.PI * 1200 * t) * 0.3 * Math.exp(-t * 2);
          break;
        case 'jingle':
          // Festive jingle bells - merry, bright
          value = (Math.sin(2 * Math.PI * 523 * t) + 
                   Math.sin(2 * Math.PI * 659 * t) + 
                   Math.sin(2 * Math.PI * 784 * t)) * 0.3 * 
                  (1 + 0.2 * Math.sin(2 * Math.PI * 4 * t)) * Math.exp(-t * 2);
          break;
        case 'reveal':
          // Mysterious reveal sound - magical, ascending
          value = Math.sin(2 * Math.PI * (300 + 200 * t) * t) * Math.exp(-t * 1.8) + 
                  Math.sin(2 * Math.PI * 600 * t) * 0.4 * Math.exp(-t * 2.5);
          break;
        case 'simple':
          // Simple beep sound - clean, basic
          value = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 3);
          break;
        case 'success':
          // Success notification - positive, uplifting
          value = (Math.sin(2 * Math.PI * 523 * t) + 
                   Math.sin(2 * Math.PI * 659 * t) + 
                   Math.sin(2 * Math.PI * 784 * t)) * 0.2 * Math.exp(-t * 1);
          break;
        case 'success_trumpet':
          // Victory trumpet fanfare - triumphant, brass-like
          value = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 1.2) + 
                  Math.sin(2 * Math.PI * 554 * t) * 0.6 * Math.exp(-t * 1.5) + 
                  Math.sin(2 * Math.PI * 659 * t) * 0.4 * Math.exp(-t * 1.8);
          break;
        case 'ragtime':
          // Classic ragtime piano - jazzy, syncopated
          value = Math.sin(2 * Math.PI * 440 * t) * (1 + 0.3 * Math.sin(2 * Math.PI * 2 * t)) * 
                  Math.exp(-t * 2) + 
                  Math.sin(2 * Math.PI * 554 * t) * 0.5 * Math.exp(-t * 2.5);
          break;
        case 'uprise':
          // Rising motivational tone - ascending, inspiring
          value = Math.sin(2 * Math.PI * (200 + 300 * t) * t) * Math.exp(-t * 1.5) + 
                  Math.sin(2 * Math.PI * 400 * t) * 0.4 * Math.exp(-t * 2);
          break;
        case 'yay':
          // Celebratory yay sound - excited, joyful
          value = (Math.sin(2 * Math.PI * 523 * t) + 
                   Math.sin(2 * Math.PI * 659 * t) + 
                   Math.sin(2 * Math.PI * 784 * t) + 
                   Math.sin(2 * Math.PI * 1047 * t)) * 0.25 * 
                  (1 + 0.4 * Math.sin(2 * Math.PI * 5 * t)) * Math.exp(-t * 1.2);
          break;
        default:
          value = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 2);
      }

      data[i] = value;
    }

    resolve(buffer);
  });
}

// Play sound function
export async function playSound(soundId: string, volume: number = 0.5): Promise<void> {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (!audioContext) {
      console.warn('Web Audio API not supported, falling back to system sound');
      // Fallback to system beep
      return;
    }

    const buffer = await generateBuiltInSound(soundId);
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

// Text-to-Speech function
export function speakText(text: string, volume: number = 0.8): void {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    // Try to use a pleasant voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.includes('en') && 
      (voice.name.includes('Google') || voice.name.includes('Microsoft'))
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    speechSynthesis.speak(utterance);
  }
}

// Play timer completion sound with TTS
export async function playTimerCompleteSound(
  soundId: string, 
  volume: number = 0.5, 
  taskTitle?: string
): Promise<void> {
  // Play the selected sound
  if (soundId === 'tts') {
    const message = taskTitle 
      ? `Timer complete! Great work on ${taskTitle}` 
      : 'Timer complete! Great work!';
    speakText(message, volume);
  } else {
    await playSound(soundId, volume);
  }
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
