# Auto-Mixer Types

## Core Types

### Track Types

```typescript
interface Track {
    id: string;
    fileName: string;
    duration: number;  // in milliseconds
    buffer: AudioBuffer;
    waveform: Float32Array;
}

interface CurrentTrack extends Track {
    segmentStart: number;  // in milliseconds
    segmentEnd: number;    // in milliseconds
    transitionPoint?: number;
}

interface NextTrack extends Track {
    scheduledStart?: number;  // in milliseconds
}
```

### Mix Types

```typescript
interface MixSegment {
    id: string;
    trackId: string;
    mixStartTime: number;  // absolute position in mix
    trackStartTime: number;  // start point in source track
    duration: number;      // segment duration
    transitionOut?: boolean;
}

interface MixState {
    currentTrack?: CurrentTrack;
    nextTrack?: NextTrack;
    segments: MixSegment[];
    totalDuration: number;
    currentTime: number;
    isPlaying: boolean;
}
```

### Time Types

```typescript
interface TimePoint {
    mixTime: number;    // position in total mix
    trackTime: number;  // position in current track
    segmentId: string;
}

interface TransitionPoint {
    sourceTrackId: string;
    targetTrackId: string;
    timeInSource: number;  // when in source track
    mixPosition: number;   // absolute position in mix
}
```

### Control Types

```typescript
interface TransportState {
    isPlaying: boolean;
    currentTime: number;
    currentTrackTime: number;
    totalDuration: number;
}

interface TransitionState {
    isPending: boolean;
    sourceTrack?: CurrentTrack;
    targetTrack?: NextTrack;
    transitionPoint?: number;
}
```

## Action Types

```typescript
type MixAction =
    | { type: 'LOAD_TRACK'; payload: Track }
    | { type: 'SET_CURRENT_TRACK'; payload: Track }
    | { type: 'SET_NEXT_TRACK'; payload: Track }
    | { type: 'SET_TRANSITION_POINT'; payload: number }
    | { type: 'EXECUTE_TRANSITION' }
    | { type: 'UPDATE_POSITION'; payload: number }
    | { type: 'SET_PLAYBACK'; payload: boolean }
    | { type: 'CLEAR_NEXT_TRACK' }
    | { type: 'RESET_MIX' };
```

## Utility Types

```typescript
interface TimeRange {
    start: number;
    end: number;
}

interface WaveformData {
    data: Float32Array;
    length: number;
    scale: number;
}

type TimeFormat = 'ms' | 'seconds' | 'timestamp';
```

## Component Props

```typescript
interface TimelineProps {
    segments: MixSegment[];
    currentTime: number;
    totalDuration: number;
    zoom: number;
    onPositionChange: (time: number) => void;
}

interface TransportProps {
    isPlaying: boolean;
    currentTime: number;
    totalDuration: number;
    onPlayPause: () => void;
    onSeek: (time: number) => void;
}

interface TrackListProps {
    tracks: Track[];
    currentTrack?: CurrentTrack;
    nextTrack?: NextTrack;
    onTrackSelect: (track: Track) => void;
}
```

## Error Types

```typescript
interface MixError {
    code: string;
    message: string;
    details?: any;
}

type ErrorHandler = (error: MixError) => void;
```
