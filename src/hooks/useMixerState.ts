import { useState, useCallback } from 'react';
import type { Track, TransitionPoint, MasterTimeline } from '../types';
import { calculateMasterTimeline, getMasterTimeFromTrackTime } from '../utils/timeline';

interface MixerState {
  // Playback state
  currentTrack: Track;
  nextTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  currentMasterTime: number;
  
  // Timeline state
  masterTimeline: MasterTimeline;
  transitionPoint: TransitionPoint | null;
  
  // Internal transition state
  isInTransition: boolean;
  isInSecondSegment: boolean;
  lastTransition: TransitionPoint | null;
  
  // Audio control state
  shouldAutoPlay: boolean;
  nextStartTime: number;
}

export function useMixerState(initialTracks: Track[]) {
  // Consolidated state object
  const [state, setState] = useState<MixerState>(() => ({
    currentTrack: initialTracks[0],
    nextTrack: null,
    isPlaying: false,
    currentTime: 0,
    currentMasterTime: 0,
    masterTimeline: calculateMasterTimeline(initialTracks[0], null, null),
    transitionPoint: null,
    isInTransition: false,
    isInSecondSegment: false,
    lastTransition: null,
    shouldAutoPlay: false,
    nextStartTime: 0,
  }));

  // Update multiple state properties atomically
  const updateState = useCallback((updates: Partial<MixerState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  // Handle time updates with master time calculation
  const handleTimeUpdate = useCallback((time: number) => {
    const masterTime = getMasterTimeFromTrackTime(state.masterTimeline, state.currentTrack.id, time);
    
    updateState({
      currentTime: time,
      currentMasterTime: masterTime
    });

    // Check for transitions
    if (state.transitionPoint && state.nextTrack && time >= state.transitionPoint.startTime && !state.isInTransition) {
      const startTime = state.transitionPoint.nextSongStartTime || 0;
      const isSameSongTransition = state.currentTrack.id === state.nextTrack.id;
      
      updateState({
        isInTransition: true,
        lastTransition: state.transitionPoint,
        currentTrack: state.nextTrack,
        nextTrack: null,
        transitionPoint: null,
        nextStartTime: startTime,
        shouldAutoPlay: true,
        currentTime: startTime,
        isInSecondSegment: true
      });

      // Return transition info for audio player handling
      return { 
        shouldTransition: true, 
        startTime, 
        isSameSongTransition,
        newTrack: state.nextTrack 
      };
    }

    return { shouldTransition: false };
  }, [state, updateState]);

  // Handle track selection
  const selectTrack = useCallback((track: Track) => {
    if (!state.currentTrack) {
      const newTimeline = calculateMasterTimeline(track, null, null);
      updateState({
        currentTrack: track,
        currentTime: 0,
        nextStartTime: 0,
        shouldAutoPlay: false,
        masterTimeline: newTimeline,
        currentMasterTime: 0
      });
    } else {
      updateState({ nextTrack: track });
    }
  }, [state.currentTrack, updateState]);

  // Handle transition setting
  const setTransition = useCallback((transition: TransitionPoint) => {
    const newTimeline = calculateMasterTimeline(state.currentTrack, state.nextTrack, transition);
    updateState({
      transitionPoint: transition,
      lastTransition: transition,
      masterTimeline: newTimeline
    });
  }, [state.currentTrack, state.nextTrack, updateState]);

  // Clear next track
  const clearNext = useCallback(() => {
    const newTimeline = calculateMasterTimeline(state.currentTrack, null, null);
    updateState({
      nextTrack: null,
      transitionPoint: null,
      masterTimeline: newTimeline
    });
  }, [state.currentTrack, updateState]);

  // Handle playback controls
  const setPlaying = useCallback((playing: boolean) => {
    updateState({ isPlaying: playing });
  }, [updateState]);

  // Handle seeking
  const seek = useCallback((masterTime: number) => {
    updateState({ currentMasterTime: masterTime });
  }, [updateState]);

  // Reset auto-play state
  const resetAutoPlay = useCallback(() => {
    updateState({
      shouldAutoPlay: false,
      nextStartTime: 0,
      isInTransition: false
    });
  }, [updateState]);

  // Recalculate timeline when needed
  const recalculateTimeline = useCallback(() => {
    if (!state.isInTransition) {
      let newTimeline: MasterTimeline;
      
      if (state.isInSecondSegment && state.lastTransition && !state.nextTrack && !state.transitionPoint) {
        newTimeline = calculateMasterTimeline(state.currentTrack, null, state.lastTransition, true);
      } else if (state.nextTrack && state.transitionPoint) {
        newTimeline = calculateMasterTimeline(state.currentTrack, state.nextTrack, state.transitionPoint);
      } else if (state.nextTrack && !state.transitionPoint) {
        // Next track selected but no transition yet - keep current timeline
        return;
      } else {
        newTimeline = calculateMasterTimeline(state.currentTrack, null, null);
      }
      
      updateState({ masterTimeline: newTimeline });
    }
  }, [state, updateState]);

  return {
    // State
    ...state,
    
    // Actions
    handleTimeUpdate,
    selectTrack,
    setTransition,
    clearNext,
    setPlaying,
    seek,
    resetAutoPlay,
    recalculateTimeline
  };
}
