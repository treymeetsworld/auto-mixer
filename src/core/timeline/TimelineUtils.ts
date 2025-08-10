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
  return segments.reduce((total, segment) => total + segment.segmentDuration, 0);
};

/**
 * Creates a new segment with basic properties
 */
export const createSegment = (
  id: string,
  source: AudioSource,
  segmentStart: number,
  segmentEnd: number
): Segment => {
  const segmentDuration = calculateSegmentDuration(segmentStart, segmentEnd);

  return {
    id,
    sourceId: source.id,
    segmentStart,
    segmentEnd,
    segmentDuration
  };
};

/**
 * Updates a segment's end point and recalculates duration
 */
export const updateSegmentEnd = (segment: Segment, newEnd: number): Segment => {
  const segmentDuration = calculateSegmentDuration(segment.segmentStart, newEnd);

  return {
    ...segment,
    segmentEnd: newEnd,
    segmentDuration
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
