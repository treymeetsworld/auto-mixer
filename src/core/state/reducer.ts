import type { AppState, ActionType, Segment } from '../../types';

// Helper function to calculate timeline duration from segments
function calculateTimelineDuration(segments: Segment[]): number {
  return segments.reduce((total, segment) => total + segment.segmentDuration, 0);
}

// Helper function to create a segment
function createSegment(id: string, sourceId: string, segmentStart: number, segmentEnd: number): Segment {
  return {
    id,
    sourceId,
    segmentStart,
    segmentEnd,
    segmentDuration: segmentEnd - segmentStart
  };
}

export function createInitialState(): AppState {
  return {
    sources: {},
    segments: [],
    timeline: {
      duration: 0,
      isPlaying: false,
      currentTime: 0
    },
    currentTrack: null,
    nextTrack: null,
    volume: 0.8,
    isMuted: false,
    playbackRate: 1.0
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
      // Step 1: Initial Track Selection - track gets full duration initially
      const source = state.sources[action.payload.sourceId];
      if (!source) return state;

      const firstSegment = createSegment(
        `segment-${action.payload.sourceId}-1`,
        action.payload.sourceId,
        0,
        source.duration
      );

      return {
        ...state,
        segments: [firstSegment],
        timeline: {
          ...state.timeline,
          duration: source.duration
        },
        currentTrack: action.payload.sourceId
      };
    }

    case 'SELECT_NEXT_TRACK': {
      // Step 2: Next Track Selection - just set the nextTrack, no segments yet
      return {
        ...state,
        nextTrack: action.payload.sourceId
      };
    }

    case 'SET_TRANSITION': {
      // Step 3: Transition Point Setting - truncate current segment and add next segment  
      if (!state.currentTrack || !state.nextTrack) return state;

      const nextSource = state.sources[state.nextTrack];
      if (!nextSource) return state;

      // Truncate the last segment (current track) at transition point
      const updatedSegments = state.segments.map(segment => {
        if (segment.sourceId === state.currentTrack) {
          return createSegment(
            segment.id,
            segment.sourceId,
            segment.segmentStart,
            action.payload.transitionPoint
          );
        }
        return segment;
      });

      // Create next segment with full duration initially, allowing custom start offset
      const startOffset = Math.max(0, Math.min(nextSource.duration, action.payload.nextStartOffset ?? 0));
      const nextSegment = createSegment(
        `segment-${state.nextTrack}-1`,
        state.nextTrack,
        startOffset,
        nextSource.duration
      );

      const newSegments = [...updatedSegments, nextSegment];

      return {
        ...state,
        segments: newSegments,
        timeline: {
          ...state.timeline,
          duration: calculateTimelineDuration(newSegments)
        },
        currentTrack: state.nextTrack,
        nextTrack: null
      };
    }

    case 'ADD_TRACK_WITH_TRANSITION': {
      // Add track and truncate previous track at transition point
      const source = state.sources[action.payload.sourceId];
      if (!source) return state;

      // Truncate the last segment at transition point
      const updatedSegments = state.segments.map((segment, index) => {
        if (index === state.segments.length - 1) {
          // This is the last segment, truncate it
          return createSegment(
            segment.id,
            segment.sourceId,
            segment.segmentStart,
            action.payload.transitionPoint
          );
        }
        return segment;
      });

      // Add new segment with full duration initially
      const newSegment = createSegment(
        `segment-${action.payload.sourceId}-1`,
        action.payload.sourceId,
        0,
        source.duration
      );

      const finalSegments = [...updatedSegments, newSegment];

      return {
        ...state,
        segments: finalSegments,
        timeline: {
          ...state.timeline,
          duration: calculateTimelineDuration(finalSegments)
        }
      };
    }

    case 'PLAY_PAUSE': {
      return {
        ...state,
        timeline: {
          ...state.timeline,
          isPlaying: !state.timeline.isPlaying
        }
      };
    }

    case 'UPDATE_PLAYBACK_TIME': {
      return {
        ...state,
        timeline: {
          ...state.timeline,
          currentTime: action.payload.currentTime
        }
      };
    }

    case 'STOP_PLAYBACK': {
      return {
        ...state,
        timeline: {
          ...state.timeline,
          isPlaying: false,
          currentTime: 0
        }
      };
    }

    case 'SEEK_TO_TIME': {
      return {
        ...state,
        timeline: {
          ...state.timeline,
          // Update position without altering play state so UI doesn't stop when seeking during playback
          currentTime: action.payload.time
        }
      };
    }

    case 'SET_VOLUME': {
      return {
        ...state,
        volume: action.payload.volume
      };
    }

    case 'TOGGLE_MUTE': {
      return {
        ...state,
        isMuted: !state.isMuted
      };
    }

    case 'SET_PLAYBACK_RATE': {
      return {
        ...state,
        playbackRate: Math.max(0.25, Math.min(2.0, action.payload.rate))
      };
    }

    case 'REMOVE_SEGMENT': {
      const remaining = state.segments.filter(s => s.id !== action.payload.segmentId);
      const newDuration = calculateTimelineDuration(remaining);

      // Adjust currentTrack/nextTrack if they reference removed or nonexistent segments
      const currentStillExists = remaining.some(s => s.sourceId === state.currentTrack);
      const nextStillExists = remaining.some(s => s.sourceId === state.nextTrack);

      return {
        ...state,
        segments: remaining,
        timeline: {
          ...state.timeline,
          duration: newDuration,
          currentTime: Math.min(state.timeline.currentTime, newDuration)
        },
        currentTrack: currentStillExists ? state.currentTrack : (remaining[0]?.sourceId ?? null),
        nextTrack: nextStillExists ? state.nextTrack : null
      };
    }

    default:
      return state;
  }
}
