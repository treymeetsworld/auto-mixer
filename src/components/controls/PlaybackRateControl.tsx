import React from 'react';

interface PlaybackRateControlProps {
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
}

export const PlaybackRateControl: React.FC<PlaybackRateControlProps> = ({
  playbackRate,
  onPlaybackRateChange
}) => {
  return (
    <div className="playback-rate-control">
      <label htmlFor="playback-rate">Speed:</label>
      <select 
        id="playback-rate"
        value={playbackRate}
        onChange={(e) => onPlaybackRateChange(parseFloat(e.target.value))}
        className="rate-select"
        title="Playback speed"
      >
        <option value="0.25">0.25x</option>
        <option value="0.5">0.5x</option>
        <option value="0.75">0.75x</option>
        <option value="1.0">1.0x</option>
        <option value="1.25">1.25x</option>
        <option value="1.5">1.5x</option>
        <option value="2.0">2.0x</option>
      </select>
    </div>
  );
};
