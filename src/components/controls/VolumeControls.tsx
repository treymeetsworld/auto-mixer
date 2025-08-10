import React from 'react';
import { VolumeX, Volume1, Volume2 } from 'lucide-react';

interface VolumeControlsProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
}

export const VolumeControls: React.FC<VolumeControlsProps> = ({
  volume,
  isMuted,
  onVolumeChange,
  onMuteToggle
}) => {
  return (
    <div className="volume-control">
      <button 
        onClick={onMuteToggle}
        className="control-button mute"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX size={16} /> : volume > 0.5 ? <Volume2 size={16} /> : <Volume1 size={16} />}
      </button>
      
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={isMuted ? 0 : volume}
        className="volume-slider"
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        title="Volume"
      />
      
      <span className="volume-display">
        {Math.round((isMuted ? 0 : volume) * 100)}%
      </span>
    </div>
  );
};
