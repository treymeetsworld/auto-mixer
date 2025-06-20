# Auto-Mixer Components

## Core Components

### Track Selection
- **AudioUpload**
  - Handles track file uploads
  - Validates audio formats
  - Triggers track loading process

- **TrackList**
  - Displays loaded tracks
  - Shows current and next track
  - Enables track selection for transitions

### Mix Controls

- **TransportControls**
  - Play/Pause functionality
  - Mix position display
  - Track time indicators
  - Mix duration display

- **TransitionControls**
  - Set transition points
  - Preview transitions
  - Adjust transition timing
  - Cancel pending transitions

### Timeline Display

- **Timeline**
  - Visual representation of mix
  - Shows track segments
  - Highlights transition points
  - Indicates current position

- **TrackSegment**
  - Visual segment of a track
  - Shows start and end points
  - Displays transition markers
  - Indicates playback status

## Component Interactions

### Track Flow
1. **Track Selection → Track Loading**
   ```
   AudioUpload → Audio Engine → TrackList
   ```

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
