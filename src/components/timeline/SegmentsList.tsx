import React from 'react';
import type { Segment, AudioSource } from '../../types';

interface SegmentsListProps {
  segments: Segment[];
  sources: Record<string, AudioSource>;
  removeFileExtension: (filename: string) => string;
}

export const SegmentsList: React.FC<SegmentsListProps> = ({
  segments,
  sources,
  removeFileExtension
}) => {
  if (segments.length === 0) {
    return (
      <div className="no-segments">
        No segments yet. Upload audio files to see timeline segments.
      </div>
    );
  }

  return (
    <div className="segments-container">
      {segments.map((segment, index) => {
        const source = sources[segment.sourceId];
        return (
          <div key={segment.id} className="segment">
            <strong>#{index + 1} {source ? removeFileExtension(source.name) : 'Unknown Track'}</strong>
          </div>
        );
      })}
    </div>
  );
};
