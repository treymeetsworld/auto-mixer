import type { AudioSource, Segment } from '../../types';

/**
 * Calculates the duration of a segment based on start and end points
 */
export const calculateSegmentDuration = (start: number, end: number): number => {
  return end - start;
};

/**
 * Calculates timeline duration by summing all segment durations
 */
export const calculateTimelineDuration = (segments: Segment[]): number => {
  return segments.reduce((total, segment) => total + segment.duration, 0);
};

/**
 * Creates a new segment with all timeline calculations
 */
export const createSegment = (
  id: string,
  source: AudioSource,
  segmentStart: number,
  segmentEnd: number,
  timelineStart: number
): Segment => {
  const duration = calculateSegmentDuration(segmentStart, segmentEnd);
  const timelineEnd = timelineStart + duration;

  return {
    id,
    sourceId: source.id,
    segmentStart,
    segmentEnd,
    timelineStart,
    timelineEnd,
    duration
  };
};

/**
 * Updates a segment's end point and recalculates timeline values
 */
export const updateSegmentEnd = (segment: Segment, newEnd: number): Segment => {
  const duration = calculateSegmentDuration(segment.segmentStart, newEnd);
  const timelineEnd = segment.timelineStart + duration;

  return {
    ...segment,
    segmentEnd: newEnd,
    timelineEnd,
    duration
  };
};

/**
 * Validates that a segment doesn't exceed source boundaries
 */
export const validateSegment = (segment: Segment, source: AudioSource): boolean => {
  return segment.segmentStart >= 0 && 
         segment.segmentEnd <= source.duration && 
         segment.segmentStart < segment.segmentEnd;
};
