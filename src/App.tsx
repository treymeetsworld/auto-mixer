import { useRef, useState } from "react";
import Waveform, { type WaveformHandle } from "./components/Waveform";
import PlayerControls from "./components/PlayerControls";
import AlbumArt from "./components/AlbumArt";
import LocalFileSystemBrowser from "./components/LocalFileSystemBrowser";
// import QueuePanel from "./components/QueuePanel";
// import FileBrowser from "./components/FileBrowser";
import "./App.css";

interface Track {
    id: string;
    title: string;
    artist: string;
    duration: number;
    url: string;
    file?: File; // For local files
}

const sampleTracks: Track[] = [
    {
        id: "1",
        title: "The Vibe",
        artist: "Ayo Jay",
        duration: 240,
        url: "/Ayo Jay - The Vibe (Clean).mp3"
    },
    {
        id: "2", 
        title: "Your Number",
        artist: "Ayo Jay ft Fetty Wap",
        duration: 180,
        url: "/Ayo Jay ft Fetty Wap - Your Number (Clean).mp3"
    }
];

export default function App() {
    const [currentTrack, setCurrentTrack] = useState<Track | null>(sampleTracks[0]);
    const [queue, setQueue] = useState<Track[]>(sampleTracks);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

    const waveformRef = useRef<WaveformHandle>(null);

    const handleTrackSelect = (track: Track | any) => {
        // Convert LocalFile to Track if needed
        const convertedTrack: Track = {
            id: track.id,
            title: track.title || 'Unknown Title',
            artist: track.artist || 'Unknown Artist',
            duration: track.duration || 0,
            url: track.url || '',
            file: track.file
        };
        
        setCurrentTrack(convertedTrack);
        const index = queue.findIndex(t => t.id === convertedTrack.id);
        if (index !== -1) {
            setCurrentTrackIndex(index);
        } else {
            // If track is not in queue, add it and play
            setQueue(prev => [convertedTrack, ...prev]);
            setCurrentTrackIndex(0);
        }
    };

    const handleAddToQueue = (track: Track | any) => {
        // Convert LocalFile to Track if needed
        const convertedTrack: Track = {
            id: track.id,
            title: track.title || 'Unknown Title',
            artist: track.artist || 'Unknown Artist',
            duration: track.duration || 0,
            url: track.url || '',
            file: track.file
        };
        
        setQueue(prev => [...prev, convertedTrack]);
    };

    const handleRemoveFromQueue = (trackId: string) => {
        setQueue(prev => prev.filter(t => t.id !== trackId));
    };

    const handleNextTrack = () => {
        const nextIndex = (currentTrackIndex + 1) % queue.length;
        setCurrentTrackIndex(nextIndex);
        setCurrentTrack(queue[nextIndex]);
    };

    const handlePreviousTrack = () => {
        const prevIndex = currentTrackIndex === 0 ? queue.length - 1 : currentTrackIndex - 1;
        setCurrentTrackIndex(prevIndex);
        setCurrentTrack(queue[prevIndex]);
    };

    return (
        <div className="app">
            {/* Top Section - Music Player */}
            <div className="player-section">
                <div className="main-header">
                    <h1>Auto-Mix DJ</h1>
                </div>
                
                {currentTrack && (
                    <div className="track-display-container">
                        <AlbumArt 
                            artist={currentTrack.artist}
                            title={currentTrack.title}
                            size="large"
                        />
                        <div className="track-details">
                            <h2>{currentTrack.title}</h2>
                            <p>{currentTrack.artist}</p>
                        </div>
                    </div>
                )}
                
                <div className="waveform-container">
                    <Waveform
                        ref={waveformRef}
                        url={currentTrack?.url || ""}
                        onSeek={() => {}}
                    />
                </div>

                <PlayerControls
                    waveformRef={waveformRef}
                    onSeek={() => {}}
                    onTimeUpdate={() => {}}
                    onPlayingChange={() => {}}
                    onNext={handleNextTrack}
                    onPrevious={handlePreviousTrack}
                    currentTrackId={currentTrack?.id}
                />
            </div>

            {/* Bottom Section - Side by Side Panels */}
            <div className="panels-section">
                <div className="queue-panel">
                    <div className="panel-header">
                        <h3>
                            <i className="fas fa-music"></i>
                            Queue ({queue.length})
                        </h3>
                    </div>
                    <div className="panel-content">
                        {queue.map((track, index) => (
                            <div 
                                key={track.id}
                                className={`track-item track-item-with-art ${currentTrack?.id === track.id ? 'current' : ''}`}
                                onClick={() => handleTrackSelect(track)}
                            >
                                <div className="track-number">
                                    {index + 1}
                                </div>
                                
                                <AlbumArt 
                                    artist={track.artist}
                                    title={track.title}
                                    size="small"
                                />
                                
                                <div className="track-info">
                                    <h4 className="track-title">{track.title}</h4>
                                    <p className="track-artist">{track.artist}</p>
                                </div>
                                
                                <div className="track-duration">
                                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                                </div>
                                
                                <div className="track-actions">
                                    <button 
                                        className="action-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveFromQueue(track.id);
                                        }}
                                        title="Remove from queue"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="file-browser-panel">
                    <LocalFileSystemBrowser
                        onTrackSelect={handleTrackSelect}
                        onAddToQueue={handleAddToQueue}
                    />
                </div>
            </div>
        </div>
    );
}
