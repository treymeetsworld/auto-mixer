import type { AppState, ActionType } from '../../types';

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

      const segment = {
        id: `segment-${action.payload.sourceId}-1`,
        sourceId: action.payload.sourceId,
        segmentStart: 0,
        segmentEnd: source.duration,
        timelineStart: 0
      };

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
          return {
            ...segment,
            segmentEnd: action.payload.transitionPoint
          };
        }
        return segment;
      });

      // Create next segment
      const nextSegment = {
        id: `segment-${state.nextTrack}-1`,
        sourceId: state.nextTrack,
        segmentStart: 0,
        segmentEnd: nextSource.duration,
        timelineStart: action.payload.transitionPoint
      };

      const newSegments = [...updatedSegments, nextSegment];
      const newDuration = action.payload.transitionPoint + nextSource.duration;

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
