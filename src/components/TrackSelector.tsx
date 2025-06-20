import type { Track } from '../types';
import './TrackSelector.scss';

interface TrackSelectorProps {
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
  currentTrackId?: string;
}

export default function TrackSelector({ tracks, onSelectTrack, currentTrackId }: TrackSelectorProps) {
  return (
    <div className="track-selector">
      <h3>Available Tracks</h3>
      <div className="track-list">
        {tracks.map(track => (
          <div 
            key={track.id}
            className={`track-item ${track.id === currentTrackId ? 'current' : ''}`}
            onClick={() => onSelectTrack(track)}
          >
            <div className="track-info">
              <h4>{track.title}</h4>
              <p>{track.artist}</p>
            </div>
            <div className="track-duration">
              {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
