import { formatTime } from "../utils/audioUtils";

interface Track {
    id: string;
    title: string;
    artist: string;
    duration: number;
    url: string;
}

interface QueuePanelProps {
    queue: Track[];
    currentTrack: Track | null;
    onTrackSelect: (track: Track) => void;
    onRemoveFromQueue: (trackId: string) => void;
}

export default function QueuePanel({ 
    queue, 
    currentTrack, 
    onTrackSelect, 
    onRemoveFromQueue 
}: QueuePanelProps) {
    return (
        <>
            <div className="panel-header">
                <h3>
                    <span>🎵</span>
                    Queue ({queue.length})
                </h3>
            </div>
            
            <div className="panel-content">
                {queue.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '2rem', 
                        opacity: 0.6 
                    }}>
                        <p>No tracks in queue</p>
                        <p style={{ fontSize: '0.875rem' }}>
                            Add tracks from the file browser
                        </p>
                    </div>
                ) : (
                    queue.map((track, index) => (
                        <div 
                            key={track.id}
                            className={`track-item ${currentTrack?.id === track.id ? 'current' : ''}`}
                            onClick={() => onTrackSelect(track)}
                        >
                            <div className="track-number">
                                {index + 1}
                            </div>
                            
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
                                        onRemoveFromQueue(track.id);
                                    }}
                                    title="Remove from queue"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
}
