import React from 'react';
import type { Segment, AudioSource } from '../../types';

interface SegmentsListProps {
  segments: Segment[];
  sources: Record<string, AudioSource>;
  currentTime: number; // timeline current time in ms
  removeFileExtension: (filename: string) => string;
}

export const SegmentsList: React.FC<SegmentsListProps> = ({
  segments,
  sources,
  currentTime,
  removeFileExtension
}) => {
  if (segments.length === 0) {
    return (
      <div className="no-segments">
        No tracks yet. Upload audio to start your timeline.
      </div>
    );
  }

  // Find the currently active segment based on currentTime
  let cumulative = 0;
  let activeIndex = -1;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const segStart = cumulative;
    const segEnd = cumulative + seg.segmentDuration;
    if (currentTime >= segStart && currentTime < segEnd) {
      activeIndex = i;
      break;
    }
    cumulative = segEnd;
  }

  // Fallback to last segment if beyond duration
  if (activeIndex === -1) activeIndex = segments.length - 1;

  const activeSegment = segments[activeIndex];
  const activeSource = activeSegment ? sources[activeSegment.sourceId] : undefined;

  return (
    <div className="segments-container">
      <div className="segment">
        <strong>
          {activeSource ? removeFileExtension(activeSource.name) : 'Unknown Track'}
        </strong>
      </div>
    </div>
  );
};
