import { useState } from 'react';
import type { Track, TransitionPoint } from '../types';
import './TransitionControl.scss';

interface TransitionControlProps {
  currentTrack: Track;
  nextTrack: Track | null;
  currentTime: number;
  onSetTransition: (transitionPoint: TransitionPoint) => void;
  onClearNext: () => void;
}

export default function TransitionControl({ 
  currentTrack, 
  nextTrack, 
  currentTime,
  onSetTransition,
  onClearNext 
}: TransitionControlProps) {
  const [transitionTime, setTransitionTime] = useState<number>(currentTrack.duration);
  const [nextStartTime, setNextStartTime] = useState<number>(0);

  const handleSetTransition = () => {
    if (!nextTrack) return;
    
    onSetTransition({
      songId: nextTrack.id,
      startTime: transitionTime,
      nextSongStartTime: nextStartTime > 0 ? nextStartTime : undefined
    });
  };

  const handleSetCurrentPosition = () => {
    setTransitionTime(currentTime);
  };

  if (!nextTrack) {
    return (
      <div className="transition-control">
        <div className="no-next-track">
          <p>Select a track to queue next</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transition-control">
      <div className="transition-header">
        <h3>Queue Transition</h3>
        <button className="clear-button" onClick={onClearNext}>
          Clear Next
        </button>
      </div>

      <div className="next-track-info">
        <h4>Next: {nextTrack.title}</h4>
        <p>by {nextTrack.artist}</p>
        {nextTrack.id === currentTrack.id && (
          <div className="same-song-notice">
            <small>⚡ Same song will play again - each addition creates a unique segment</small>
          </div>
        )}
      </div>

      <div className="transition-settings">
        <div className="setting-group">
          <label>Transition at (current song):</label>
          <div className="time-input-group">
            <input 
              type="range"
              min="0"
              max={currentTrack.duration}
              step="1"
              value={transitionTime}
              onChange={(e) => setTransitionTime(Number(e.target.value))}
            />
            <span className="time-display">
              {Math.floor(transitionTime / 60)}:{(transitionTime % 60).toString().padStart(2, '0')}
            </span>
            <button onClick={handleSetCurrentPosition}>
              Use Current ({Math.floor(currentTime)}s)
            </button>
          </div>
        </div>

        <div className="setting-group">
          <label>Next song starts at:</label>
          <div className="time-input-group">
            <input 
              type="range"
              min="0"
              max={nextTrack.duration}
              step="1"
              value={nextStartTime}
              onChange={(e) => setNextStartTime(Number(e.target.value))}
            />
            <span className="time-display">
              {Math.floor(nextStartTime / 60)}:{(nextStartTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        <button className="set-transition-button" onClick={handleSetTransition}>
          Set Transition
        </button>
      </div>
    </div>
  );
}
