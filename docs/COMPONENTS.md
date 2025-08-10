# Auto-Mixer Components

## Component Architecture

### Core Structure
```
App.tsx                    # Main application component
├── AudioUpload            # File upload and source loading
├── PlaybackControls       # Transport controls wrapper
│   ├── TransportControls  # Play/pause/stop controls
│   └── VolumeControls     # Volume and mute controls
├── TimelineSection        # Timeline visualization and interaction
├── TransitionSettings     # Track selection and transition controls
└── SegmentDetails         # Selected segment information
```

## Component Details

### App.tsx (Main Component)
**Purpose**: Application root, state management, and audio coordination
**Key Features**:
- Audio Context provider integration
- Animation frame loop for playback tracking
- Global event handling and state updates
- Audio engine lifecycle management

### controls/AudioUpload
**Purpose**: File upload and audio source loading
**Features**:
- Drag & drop file upload interface
- Audio file validation (MP3, WAV support)
- Audio buffer decoding and source creation
- Error handling for invalid files
**State Actions**: `LOAD_SOURCE`

### controls/TransportControls
**Purpose**: Basic playback controls
**Features**:
- Play/Pause button with loading states
- Stop button with position reset
- Current time and duration display
- Playback state synchronization
**State Actions**: `PLAY`, `PAUSE`, `STOP`

### controls/VolumeControls
**Purpose**: Audio volume management
**Features**:
- Volume slider (0-100%)
- Mute/unmute toggle button
- Real-time volume adjustment
- Volume level indicators
**State Actions**: `SET_VOLUME`, `TOGGLE_MUTE`

### timeline/Timeline
**Purpose**: Visual timeline representation and seeking
**Features**:
- Canvas-based waveform rendering
- Interactive seeking (click and drag)
- Segment boundary visualization
- Real-time playback position indicator
- Progress line with current time display

### transition/TransitionSettings
**Purpose**: Track selection and transition management
**Features**:
- First track selection dropdown
- Next track selection dropdown
- Transition point input and setting
- Visual feedback for selected tracks
**State Actions**: `SELECT_FIRST_TRACK`, `SELECT_NEXT_TRACK`, `SET_TRANSITION`

### timeline/SegmentDetails
**Purpose**: Display information about selected timeline segment
**Features**:
- Current segment metadata display
- Source track information
- Segment timing details
- Track selection feedback

## Component Communication

### Data Flow Patterns

#### 1. File Upload Flow
```
User File Drop → AudioUpload → Audio Buffer Decode → LOAD_SOURCE Action → Sources State
```

#### 2. Track Selection Flow
```
User Selection → TransitionSettings → Action Dispatch → Reducer Logic → Timeline Update
```

#### 3. Playback Control Flow
```
User Click → TransportControls → Audio Engine → State Update → UI Refresh
```

#### 4. Seeking Flow
```
Timeline Click → Seek Position → Audio Engine Seek → State Update → Position Display
```

### Context Integration
All components access shared state through:
- **`useAudio()` Hook**: Provides `{ state, dispatch, audioEngine }`
- **Centralized State**: All state updates through reducer actions
- **Type Safety**: Comprehensive TypeScript interfaces for all props and state

### Event Handling
- **File Events**: Handled in AudioUpload component
- **User Interactions**: Click, drag, keyboard events in respective components
- **Audio Events**: Managed through animation frames in App.tsx
- **State Changes**: Reactive updates through React Context

## Styling Architecture

### SCSS Modular Structure
```
styles/
├── main.scss              # Main stylesheet entry
├── abstracts/
│   └── _variables.scss    # Color, spacing, and size variables
├── base/
│   └── _reset.scss        # CSS reset and base styles
├── components/
│   ├── _audio-upload.scss
│   ├── _timeline.scss
│   ├── _transport-controls.scss
│   └── _volume-controls.scss
└── layout/
    └── _app.scss          # Main application layout
```

### Design System
- **Color Palette**: Dark theme with accent colors for interactive elements
- **Typography**: Clean, readable fonts with consistent sizing
- **Spacing**: Consistent grid system using CSS custom properties
- **Interactive States**: Hover, active, and disabled states for all controls

## Performance Considerations

### Optimization Strategies
- **Canvas Rendering**: High-performance waveform visualization
- **Animation Frames**: 60fps timeline updates during playback
- **Component Memoization**: Prevent unnecessary re-renders
- **Event Throttling**: Smooth seeking without performance impact

### Memory Management
- **Audio Buffer Cleanup**: Proper disposal of audio resources
- **Event Listener Cleanup**: useEffect cleanup functions
- **Animation Frame Cleanup**: Prevent memory leaks in playback loop

2. **Transition Setup**
   ```
   TrackList → TransitionControls → Timeline
   ```

3. **Playback Control**
   ```
   TransportControls → Audio Engine → Timeline
   ```

### State Updates

1. **Track Loading**
   ```
   - AudioUpload triggers load
   - Audio Engine processes track
   - TrackList updates display
   - Timeline adds segment if current
   ```

2. **Transition Setting**
   ```
   - TransitionControls sets point
   - Timeline updates segments
   - Audio Engine prepares transition
   - Transport updates duration
   ```

3. **Playback**
   ```
   - Transport initiates playback
   - Audio Engine manages audio
   - Timeline updates position
   - Segments show progress
   ```

## Component Properties

### Track Properties
- `trackId`: Unique identifier
- `fileName`: Original file name
- `duration`: Track duration
- `isCurrentTrack`: Current playing status
- `isNextTrack`: Next in transition

### Segment Properties
- `segmentStart`: Start time in track
- `segmentEnd`: End time in track
- `mixPosition`: Position in total mix
- `transitionPoint`: Optional transition marker

### Timeline Properties
- `totalDuration`: Total mix duration
- `currentPosition`: Current play position
- `zoomLevel`: Display zoom factor
- `segments`: Array of track segments

### Transport Properties
- `isPlaying`: Playback status
- `currentTime`: Current mix position
- `trackTime`: Current track position
- `totalTime`: Total mix duration

## Styling Guidelines

### Track Display
- Clear track name display
- Duration information
- Status indicators
- Selection highlighting

### Timeline
- Proportional segment display
- Clear transition markers
- Accurate time scaling
- Position indicator

### Controls
- Intuitive button layout
- Clear status display
- Responsive feedback
- Error state handling
