// Core types for the auto-mixer

export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number; // in seconds
}

export interface TransitionPoint {
  songId: string;
  startTime: number; // where current song should transition (in seconds)
  nextSongStartTime?: number;  // where next song should start playing (optional, defaults to 0)
  currentSegmentId?: string; // which segment this transition is for
  nextSegmentId?: string; // which segment the transition is going to
}

export interface TimelineSegment {
  segmentId: string; // Unique ID for this specific segment instance
  trackId: string;   // Original track ID (can be duplicate)
  track: Track;
  startTime: number; // when this segment starts in master timeline
  endTime: number;   // when this segment ends in master timeline
  trackStartTime: number; // where in the actual track this segment starts
  trackEndTime: number;   // where in the actual track this segment ends
  isTransition?: boolean;
}

export interface MasterTimeline {
  segments: TimelineSegment[];
  totalDuration: number;
  transitions: {
    masterTime: number;
    fromTrack: string;
    toTrack: string;
  }[];
}
