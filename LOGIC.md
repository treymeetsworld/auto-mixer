# Auto-Mixer Logic Flow

## Core Concepts

### Timeline
- The timeline is a continuous line that represents the total mix
- Each segment on the timeline represents a portion of a track
- Total duration is the sum of all segment durations
- Segments maintain their absolute positions once placed

### Segments
- Each segment represents a portion of a track that will be played
- Segments always start from 0:00 in their source track unless specified
- Segment length is determined by:
  * Full track duration (if no transition)
  * Duration until transition point (if transitioning out)
  * Remaining duration (if transitioning in)

## Application Flow

### 1. Initial Track Selection
```
- There should be no track selected first
When first track is selected:
- insert into timeline 
- Set as currentTrack
  * segmentStart = 0:00 (start of track)
  * segmentEnd = track duration
- Duration = track duration
```

### 2. Next Track Setup
```
When next track is selected:
- Store as nextTrack
- No timeline changes yet
- Wait for transition point
```

### 3. Transition Point Setting
```
When transition point is set:
- Store transition information
- Update current segment:
  * segmentEnd = transition point
- Create next segment:
  * segmentStart = 0:00 (default)
  * segmentEnd = track duration
- Duration = sum of all segment lengths
```

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

## Questions to Resolve
1. How should overlapping transitions be handled?
2. Should segments maintain their own timing or inherit from timeline?
3. How should the visual representation handle transitions?
4. What happens to previous segments during transitions?

## Implementation Notes
- Track times and master times need clear conversion
- Segment history must be maintained
- Visual representation should match actual playback
- Need clear rules for segment boundaries

Please edit this document to correct any misunderstandings or add missing concepts.

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
