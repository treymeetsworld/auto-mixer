import React from 'react';
import { TransportControls } from '../controls/TransportControls';
import { VolumeControls } from '../controls/VolumeControls';
import { PlaybackRateControl } from '../controls/PlaybackRateControl';
import { Waveform } from './Waveform';
import type { Segment } from '../../types';

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  segments: Segment[];
  onPlayPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onPlaybackRateChange: (rate: number) => void;
  formatTime: (ms: number) => string;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackRate,
  segments,
  onPlayPause,
  onStop,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onPlaybackRateChange,
  formatTime
}) => {
  return (
    <div className="playback-controls">
      <TransportControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onPlayPause={onPlayPause}
        onStop={onStop}
        formatTime={formatTime}
      />

      <div className="seek-control waveform">
        <Waveform
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
          segments={segments}
          height={80}
          className="timeline-waveform"
        />
      </div>

      <div className="bottom-controls">
        <VolumeControls
          volume={volume}
          isMuted={isMuted}
          onVolumeChange={onVolumeChange}
          onMuteToggle={onMuteToggle}
        />

        <PlaybackRateControl
          playbackRate={playbackRate}
          onPlaybackRateChange={onPlaybackRateChange}
        />
      </div>
    </div>
  );
};
