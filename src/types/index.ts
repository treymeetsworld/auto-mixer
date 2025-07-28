// Core types following LOGIC.md

export interface AudioSource {
  id: string;
  url: string;
  duration: number; // in milliseconds
  name: string;
  buffer?: AudioBuffer;
}

export interface Segment {
  id: string;
  sourceId: string;
  segmentStart: number;   // Where to start in source track (ms)
  segmentEnd: number;     // Where to end in source track (ms)
  timelineStart: number;  // When this segment starts in timeline (ms)
  timelineEnd: number;    // When this segment ends in timeline (ms)
  duration: number;       // Duration of this segment (segmentEnd - segmentStart)
}

export interface Timeline {
  segments: Segment[];
  duration: number; // Total timeline duration (ms)
}

export interface AppState {
  sources: Record<string, AudioSource>;
  timeline: Timeline;
  currentTrack: string | null;  // Currently selected track
  nextTrack: string | null;     // Next track waiting for transition
}

export type ActionType = 
  | { type: 'LOAD_SOURCE'; payload: AudioSource }
  | { type: 'SELECT_FIRST_TRACK'; payload: { sourceId: string } }
  | { type: 'SELECT_NEXT_TRACK'; payload: { sourceId: string } }
  | { type: 'SET_TRANSITION'; payload: { transitionPoint: number } };
