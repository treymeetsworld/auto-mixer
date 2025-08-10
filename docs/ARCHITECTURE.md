# Auto-Mixer Architecture

## Overview
The Auto-Mixer is a React-based DJ mixing application built with TypeScript, focusing on multi-track timeline management and sequential track mixing workflows.

## Core Architecture

### 1. State Management (`src/core/state/reducer.ts`)
- **Centralized Store**: Uses React's `useReducer` with comprehensive action types
- **Audio Context**: Provides audio-related state and controls via React Context
- **Timeline State**: Manages segments, sources, playback position, and track selection
- **Three-Step Workflow**: Track selection → Next track selection → Transition point setting

### 2. Audio Engine (`src/core/audio/AudioEngine.ts`)
- **Web Audio API**: Native browser audio processing with AudioContext
- **Buffer Management**: Loads and caches audio files as AudioBuffer objects
- **Playback Controls**: Play, pause, stop, seek, volume, and playback rate
- **Time Management**: Tracks playback position, handles seeking and resuming

### 3. Component Structure
```
src/
├── components/
│   ├── controls/          # AudioUpload, TransportControls, VolumeControls
│   ├── timeline/          # Timeline visualization and interaction
│   ├── playback/          # PlaybackControls component
│   └── transition/        # TransitionSettings component
├── core/
│   ├── audio/            # AudioEngine class
│   ├── state/            # Reducer and state management
│   └── AudioContext.tsx  # React Context provider
├── types/                # TypeScript definitions (AppState, ActionType, etc.)
└── styles/               # SCSS modular styling
```

## Key Design Principles

### 1. **Segment-Based Timeline**
- **Sources**: Original audio files with metadata (duration, buffer, etc.)
- **Segments**: Timeline portions referencing sources with start/end times
- **Sequential Flow**: Tracks are added and transitioned in chronological order

### 2. **Immutable State Updates**
- **Pure Reducer Functions**: All state changes through predictable actions
- **Type-Safe Actions**: Comprehensive ActionType union for all operations
- **State Snapshots**: Easy debugging and state inspection

### 3. **Performance Optimization**
- **Animation Frames**: 60fps timeline position updates during playback
- **Canvas Rendering**: High-performance waveform visualization
- **Efficient Seeking**: Minimal audio engine operations during timeline interaction

## Data Flow

### 1. Track Loading Workflow
```
File Upload → Audio Buffer Decode → LOAD_SOURCE Action → Sources State Update
```

### 2. Timeline Building Process
```
SELECT_FIRST_TRACK → First Segment Creation → SELECT_NEXT_TRACK → SET_TRANSITION → Segment Truncation & Addition
```

### 3. Playback Synchronization
```
Animation Frame → AudioEngine.getCurrentTime() → Timeline Position Update → UI Refresh
```

## State Structure

### Core State Interface
```typescript
interface AppState {
  sources: Record<string, Source>;     // Loaded audio files
  segments: Segment[];                 // Timeline segments
  timeline: TimelineState;             // Playback state
  currentTrack: string | null;         // Currently selected track
  nextTrack: string | null;            // Next track for transition
  volume: number;                      // Master volume
  isMuted: boolean;                    // Mute state
  playbackRate: number;                // Playback speed
}
```

### Timeline Management
- **Sequential Segments**: Each segment references a source with specific start/end times
- **Dynamic Duration**: Timeline duration calculated from segment durations
- **Transition Points**: Current segments truncated, next segments added
- **Playback Tracking**: Current time synchronized with audio engine

## Integration Points

### 1. React Context (`AudioContext.tsx`)
- Provides state, dispatch, and audioEngine to all components
- Manages AudioEngine lifecycle and initialization
- Handles global audio state coordination

### 2. Web Audio API
- Low-latency audio playback with precise timing
- AudioBuffer management for multiple tracks
- Gain nodes for volume control and effects

### 3. Component Communication
- Context-based state sharing between components
- Event-driven interactions (clicks, drags, uploads)
- Real-time UI updates synchronized with audio playback
