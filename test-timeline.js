// Simple test to verify timeline behavior with duplicate tracks

// Sample track
const track1 = {
  id: '1',
  title: 'The Vibe',
  artist: 'Ayo Jay',
  url: '/Ayo Jay - The Vibe (Clean).mp3',
  duration: 240
};

// Test transition point
const transition = {
  songId: '1',
  startTime: 120, // transition at 2 minutes
  nextSongStartTime: 60 // start next song at 1 minute
};

// Simulate the timeline calculation logic
function calculateMasterTimeline(currentTrack, nextTrack, transitionPoint) {
  const segments = [];
  const transitions = [];
  
  let masterTime = 0;
  let segmentCounter = 0;

  if (transitionPoint && nextTrack) {
    // First segment: current track until transition
    const firstSegmentDuration = transitionPoint.startTime;
    segments.push({
      segmentId: `segment-${segmentCounter++}`,
      trackId: currentTrack.id,
      track: currentTrack,
      startTime: 0,
      endTime: firstSegmentDuration,
      trackStartTime: 0,
      trackEndTime: transitionPoint.startTime
    });

    masterTime = firstSegmentDuration;

    // Add transition marker
    transitions.push({
      masterTime: masterTime,
      fromTrack: currentTrack.id,
      toTrack: nextTrack.id
    });

    // Second segment: next track from specified start time to end
    const nextStartTime = transitionPoint.nextSongStartTime || 0;
    const nextSegmentDuration = nextTrack.duration - nextStartTime;
    
    segments.push({
      segmentId: `segment-${segmentCounter++}`,
      trackId: nextTrack.id,
      track: nextTrack,
      startTime: masterTime,
      endTime: masterTime + nextSegmentDuration,
      trackStartTime: nextStartTime,
      trackEndTime: nextTrack.duration,
      isTransition: true
    });

    masterTime += nextSegmentDuration;
  } else {
    // Just current track, full duration
    segments.push({
      segmentId: `segment-${segmentCounter++}`,
      trackId: currentTrack.id,
      track: currentTrack,
      startTime: 0,
      endTime: currentTrack.duration,
      trackStartTime: 0,
      trackEndTime: currentTrack.duration
    });

    masterTime = currentTrack.duration;
  }

  return {
    segments,
    totalDuration: masterTime,
    transitions
  };
}

// Test 1: Same song playing twice
console.log('=== Test 1: Same song playing twice ===');
const timeline1 = calculateMasterTimeline(track1, track1, transition);
console.log('Timeline:', JSON.stringify(timeline1, null, 2));

console.log('\nSegment IDs:');
timeline1.segments.forEach(seg => {
  console.log(`- ${seg.segmentId}: Track ${seg.trackId} (${seg.track.title})`);
});

console.log('\nTotal duration:', timeline1.totalDuration);
console.log('Expected: 120 (first segment) + 180 (second segment: 240-60) = 300 seconds');
