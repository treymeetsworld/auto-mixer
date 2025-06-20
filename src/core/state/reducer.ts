import type { AppState, ActionType, Segment, AudioSource } from '../../types';

export function createInitialState(): AppState {
    return {
        timeline: {
            segments: [],
            duration: 0,
            currentTime: 0,
            isPlaying: false,
            zoom: 1,
            volume: 1,
            muted: false
        },
        sources: {},
        currentTrackId: null,
        nextTrackId: null
    };
}

export function reducer(state: AppState, action: ActionType): AppState {
    switch (action.type) {
        case 'ADD_SEGMENT':
            return {
                ...state,
                timeline: {
                    ...state.timeline,
                    segments: [...state.timeline.segments, action.payload]
                }
            };

        case 'REMOVE_SEGMENT':
            return {
                ...state,
                timeline: {
                    ...state.timeline,
                    segments: state.timeline.segments.filter(
                        segment => segment.id !== action.payload
                    )
                }
            };

        case 'UPDATE_SEGMENT':
            return {
                ...state,
                timeline: {
                    ...state.timeline,
                    segments: state.timeline.segments.map(segment =>
                        segment.id === action.payload.id ? action.payload : segment
                    )
                }
            };

        case 'LOAD_SOURCE':
            return {
                ...state,
                sources: {
                    ...state.sources,
                    [action.payload.id]: action.payload
                }
            };

        case 'SET_PLAYBACK':
            return {
                ...state,
                timeline: {
                    ...state.timeline,
                    isPlaying: action.payload.isPlaying
                }
            };

        case 'SET_CURRENT_TIME':
            return {
                ...state,
                timeline: {
                    ...state.timeline,
                    currentTime: action.payload.time
                }
            };

        case 'SET_VOLUME':
            return {
                ...state,
                timeline: {
                    ...state.timeline,
                    volume: action.payload.volume
                }
            };

        case 'SET_MUTED':
            return {
                ...state,
                timeline: {
                    ...state.timeline,
                    muted: action.payload.muted
                }
            };

        case 'SET_CURRENT_TRACK':
            return {
                ...state,
                currentTrackId: action.payload.trackId
            };

        case 'SET_NEXT_TRACK':
            return {
                ...state,
                nextTrackId: action.payload.trackId
            };

        default:
            return state;
    }
}
