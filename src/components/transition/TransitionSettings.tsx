import React from 'react';
import { RotateCcw } from 'lucide-react';
import type { AudioSource } from '../../types';

interface TransitionSettingsProps {
  currentTrack: string | null;
  nextTrack: string | null;
  sources: Record<string, AudioSource>;
  pendingTransitionPoint: number;
  onTransitionPointChange: (value: number) => void;
  onSetTransition: () => void;
  formatTime: (ms: number) => string;
}

export const TransitionSettings: React.FC<TransitionSettingsProps> = ({
  currentTrack,
  nextTrack,
  sources,
  pendingTransitionPoint,
  onTransitionPointChange,
  onSetTransition,
  formatTime
}) => {
  if (!currentTrack || !nextTrack) {
    return null;
  }

  const currentSource = sources[currentTrack];
  const maxDuration = currentSource?.duration || 100000;

  return (
    <div className="transition-section">
      <h3><RotateCcw size={18} className="inline-icon" /> Transition Settings</h3>
      <div className="transition-options">
        <div className="transition-group">
          <h4>Custom Transition</h4>
          <div className="custom-transition">
            <input
              type="range"
              min="0"
              max={maxDuration}
              step="1000"
              value={pendingTransitionPoint}
              className="transition-slider"
              onChange={(e) => onTransitionPointChange(parseInt(e.target.value))}
            />
            <div className="slider-labels">
              <span>0:00</span>
              <span>{formatTime(maxDuration)}</span>
            </div>
            <div className="transition-controls">
              <div className="current-time">
                Transition at: <strong>{formatTime(pendingTransitionPoint)}</strong>
              </div>
              <button 
                onClick={onSetTransition}
                className="set-transition-button"
              >
                <RotateCcw size={16} className="inline-icon" /> Set Transition
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
