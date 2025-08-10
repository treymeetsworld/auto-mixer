import React from 'react';
import { ListMusic } from 'lucide-react';
import type { Segment, AudioSource } from '../../types';

interface SegmentDetailsProps {
  segments: Segment[];
  sources: Record<string, AudioSource>;
  formatTime: (ms: number) => string;
  removeFileExtension: (filename: string) => string;
}

export const SegmentDetails: React.FC<SegmentDetailsProps> = ({
  segments,
  sources,
  formatTime,
  removeFileExtension
}) => {
  if (segments.length === 0) {
    return null;
  }

  return (
    <div className="timeline-details">
      <h3><ListMusic size={18} className="inline-icon" /> Segment Details</h3>
      {segments.map((segment, index) => {
        const source = sources[segment.sourceId];
        return (
          <div key={`details-${segment.id}`} className="segment-detail-card">
            <div className="detail-content-inline">
              <strong>#{index + 1} {source ? removeFileExtension(source.name) : 'Unknown Track'}</strong>
              <span className="detail-separator">•</span>
              <span className="detail-text">
                Source: {formatTime(segment.segmentStart)} - {formatTime(segment.segmentEnd)}
              </span>
              <span className="detail-separator">•</span>
              <span className="detail-text">
                Duration: {formatTime(segment.segmentDuration)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
