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
