# Auto-Mixer Type Definitions

## Core Type System

The Auto-Mixer uses comprehensive TypeScript types to ensure type safety and clear interfaces throughout the application.

## Primary Interfaces

### AudioSource
```typescript
interface AudioSource {
  id: string;              // Unique identifier for the source
  url: string;             // File URL or blob URL
  duration: number;        // Track duration in milliseconds
  name: string;            // Display name (filename)
  buffer?: AudioBuffer;    // Decoded audio buffer (optional until loaded)
}
```
**Purpose**: Represents a loaded audio file with metadata and buffer
**Usage**: Stored in `state.sources` dictionary, referenced by segments

### Segment
```typescript
interface Segment {
  id: string;              // Unique segment identifier
  sourceId: string;        // Reference to AudioSource id
  segmentStart: number;    // Start time in source track (ms)
  segmentEnd: number;      // End time in source track (ms)
  segmentDuration: number; // Calculated duration (segmentEnd - segmentStart)
}
```
**Purpose**: Represents a portion of an audio track on the timeline
**Usage**: Timeline consists of ordered array of segments

### Timeline
```typescript
interface Timeline {
  duration: number;        // Total timeline duration (sum of all segments)
  isPlaying: boolean;      // Current playback state
  currentTime: number;     // Current playback position in timeline (ms)
}
```
**Purpose**: Manages overall timeline state and playback position
**Usage**: Central timing authority for the application

### AppState
```typescript
interface AppState {
  sources: Record<string, AudioSource>;  // Dictionary of loaded audio files
  segments: Segment[];                   // Ordered timeline segments
  timeline: Timeline;                    // Timeline state and position
  currentTrack: string | null;           // Currently selected track ID
  nextTrack: string | null;              // Next track for transition
  volume: number;                        // Master volume (0-1)
  isMuted: boolean;                      // Mute state
  playbackRate: number;                  // Playback speed (0.5-2.0)
}
```
**Purpose**: Complete application state structure
**Usage**: Managed by reducer, provided through React Context

## Action Type System

### Core Actions
```typescript
type ActionType = 
  // Source Management
  | { type: 'LOAD_SOURCE'; payload: AudioSource }
  
  // Track Selection Workflow
  | { type: 'SELECT_FIRST_TRACK'; payload: { sourceId: string } }
  | { type: 'SELECT_NEXT_TRACK'; payload: { sourceId: string } }
  | { type: 'SET_TRANSITION'; payload: { transitionPoint: number } }
  
  // Playback Controls
  | { type: 'PLAY_PAUSE' }
  | { type: 'STOP_PLAYBACK' }
  | { type: 'UPDATE_PLAYBACK_TIME'; payload: { currentTime: number } }
  | { type: 'SEEK_TO_TIME'; payload: { time: number } }
  
  // Audio Controls
  | { type: 'SET_VOLUME'; payload: { volume: number } }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_PLAYBACK_RATE'; payload: { rate: number } }
  
  // Advanced Operations
  | { type: 'ADD_TRACK_WITH_TRANSITION'; payload: { sourceId: string; transitionPoint: number } };
```

### Action Categories

#### 1. Source Management
- **`LOAD_SOURCE`**: Add new audio source to sources dictionary
- **Payload**: Complete `AudioSource` object with buffer

#### 2. Track Selection Workflow
- **`SELECT_FIRST_TRACK`**: Initialize timeline with first track
- **`SELECT_NEXT_TRACK`**: Queue track for transition
- **`SET_TRANSITION`**: Execute transition at specified point

#### 3. Playback Controls
- **`PLAY_PAUSE`**: Toggle playback state
- **`STOP_PLAYBACK`**: Stop and reset to beginning
- **`UPDATE_PLAYBACK_TIME`**: Real-time position updates
- **`SEEK_TO_TIME`**: User-initiated seeking

#### 4. Audio Controls
- **`SET_VOLUME`**: Master volume adjustment
- **`TOGGLE_MUTE`**: Mute/unmute toggle
- **`SET_PLAYBACK_RATE`**: Speed adjustment

## Component Props

### Common Interface Patterns
```typescript
// Components typically receive state and dispatch
interface ComponentProps {
  // No direct props - components use useAudio() hook
}

// Audio hook return type
interface AudioContextType {
  state: AppState;
  dispatch: React.Dispatch<ActionType>;
  audioEngine: AudioEngine;
}
```

## Utility Types

### Time Conversion
```typescript
// Helper functions expect milliseconds
type TimeInMs = number;
type TimeInSeconds = number;

// Common conversion utilities
function msToSeconds(ms: TimeInMs): TimeInSeconds;
function secondsToMs(seconds: TimeInSeconds): TimeInMs;
function formatTime(ms: TimeInMs): string; // "MM:SS" format
```

### Audio Engine Integration
```typescript
// AudioEngine method signatures
interface AudioEngine {
  loadAudio(url: string): Promise<AudioBuffer>;
  play(buffer: AudioBuffer, startOffset?: number, volume?: number, rate?: number): Promise<void>;
  pause(): void;
  stop(): void;
  seekTo(timeMs: number, buffer?: AudioBuffer, volume?: number, rate?: number): Promise<void>;
  getCurrentTime(): number;
  setVolume(volume: number): void;
  setPlaybackRate(rate: number): void;
  isPlaying: boolean;
}
```

## Type Safety Benefits

### 1. **Compile-Time Validation**
- All state updates verified against ActionType union
- Component props and state access type-checked
- Audio engine operations with proper parameter types

### 2. **IntelliSense Support**
- Auto-completion for action types and payloads
- Property discovery for state objects
- Method signatures for audio engine operations

### 3. **Refactoring Safety**
- Changes to interfaces propagate throughout codebase
- Unused properties and actions identified
- Breaking changes caught at compile time

### 4. **Documentation Through Types**
- Self-documenting interfaces with clear property purposes
- Action payload structures define expected data
- Component contracts defined through prop interfaces

## Type Evolution

### Adding New Features
1. **Extend Interfaces**: Add new properties with optional types initially
2. **Update Actions**: Add new action types to ActionType union
3. **Update Reducer**: Handle new actions in reducer logic
4. **Component Integration**: Use new types in components with full type safety

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
