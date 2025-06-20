import { useEffect } from 'react';
import { MIXER_CONFIG } from '../config';

interface KeyboardShortcutsOptions {
  onPlayPause: () => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  disabled?: boolean;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
  useEffect(() => {
    if (options.disabled) return;
    
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Prevent default behavior for our shortcuts
      const { key } = event;
      
      switch (key) {
        case MIXER_CONFIG.SHORTCUTS.PLAY_PAUSE:
          event.preventDefault();
          options.onPlayPause();
          break;
          
        case MIXER_CONFIG.SHORTCUTS.SEEK_BACKWARD:
          event.preventDefault();
          options.onSeekBackward();
          break;
          
        case MIXER_CONFIG.SHORTCUTS.SEEK_FORWARD:
          event.preventDefault();
          options.onSeekForward();
          break;
          
        case MIXER_CONFIG.SHORTCUTS.VOLUME_UP:
          event.preventDefault();
          options.onVolumeUp();
          break;
          
        case MIXER_CONFIG.SHORTCUTS.VOLUME_DOWN:
          event.preventDefault();
          options.onVolumeDown();
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [options]);
}
