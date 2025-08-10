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
  segmentDuration: number; // Duration of this segment (segmentEnd - segmentStart)
}

export interface Timeline {
  duration: number; // Total timeline duration (calculated from segments)
  isPlaying: boolean; // Playback state
  currentTime: number; // Current playback position (ms)
}

export interface AppState {
  sources: Record<string, AudioSource>;
  segments: Segment[]; // Segments are now separate from timeline
  timeline: Timeline;
  currentTrack: string | null;  // Currently selected track
  nextTrack: string | null;     // Next track waiting for transition
  volume: number; // Volume level (0-1)
  isMuted: boolean; // Mute state
  playbackRate: number; // Playback speed (0.5-2.0)
}

export type ActionType = 
  | { type: 'LOAD_SOURCE'; payload: AudioSource }
  | { type: 'SELECT_FIRST_TRACK'; payload: { sourceId: string } }
  | { type: 'SELECT_NEXT_TRACK'; payload: { sourceId: string } }
  | { type: 'SET_TRANSITION'; payload: { transitionPoint: number; nextStartOffset?: number } }
  | { type: 'ADD_TRACK_WITH_TRANSITION'; payload: { sourceId: string; transitionPoint: number } }
  | { type: 'REMOVE_SEGMENT'; payload: { segmentId: string } }
  | { type: 'PLAY_PAUSE' }
  | { type: 'UPDATE_PLAYBACK_TIME'; payload: { currentTime: number } }
  | { type: 'STOP_PLAYBACK' }
  | { type: 'SEEK_TO_TIME'; payload: { time: number } }
  | { type: 'SET_VOLUME'; payload: { volume: number } }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_PLAYBACK_RATE'; payload: { rate: number } };
