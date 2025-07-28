import type { AppState, ActionType } from '../../types';
import { createSegment, calculateTimelineDuration, updateSegmentEnd } from '../timeline/TimelineUtils';

export function createInitialState(): AppState {
  return {
    sources: {},
    timeline: {
      segments: [],
      duration: 0,
      isPlaying: false,
      currentTime: 0,
      volume: 0.8,
      isMuted: false,
      playbackRate: 1.0
    },
    currentTrack: null,
    nextTrack: null
  };
}

export function reducer(state: AppState, action: ActionType): AppState {
  switch (action.type) {
    case 'LOAD_SOURCE':
      return {
        ...state,
        sources: {
          ...state.sources,
          [action.payload.id]: action.payload
        }
      };

    case 'SELECT_FIRST_TRACK': {
      // Step 1 from LOGIC.md: Initial Track Selection
      const source = state.sources[action.payload.sourceId];
      if (!source) return state;

      const segment = createSegment(
        `segment-${action.payload.sourceId}-1`,
        source,
        0,
        source.duration,
        0
      );

      return {
        ...state,
        currentTrack: action.payload.sourceId,
        timeline: {
          ...state.timeline,
          segments: [segment],
          duration: source.duration
        }
      };
    }

    case 'SELECT_NEXT_TRACK':
      // Step 2 from LOGIC.md: Next Track Setup
      // Store as nextTrack, no timeline changes yet
      return {
        ...state,
        nextTrack: action.payload.sourceId
      };

    case 'SET_TRANSITION': {
      // Step 3 from LOGIC.md: Transition Point Setting
      if (!state.currentTrack || !state.nextTrack) return state;

      const nextSource = state.sources[state.nextTrack];
      if (!nextSource) return state;

      // Update current segment to end at transition point
      const updatedSegments = state.timeline.segments.map(segment => {
        if (segment.sourceId === state.currentTrack) {
          return updateSegmentEnd(segment, action.payload.transitionPoint);
        }
        return segment;
      });

      // Create next segment starting at transition point
      const nextSegment = createSegment(
        `segment-${state.nextTrack}-1`,
        nextSource,
        0,
        nextSource.duration,
        action.payload.transitionPoint
      );

      const newSegments = [...updatedSegments, nextSegment];
      const newDuration = calculateTimelineDuration(newSegments);

      return {
        ...state,
        timeline: {
          ...state.timeline,
          segments: newSegments,
          duration: newDuration
        },
        currentTrack: state.nextTrack,
        nextTrack: null
      };
    }

    case 'PLAY_PAUSE':
      return {
        ...state,
        timeline: {
          ...state.timeline,
          isPlaying: !state.timeline.isPlaying
        }
      };

    case 'UPDATE_PLAYBACK_TIME':
      return {
        ...state,
        timeline: {
          ...state.timeline,
          currentTime: action.payload.currentTime
        }
      };

    case 'STOP_PLAYBACK':
      return {
        ...state,
        timeline: {
          ...state.timeline,
          isPlaying: false,
          currentTime: 0
        }
      };

    case 'SEEK_TO_TIME':
      return {
        ...state,
        timeline: {
          ...state.timeline,
          currentTime: Math.max(0, Math.min(action.payload.time, state.timeline.duration))
        }
      };

    case 'SET_VOLUME':
      return {
        ...state,
        timeline: {
          ...state.timeline,
          volume: Math.max(0, Math.min(1, action.payload.volume))
        }
      };

    case 'TOGGLE_MUTE':
      return {
        ...state,
        timeline: {
          ...state.timeline,
          isMuted: !state.timeline.isMuted
        }
      };

    case 'SET_PLAYBACK_RATE':
      return {
        ...state,
        timeline: {
          ...state.timeline,
          playbackRate: Math.max(0.25, Math.min(2.0, action.payload.rate))
        }
      };

    default:
      return state;
  }
}
