import React from 'react';
import { Play, Pause, Square } from 'lucide-react';

interface TransportControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onStop: () => void;
  formatTime: (ms: number) => string;
}

export const TransportControls: React.FC<TransportControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onStop,
  formatTime
}) => {
  return (
    <div className="transport-controls">
      <button 
        onClick={onPlayPause}
        className="control-button play-pause"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>
      
      <button 
        onClick={onStop}
        className="control-button stop"
        title="Stop"
      >
        <Square size={16} />
      </button>
      
      <div className="time-display">
        <span className="current-time">{formatTime(currentTime)}</span>
        <span className="time-separator">/</span>
        <span className="total-time">{formatTime(duration)}</span>
      </div>
    </div>
  );
};
