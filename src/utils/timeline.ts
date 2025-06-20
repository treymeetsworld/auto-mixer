import type { Track, TransitionPoint, MasterTimeline, TimelineSegment } from '../types';

export function calculateMasterTimeline(
  currentTrack: Track,
  nextTrack: Track | null,
  transitionPoint: TransitionPoint | null,
  isInSecondSegment: boolean = false // New parameter to indicate if we're already in the second part of a mix
): MasterTimeline {
  const segments: TimelineSegment[] = [];
  const transitions: { masterTime: number; fromTrack: string; toTrack: string }[] = [];
  
  if (!currentTrack) {
    return {
      segments: [],
      totalDuration: 0,
      transitions: []
    };
  }

  let masterTime = 0;
  let segmentCounter = 0; // Counter to ensure unique segment IDs

  if (isInSecondSegment && transitionPoint) {
    // We're already in the second segment of a completed transition
    // Show the full timeline but mark where we are
    
    // First segment: the previous track (now ended) 
    const firstSegmentDuration = transitionPoint.startTime;
    segments.push({
      segmentId: `segment-${segmentCounter++}`,
      trackId: 'previous', // This segment already played
      track: { id: 'previous', title: 'Previous Track', artist: '', url: '', duration: firstSegmentDuration },
      startTime: 0,
      endTime: firstSegmentDuration,
      trackStartTime: 0,
      trackEndTime: transitionPoint.startTime
    });

    masterTime = firstSegmentDuration;

    // Add transition marker
    transitions.push({
      masterTime: masterTime,
      fromTrack: 'previous',
      toTrack: currentTrack.id
    });

    // Second segment: current track from specified start time to end
    const nextStartTime = transitionPoint.nextSongStartTime || 0;
    const nextSegmentDuration = currentTrack.duration - nextStartTime;
    
    segments.push({
      segmentId: `segment-${segmentCounter++}`,
      trackId: currentTrack.id,
      track: currentTrack,
      startTime: masterTime,
      endTime: masterTime + nextSegmentDuration,
      trackStartTime: nextStartTime,
      trackEndTime: currentTrack.duration,
      isTransition: true
    });

    masterTime += nextSegmentDuration;
    
  } else if (transitionPoint && nextTrack) {
    // Normal case: setting up a future transition
    
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

export function getMasterTimeFromTrackTime(
  timeline: MasterTimeline,
  trackId: string,
  trackTime: number
): number {
  // When there are multiple segments with the same trackId, we need to find
  // the segment that contains the current track time
  const segments = timeline.segments.filter(s => s.trackId === trackId);
  
  if (segments.length === 0) return 0;
  
  // For now, we'll use the first segment that could contain this track time
  // In a more advanced version, we might need additional context to determine
  // which specific segment instance we're referring to
  const segment = segments.find(s => 
    trackTime >= s.trackStartTime && trackTime <= s.trackEndTime
  ) || segments[0];

  // Calculate how far into the segment we are
  const segmentProgress = trackTime - segment.trackStartTime;
  return segment.startTime + segmentProgress;
}

export function getTrackTimeFromMasterTime(
  timeline: MasterTimeline,
  masterTime: number
): { trackId: string; trackTime: number; track: Track } | null {
  const segment = timeline.segments.find(s => 
    masterTime >= s.startTime && masterTime <= s.endTime
  );
  
  if (!segment) return null;

  const segmentProgress = masterTime - segment.startTime;
  const trackTime = segment.trackStartTime + segmentProgress;

  return {
    trackId: segment.trackId,
    trackTime,
    track: segment.track
  };
}
