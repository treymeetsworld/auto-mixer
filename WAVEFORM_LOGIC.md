# Waveform Component Logic

## Overview
The Waveform component provides a visual representation of audio segments in the timeline with click-to-seek functionality. This document explains the current implementation and identifies areas for modification.

## Current Component Structure

### Props
```typescript
interface WaveformProps {
  audioBuffer?: AudioBuffer;
  currentTime: number;        // Current timeline position (ms)
  duration: number;          // Total timeline duration (ms)
  onSeek: (time: number) => void;  // Seek callback
  className?: string;
  height?: number;
  segments: Array<{          // Timeline segments data
    id: string;
    timelineStart: number;   // When segment starts in timeline (ms)
    timelineEnd: number;     // When segment ends in timeline (ms)
    segmentStart: number;    // Start position in source audio (ms)
    segmentEnd: number;      // End position in source audio (ms)
    sourceId: string;
  }>;
}
```

## Current Visual Rendering Logic

### Segment Drawing (Lines 67-105)
```typescript
// Draw segments sequentially without overlaps
let currentX = 0;

segments.forEach((segment, index) => {
  // Calculate segment width based on its duration relative to total duration
  const segmentDuration = segment.timelineEnd - segment.timelineStart;
  const segmentWidth = (segmentDuration / duration) * width;

  if (segmentWidth < 1) return; // Skip tiny segments

  // Draw visual segment at currentX position
  // Each segment gets a different color scheme
  // Move to next position
  currentX += segmentWidth;
});
```

**Key Point**: Visual width is proportional to segment duration relative to total timeline duration.

### Progress Indicator (Lines 107-109)
```typescript
// Simple proportional calculation
const progressX = (currentTime / duration) * width;
```

**Key Point**: Progress line moves proportionally across the entire timeline width.

## Current Click-to-Seek Logic (Lines 149-182)

### Click Detection
```typescript
const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
  const clickX = e.clientX - rect.left;
  
  // Find which segment was clicked based on visual layout
  let accumulatedWidth = 0;
  let targetTime = 0;
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const segmentDuration = segment.timelineEnd - segment.timelineStart;
    const segmentWidth = (segmentDuration / duration) * rect.width;
    
    if (clickX >= accumulatedWidth && clickX < accumulatedWidth + segmentWidth) {
      // Click is in this segment
      const segmentClickRatio = (clickX - accumulatedWidth) / segmentWidth;
      targetTime = segment.timelineStart + (segmentClickRatio * segmentDuration);
      break;
    }
    
    accumulatedWidth += segmentWidth;
  }
  
  onSeek(targetTime);
};
```

## Current Segment Structure Issues

### Problem: Inconsistent Segment Creation

#### Track 1 (First Track)
```typescript
// Created via SELECT_FIRST_TRACK
createSegment(id, source, 0, source.duration, 0)
// Timeline: 0 to source.duration (full track)
```

#### Track 2 (Transition Track)
```typescript
// Track 1 gets truncated at transition point
updateSegmentEnd(segment, transitionPoint)

// Track 2 starts at transition point with full duration
createSegment(id, nextSource, 0, nextSource.duration, transitionPoint)
// Timeline: transitionPoint to (transitionPoint + source.duration)
```

#### Track 3+ (Auto-added)
```typescript
// Gets added at end of timeline with full duration
{
  segmentStart: 0,
  segmentEnd: source.duration,
  timelineStart: lastSegment.timelineEnd,
  timelineEnd: lastSegment.timelineEnd + source.duration
}
```

### Result: Inconsistent Timeline Structure
- Track 1: 0-10s (truncated)
- Track 2: 10s-190s (full 3-minute track)
- Track 3: 190s-370s (full 3-minute track)

## Expected vs Current Behavior

### Expected Behavior
For 4 tracks the first three having 10s durations:
- **Visual**: 4 segments first three having 10s each and the last should be the full duration of the track
- **Timeline**: 0-10s, 10-20s, 20-30s, 30-end of track
- **Seeking**: Click on 3rd segment → seek to 20-30s range
- **Progress**: Smooth progression 0% → 25% → 50% → 75% → 100%

### Current Issues
1. **Inconsistent segment durations** cause visual segments to have different widths
2. **Progress jumping** when segments have vastly different durations
3. **Seek confusion** when clicking on long segments

## Solutions to Consider

### Option 1: Force Consistent Segment Duration
Modify auto-add logic to use consistent duration (e.g., 10 seconds):
```typescript
const defaultSegmentDuration = 10000; // 10 seconds
```

### Option 2: Proportional Visual Layout
Accept different durations but ensure visual layout matches timeline structure.

### Option 3: Separate Visual from Timeline
- Visual: Equal-width segments for UI clarity
- Timeline: Actual segment durations for audio logic

## Key Files to Modify

### 1. Segment Creation Logic
- `src/core/state/reducer.ts` - SET_TRANSITION and auto-add logic
- `src/App.tsx` - File upload logic for tracks 3+

### 2. Waveform Component
- `src/components/Waveform.tsx` - Visual rendering and click detection

### 3. Timeline Management
- `src/App.tsx` - handleSeek and time update logic

## Debug Information Needed

To identify the exact issue, check:
1. **Segment structure** after adding 3+ tracks
2. **Timeline duration calculation** accuracy
3. **Click-to-timeline mapping** correctness
4. **Progress calculation** consistency

## Recommended Debugging Approach

1. Log segment structure after each track addition
2. Compare visual segment widths vs actual timeline durations
3. Test click positions vs expected timeline positions
4. Verify progress indicator movement matches timeline progression

This will help identify whether the issue is in:
- Segment creation logic
- Visual rendering calculations
- Click detection algorithms
- Timeline progression logic

## Current Segment Creation Logic Example

### Scenario: Adding 4 tracks (each 3 minutes long)

#### Step 1: Add Track 1 (First track)
```typescript
// Action: SELECT_FIRST_TRACK
const segment1 = {
  id: "segment-track1-1",
  sourceId: "track1",
  segmentStart: 0,           // Start from beginning of audio
  segmentEnd: 180000,        // Full track duration (3 minutes)
  timelineStart: 0,          // Timeline starts at 0
  timelineEnd: 180000,       // Timeline goes to 3 minutes
  duration: 180000
};
// Timeline: [0 ────────────── 180000ms]
// Track 1:  [████████████████████████] (full 3 minutes)
```

#### Step 2: Add Track 2 (Transition set at 10 seconds)
```typescript
// Action: SET_TRANSITION with transitionPoint = 10000ms

// Track 1 gets truncated:
const updatedSegment1 = {
  id: "segment-track1-1",
  sourceId: "track1", 
  segmentStart: 0,
  segmentEnd: 10000,         // Truncated to 10 seconds
  timelineStart: 0,
  timelineEnd: 10000,        // Timeline ends at 10 seconds
  duration: 10000
};

// Track 2 starts at transition point:
const segment2 = {
  id: "segment-track2-1",
  sourceId: "track2",
  segmentStart: 0,           // Start from beginning of audio
  segmentEnd: 180000,        // Full track duration (3 minutes)
  timelineStart: 10000,      // Timeline starts at 10 seconds
  timelineEnd: 190000,       // Timeline goes to 190 seconds (10 + 180)
  duration: 180000
};
// Timeline: [0 ──── 10000] [10000 ──────────────── 190000ms]
// Track 1:  [██████]
// Track 2:              [████████████████████████████████] (full 3 minutes)
```

#### Step 3: Add Track 3 (Auto-added, no transition logic)
```typescript
// Action: ADD_SEGMENT_TO_TIMELINE (current implementation)
const segment3 = {
  id: "segment-track3-1", 
  sourceId: "track3",
  segmentStart: 0,           // Start from beginning of audio
  segmentEnd: 180000,        // Full track duration (3 minutes)
  timelineStart: 190000,     // Timeline starts at end of track 2
  timelineEnd: 370000,       // Timeline goes to 370 seconds (190 + 180)
  duration: 180000
};
// Timeline: [0 ──── 10000] [10000 ──────────────── 190000] [190000 ──────────────── 370000ms]
// Track 1:  [██████]
// Track 2:              [████████████████████████████████]
// Track 3:                                                [████████████████████████████████] (full 3 minutes)
```

#### Step 4: Add Track 4 (Auto-added, no transition logic)
```typescript
// Action: ADD_SEGMENT_TO_TIMELINE (current implementation)
const segment4 = {
  id: "segment-track4-1",
  sourceId: "track4", 
  segmentStart: 0,           // Start from beginning of audio
  segmentEnd: 180000,        // Full track duration (3 minutes)
  timelineStart: 370000,     // Timeline starts at end of track 3
  timelineEnd: 550000,       // Timeline goes to 550 seconds (370 + 180)
  duration: 180000
};
// Final Timeline: [0-10s] [10s-190s] [190s-370s] [370s-550s]
// Visual widths:  [tiny]  [massive]  [massive]   [massive]
```

### Current Problem Analysis
- **Track 1**: 10 seconds (tiny visual segment)
- **Track 2**: 180 seconds (massive visual segment) 
- **Track 3**: 180 seconds (massive visual segment)
- **Track 4**: 180 seconds (massive visual segment)

**Result**: The waveform visual is dominated by tracks 2-4, making track 1 barely visible and causing seeking/progression issues.

---

## DESIRED Segment Creation Logic Example

### TODO: Edit this section to describe the expected behavior

```typescript
// Edit this section to describe how segments SHOULD be created
// to achieve the expected timeline progression and visual behavior
1. the segments structure is wrong. there should not be timeline details in each segment it creates confusion.
  const updatedSegment1 = {
  id: "segment-track1-1",
  sourceId: "track1", 
  segmentStart: 0,
  segmentEnd: 10000,         // Truncated to 10 seconds
  segmentDuration: 10000
};

2. the timeline structure is seperate from the segment structure. 

3. the timeline should have its own state that uses the segments to calculate how long it should be

4. the timeline length should be what the seek follows and uses as the current time

5. for four tracks the logic should be like this.
  Each track has Full duration initially, then gets truncated at transition point if another track is added

four tracks added, with 10 s transitions for the first three
- **Track 1**: full track initially, but after adding next track with 10 s transition, 10 seconds 
- **Track 2**: full track initially, but after adding next track with 10 s transition, 10 seconds  
- **Track 3**: full track initially, but after adding next track with 10 s transition, 10 seconds
- **Track 4**: full track 


// Example questions to consider:
// - Should all segments have equal duration (e.g., 10 seconds each)?
// - Should segments be truncated when the next one is added?
// - What should happen to the "remaining" audio of longer tracks?
// - How should the visual timeline progress across segments?
```
