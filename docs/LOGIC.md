# Application Logic Documentation

## Core Concepts

### Timeline
- Timeline is the main container for audio segments
- Time is measured in milliseconds from timeline start (0)
- Segments are positioned absolutely on the timeline
- Total duration is calculated from the last segment's end time

### Segments
- Represent portions of source audio files
- Can be moved, resized, and overlapped
- Have individual properties (volume, effects, etc.)
- Maintain reference to source audio via sourceId

## Timeline Operations

### Segment Positioning
1. Each segment has an absolute startTime on the timeline
2. Segments can overlap freely
3. Moving a segment updates its startTime
4. Timeline duration updates automatically

### Duration Calculation
```
timelineDuration = Math.max(...segments.map(s => s.startTime + s.duration))
```

### Playback Logic
1. Current time advances at real-time rate during playback
2. Active segments are those where:
   ```
   segment.startTime <= currentTime < (segment.startTime + segment.duration)
   ```
3. Audio playback is synchronized across all active segments

## Audio Processing

### Source Loading
1. Audio file is loaded as ArrayBuffer
2. Decoded into AudioBuffer
3. Waveform data is generated
4. Source metadata is stored

### Playback Engine
1. Maintains Web Audio graph
2. Creates AudioBufferSourceNode for each active segment
3. Applies segment-specific effects
4. Handles real-time parameter changes

### Effects Chain
1. Effects are applied in order per segment
2. Each effect type has specific parameters
3. Effects can be bypassed individually
4. Changes are applied in real-time

## State Management

### Actions
1. All state changes happen through actions
2. Actions are processed synchronously
3. Side effects (audio) handled separately

### Updates
1. State updates trigger re-renders
2. Audio engine responds to state changes
3. UI updates reflect new state

## Error Handling
1. Invalid operations are prevented
2. Audio loading errors are caught
3. State remains consistent
4. User is notified of issues

## Performance
1. Audio processing in Web Audio thread
2. State updates batched when possible
3. UI updates optimized
4. Large files handled efficiently
