import type { Track } from '../types';
import './TrackSelector.scss';

interface TrackSelectorProps {
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
  currentTrackId?: string;
  nextTrackId?: string;
}

export default function TrackSelector({ tracks, onSelectTrack, currentTrackId, nextTrackId }: TrackSelectorProps) {
  return (
    <div className="track-selector">
      <h3>Available Tracks</h3>
      <div className="track-list">
        {tracks.map(track => {
          const isCurrentlyPlaying = track.id === currentTrackId;
          const isQueuedNext = track.id === nextTrackId;
          
          return (
            <div 
              key={track.id}
              className={`track-item ${isCurrentlyPlaying ? 'current-playing' : ''} ${isQueuedNext ? 'queued-next' : ''}`}
              onClick={() => onSelectTrack(track)}
            >
              <div className="track-info">
                <h4>{track.title}</h4>
                <p>{track.artist}</p>
                {isCurrentlyPlaying && <span className="status-badge playing">Now Playing</span>}
                {isQueuedNext && <span className="status-badge queued">Queued Next</span>}
              </div>
              <div className="track-duration">
                {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
