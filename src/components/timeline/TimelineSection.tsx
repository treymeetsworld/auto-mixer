import React from 'react';
import { AudioUpload } from '../controls/AudioUpload';
import { SegmentsList } from '../timeline/SegmentsList';
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
  removeFileExtension: (filename: string) => string;
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
  removeFileExtension
}) => {
  return (
    <div className="timeline-section">
      <div className="timeline-header">
        <h3>Timeline Segments</h3>
        <div className="timeline-controls">
          <AudioUpload onFileUpload={onFileUpload} />
        </div>
      </div>
      
      <SegmentsList
        segments={segments}
        sources={sources}
        removeFileExtension={removeFileExtension}
      />

      {segments.length > 0 && (
        <PlaybackControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          playbackRate={playbackRate}
          segments={segments}
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
