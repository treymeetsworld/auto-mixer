# Auto-Mixer Logic Flow

## Core Concepts

### Timeline Architecture
- **Sequential Segments**: Timeline consists of ordered segments that play consecutively
- **Source References**: Each segment references a source audio file with specific start/end times
- **Dynamic Duration**: Total timeline duration calculated from sum of all segment durations
- **Immutable History**: Once segments are placed, they maintain their positions and timing

### State Management
- **Sources**: Dictionary of loaded audio files with metadata (id, buffer, duration, etc.)
- **Segments**: Array of timeline segments with sourceId references and timing information
- **Current/Next Tracks**: Simple string IDs tracking workflow progression
- **Timeline State**: Playback position, duration, and playing status

## Three-Step Workflow

### 1. First Track Selection (`SELECT_FIRST_TRACK`)
```typescript
// Initial state: empty timeline
// Action: User selects first track

State Changes:
- Create first segment covering full track duration
- Set as currentTrack
- Timeline duration = track duration

Segment Created:
{
  id: "segment-{sourceId}-1",
  sourceId: currentTrack,
  segmentStart: 0,
  segmentEnd: trackDuration,
  segmentDuration: trackDuration
}
```

### 2. Next Track Selection (`SELECT_NEXT_TRACK`)
```typescript
// Current state: one track selected and playing
// Action: User selects next track for transition

State Changes:
- Store selected track as nextTrack
- No timeline modifications yet
- Wait for transition point to be set

Timeline: [Segment1 (full current track)] 
Status: currentTrack set, nextTrack set, waiting for transition
```

### 3. Transition Point Setting (`SET_TRANSITION`)
```typescript
// Current state: currentTrack and nextTrack selected
// Action: User sets transition point on timeline

State Changes:
- Truncate current segment at transition point
- Create new segment for next track (full duration)
- Promote nextTrack to currentTrack
- Clear nextTrack for next selection
- Update total timeline duration

Timeline: [Segment1 (truncated)] → [Segment2 (full next track)]
```

## Audio Engine Integration

### Playback Logic
```typescript
// Animation frame loop tracks current time
const currentTime = audioEngine.getCurrentTime();

// Find current segment based on timeline position
const currentSegment = findSegmentAtTime(currentTime);

// Calculate actual audio buffer position
const segmentElapsed = currentTime - segmentStartTime;
const audioPosition = currentSegment.segmentStart + segmentElapsed;
```

### Seeking Logic
```typescript
// User seeks to timeline position
const targetSegment = findSegmentAtTime(seekTime);
const segmentOffset = seekTime - getSegmentStartTime(targetSegment);
const audioTime = targetSegment.segmentStart + segmentOffset;

// Seek audio engine to calculated position
audioEngine.seekTo(audioTime, targetSegment.buffer);
```

## State Reducer Actions

### Core Actions
```typescript
type ActionType = 
  | { type: 'LOAD_SOURCE'; payload: Source }
  | { type: 'SELECT_FIRST_TRACK'; payload: { sourceId: string } }
  | { type: 'SELECT_NEXT_TRACK'; payload: { sourceId: string } }
  | { type: 'SET_TRANSITION'; payload: { transitionPoint: number } }
  | { type: 'PLAY' | 'PAUSE' | 'STOP' }
  | { type: 'UPDATE_PLAYBACK_TIME'; payload: { currentTime: number } }
  | { type: 'SET_VOLUME'; payload: { volume: number } }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_PLAYBACK_RATE'; payload: { rate: number } };
```

### Timeline Calculations
```typescript
// Helper function used throughout reducer
function calculateTimelineDuration(segments: Segment[]): number {
  return segments.reduce((total, segment) => total + segment.segmentDuration, 0);
}

// Segment creation helper
function createSegment(id: string, sourceId: string, start: number, end: number): Segment {
  return {
    id,
    sourceId,
    segmentStart: start,
    segmentEnd: end,
    segmentDuration: end - start
  };
}
```

## Component Integration

### Timeline Component
- **Waveform Rendering**: Displays audio waveform for all segments
- **Seek Interaction**: Click/drag to seek within timeline
- **Segment Visualization**: Shows segment boundaries and transitions
- **Real-time Updates**: Progress line synchronized with playback

### Transport Controls
- **Play/Pause/Stop**: Control audio engine playback
- **Volume/Mute**: Master volume controls
- **Playback Rate**: Speed adjustment (0.5x to 2.0x)

### Track Selection
- **Audio Upload**: Load files into sources dictionary
- **First Track**: Initiate timeline with first segment
- **Next Track**: Queue track for transition
- **Transition Settings**: Set transition point and execute

## Data Flow Summary

1. **File Upload** → `LOAD_SOURCE` → Sources dictionary updated
2. **First Track** → `SELECT_FIRST_TRACK` → First segment created, timeline established
3. **Next Track** → `SELECT_NEXT_TRACK` → Next track queued
4. **Transition** → `SET_TRANSITION` → Current segment truncated, next segment added
5. **Playback** → Animation frame → Audio engine time → UI updates
6. **Seeking** → User interaction → Audio engine seek → State update

### 4. Playback and Time Tracking
```
During playback:
- Track current segment's playback position (0:00 to segmentEnd)
- Convert segment time to total mix time by adding previous segment durations
- Check for transition points (when reaching segmentEnd)
```

### 5. Transition Handling
```
When transition point is reached:
- Switch to next track
- Begin playback from track start (unless specified)
- Update active segment
```

### 6. Time Calculations

#### Segment Time → Mix Time
```
- Find which segment is playing
- Sum durations of all previous segments
- Add current position in active segment
```

#### Mix Time → Segment Time
```
- Find which segment contains this time point by comparing with segment durations
- Subtract previous segment durations to get position in current segment
```

### Core Properties

#### Segment Properties
- `segmentStart`: Where to start playing in the source track (defaults to 0:00 unless specified)
- `segmentEnd`: Where to stop playing in the source track (defaults to track duration unless transitioning)

#### Timeline
- Always starts at 0:00
- Duration grows as segments are added
- Duration = sum of all segment lengths
- Each segment maintains its portion of the total duration

### Examples

1. First Track (3-minute song):
```
segmentStart = 0:00 (start of track)
segmentEnd = 3:00 (end of track)
Duration = 3:00
```

2. Second Track (3-minute song) added after first track plays 20 seconds:
```
First Segment:
segmentStart = 0:00 (start of first track)
segmentEnd = 0:20 (transition point in first track)
Duration = 0:20

Second Segment:
segmentStart = 0:00 (start of second track)
segmentEnd = 3:00 (full second track)
Duration = 3:20 (0:20 + 3:00)
```

3. Third Track (2-minute song) added after second track plays 20 seconds:
```
First Segment:
segmentStart = 0:00
segmentEnd = 0:20
Duration = 0:20

Second Segment:
segmentStart = 0:00
segmentEnd = 0:20 (transition point)
Duration = 0:40 (0:20 + 0:20)

Third Segment:
segmentStart = 0:00
segmentEnd = 2:00 (full track)
Duration = 2:40 (0:40 + 2:00)
```

## Implementation Notes
- Track times and master times need clear conversion
- Segment history must be maintained
- Visual representation should match actual playback
- Need clear rules for segment boundaries

## Questions to Resolve
1. How should overlapping transitions be handled?
2. Should segments maintain their own timing or inherit from timeline?
3. How should the visual representation handle transitions?
4. What happens to previous segments during transitions?
