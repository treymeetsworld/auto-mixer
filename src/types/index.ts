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
}

export interface TimelineSegment {
  trackId: string;
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
