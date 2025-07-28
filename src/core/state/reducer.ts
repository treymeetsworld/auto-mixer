import type { AppState, ActionType } from '../../types';
import { createSegment, calculateTimelineDuration, updateSegmentEnd } from '../timeline/TimelineUtils';

export function createInitialState(): AppState {
  return {
    sources: {},
    timeline: {
      segments: [],
      duration: 0
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
          segments: newSegments,
          duration: newDuration
        },
        currentTrack: state.nextTrack,
        nextTrack: null
      };
    }

    default:
      return state;
  }
}
