import React from 'react';
import { AudioUpload } from '../controls/AudioUpload';
import { PlaybackControls } from '../playback/PlaybackControls';
import type { Segment, AudioSource } from '../../types';

interface TimelineSectionProps {
  segments: Segment[];
  sources: Record<string, AudioSource>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPlayPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onPlaybackRateChange: (rate: number) => void;
  formatTime: (ms: number) => string;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({
  segments,
  sources,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackRate,
  onFileUpload,
  onPlayPause,
  onStop,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onPlaybackRateChange,
  formatTime,
}) => {
  // Determine current active track name for simple display
  let activeName: string | null = null;
  if (segments.length > 0) {
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
    if (activeIndex === -1) activeIndex = segments.length - 1;
    const activeSeg = segments[activeIndex];
    const src = sources[activeSeg.sourceId];
    activeName = src?.name || null;
    // Remove file extension from the display name
    if (activeName) {
      activeName = activeName.replace(/\.[^/.]+$/, '');
    }
  }

  return (
    <div className="timeline-section">
      <div className="timeline-header">
        <h3>Timeline</h3>
        <div className="timeline-controls">
          <AudioUpload onFileUpload={onFileUpload} />
        </div>
      </div>

      <div className="segment">
        <strong>
          {activeName ? activeName : 'No track selected'}
        </strong>
      </div>

      {segments.length > 0 && (
        <PlaybackControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          playbackRate={playbackRate}
          segments={segments}
          sources={sources}
          onPlayPause={onPlayPause}
          onStop={onStop}
          onSeek={onSeek}
          onVolumeChange={onVolumeChange}
          onMuteToggle={onMuteToggle}
          onPlaybackRateChange={onPlaybackRateChange}
          formatTime={formatTime}
        />
      )}
    </div>
  );
};
