import { useEffect } from 'react';
import type { MixerState } from '../types/enhanced';

const STORAGE_KEY = 'auto-mixer-state';

export function usePersistentState(state: MixerState) {
  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedState = JSON.parse(stored);
        // Could dispatch a RESTORE_STATE action here if we wanted to restore everything
        console.log('Previous state found:', parsedState);
      }
    } catch (error) {
      console.warn('Failed to load state from localStorage:', error);
    }
  }, []);

  // Save important state to localStorage when it changes
  useEffect(() => {
    try {
      const stateToSave = {
        timeline: state.timeline,
        queue: {
          currentTrack: state.queue.currentTrack,
          nextTrack: state.queue.nextTrack,
          transitionPoint: state.queue.transitionPoint,
        },
        // Don't save playback state as it should reset on reload
        savedAt: new Date().toISOString(),
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save state to localStorage:', error);
    }
  }, [state.timeline, state.queue.currentTrack, state.queue.nextTrack, state.queue.transitionPoint]);
}

export function clearPersistedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear persisted state:', error);
  }
}
