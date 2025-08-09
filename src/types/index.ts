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
  isPlaying: boolean; // Playback state
  currentTime: number; // Current playback position (ms)
  volume: number; // Volume level (0-1)
  isMuted: boolean; // Mute state
  playbackRate: number; // Playback speed (0.5-2.0)
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
  | { type: 'SET_TRANSITION'; payload: { transitionPoint: number } }
  | { type: 'ADD_SEGMENT_TO_TIMELINE'; payload: { segment: Segment } }
  | { type: 'PLAY_PAUSE' }
  | { type: 'UPDATE_PLAYBACK_TIME'; payload: { currentTime: number } }
  | { type: 'STOP_PLAYBACK' }
  | { type: 'SEEK_TO_TIME'; payload: { time: number } }
  | { type: 'SET_VOLUME'; payload: { volume: number } }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_PLAYBACK_RATE'; payload: { rate: number } };
