// Audio Source Types
export interface AudioSource {
    id: string;
    url: string;
    duration: number;
    name: string;
    waveform?: number[];
    buffer?: AudioBuffer;
}

// Timeline Types
export interface Segment {
    id: string;
    sourceId: string;
    startTime: number;     // Position in timeline (ms)
    duration: number;      // Duration of segment (ms)
    sourceOffset: number;  // Start position in source audio (ms)
    volume: number;       // 0-1
    muted: boolean;
}

export interface Timeline {
    segments: Segment[];
    duration: number;     // Total timeline duration
    currentTime: number;  // Current playback position
    isPlaying: boolean;
    zoom: number;        // Zoom level for UI
}

// State Types
export interface AppState {
    timeline: Timeline;
    sources: Record<string, AudioSource>;
}

// Action Types
export type ActionType = 
    | { type: 'ADD_SEGMENT'; payload: Segment }
    | { type: 'REMOVE_SEGMENT'; payload: string }
    | { type: 'UPDATE_SEGMENT'; payload: Segment }
    | { type: 'LOAD_SOURCE'; payload: AudioSource }
    | { type: 'SET_PLAYBACK'; payload: { isPlaying: boolean } }
    | { type: 'SET_CURRENT_TIME'; payload: { time: number } };

// Utility Types
export interface TimeRange {
    start: number;
    end: number;
}
