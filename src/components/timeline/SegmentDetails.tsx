import React from 'react';
import { ListMusic, Trash2 } from 'lucide-react';
import type { Segment, AudioSource } from '../../types';

interface SegmentDetailsProps {
  segments: Segment[];
  sources: Record<string, AudioSource>;
  formatTime: (ms: number) => string;
  removeFileExtension: (filename: string) => string;
  onRemoveSegment: (segmentId: string) => void;
}

export const SegmentDetails: React.FC<SegmentDetailsProps> = ({
  segments,
  sources,
  formatTime,
  removeFileExtension,
  onRemoveSegment
}) => {
  return (
    <div className="timeline-details">
      <h3><ListMusic size={18} className="inline-icon" /> Segment Details</h3>
      {segments.length === 0 && (
        <div className="segment-detail-card">
          <div className="detail-content-inline">
            <strong>No segments yet</strong>
            <span className="detail-separator">•</span>
            <span className="detail-text">Upload a track to see details here.</span>
          </div>
        </div>
      )}
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
              <button
                type="button"
                className="delete-btn"
                title="Remove segment"
                onClick={() => onRemoveSegment(segment.id)}
                style={{ marginLeft: 'auto' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
