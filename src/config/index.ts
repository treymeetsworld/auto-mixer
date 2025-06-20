// Configuration and constants for the mixer

export const MIXER_CONFIG = {
  // Audio settings
  AUDIO: {
    FADE_DURATION: 2000, // milliseconds
    VOLUME_STEP: 0.1,
    SEEK_STEP: 5, // seconds
    UPDATE_INTERVAL: 100, // milliseconds for time updates
  },
  
  // UI settings
  UI: {
    TIMELINE_HEIGHT: 60,
    TIMELINE_SEGMENTS_MIN_WIDTH: 20,
    CONTROL_BUTTON_SIZE: 48,
    PROGRESS_UPDATE_THROTTLE: 50,
  },
  
  // Performance
  PERFORMANCE: {
    DEBOUNCE_SEEK: 100,
    THROTTLE_TIME_UPDATE: 50,
    MAX_TIMELINE_SEGMENTS: 50,
  },
  
  // Keyboard shortcuts
  SHORTCUTS: {
    PLAY_PAUSE: ' ', // spacebar
    SEEK_BACKWARD: 'ArrowLeft',
    SEEK_FORWARD: 'ArrowRight',
    VOLUME_UP: 'ArrowUp',
    VOLUME_DOWN: 'ArrowDown',
  },
  
  // Development
  DEV: {
    ENABLE_LOGGING: import.meta.env.DEV,
    ENABLE_DEV_TOOLS: import.meta.env.DEV,
    MOCK_AUDIO_DURATION: 240, // seconds, for testing
  }
} as const;

// Utility function for feature flags
export function isFeatureEnabled(feature: keyof typeof MIXER_CONFIG.DEV): boolean {
  return MIXER_CONFIG.DEV[feature] as boolean;
}

// Logging utility that respects config
export const logger = {
  info: (...args: any[]) => {
    if (MIXER_CONFIG.DEV.ENABLE_LOGGING) {
      console.log('[Auto-Mixer]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (MIXER_CONFIG.DEV.ENABLE_LOGGING) {
      console.warn('[Auto-Mixer]', ...args);
    }
  },
  error: (...args: any[]) => {
    console.error('[Auto-Mixer]', ...args);
  },
  debug: (...args: any[]) => {
    if (MIXER_CONFIG.DEV.ENABLE_LOGGING) {
      console.debug('[Auto-Mixer]', ...args);
    }
  }
};
