import { formatTime } from "../utils/audioUtils";

interface Track {
    id: string;
    title: string;
    artist: string;
    duration: number;
    url: string;
}

interface FileBrowserProps {
    tracks: Track[];
    onTrackSelect: (track: Track) => void;
    onAddToQueue: (track: Track) => void;
}

export default function FileBrowser({ 
    tracks, 
    onTrackSelect, 
    onAddToQueue 
}: FileBrowserProps) {
    return (
        <>
            <div className="panel-header">
                <h3>
                    <span>📁</span>
                    Library ({tracks.length})
                </h3>
            </div>
            
            <div className="panel-content">
                {tracks.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '2rem', 
                        opacity: 0.6 
                    }}>
                        <p>No tracks available</p>
                        <p style={{ fontSize: '0.875rem' }}>
                            Add music files to your library
                        </p>
                    </div>
                ) : (
                    tracks.map((track) => (
                        <div 
                            key={track.id}
                            className="track-item"
                            onClick={() => onTrackSelect(track)}
                        >
                            <div className="track-info">
                                <h4 className="track-title">{track.title}</h4>
                                <p className="track-artist">{track.artist}</p>
                            </div>
                            
                            <div className="track-duration">
                                {formatTime(track.duration)}
                            </div>
                            
                            <div className="track-actions">
                                <button 
                                    className="action-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onTrackSelect(track);
                                    }}
                                    title="Play now"
                                >
                                    ▶
                                </button>
                                <button 
                                    className="action-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAddToQueue(track);
                                    }}
                                    title="Add to queue"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
}
