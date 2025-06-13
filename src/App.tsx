import { useRef, useState } from "react";
import Waveform, { type WaveformHandle } from "./components/Waveform";
import PlayerControls from "./components/PlayerControls";
// import QueuePanel from "./components/QueuePanel";
// import FileBrowser from "./components/FileBrowser";
import "./App.css";

interface Track {
    id: string;
    title: string;
    artist: string;
    duration: number;
    url: string;
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

    const handleTrackSelect = (track: Track) => {
        setCurrentTrack(track);
        const index = queue.findIndex(t => t.id === track.id);
        if (index !== -1) {
            setCurrentTrackIndex(index);
        }
    };

    const handleAddToQueue = (track: Track) => {
        setQueue(prev => [...prev, track]);
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
                <div className="player-header">
                    <h1>Auto-Mix DJ</h1>
                    {currentTrack && (
                        <div className="current-track-info">
                            <h2>{currentTrack.title}</h2>
                            <p>{currentTrack.artist}</p>
                        </div>
                    )}
                </div>
                
                <div className="waveform-container">
                    <Waveform
                        ref={waveformRef}
                        url={currentTrack?.url || ""}
                        onSeek={(t) => console.log('Seek:', t)}
                    />
                </div>

                <PlayerControls
                    waveformRef={waveformRef}
                    onSeek={(t) => console.log('Seek:', t)}
                    onTimeUpdate={(t) => console.log('Time update:', t)}
                    onPlayingChange={(p) => console.log('Playing:', p)}
                    onNext={handleNextTrack}
                    onPrevious={handlePreviousTrack}
                />
            </div>

            {/* Bottom Section - Side by Side Panels */}
            <div className="panels-section">
                <div className="queue-panel">
                    <div className="panel-header">
                        <h3>
                            <span>🎵</span>
                            Queue ({queue.length})
                        </h3>
                    </div>
                    <div className="panel-content">
                        {queue.map((track, index) => (
                            <div 
                                key={track.id}
                                className={`track-item ${currentTrack?.id === track.id ? 'current' : ''}`}
                                onClick={() => handleTrackSelect(track)}
                            >
                                <div className="track-number">
                                    {index + 1}
                                </div>
                                
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
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="file-browser-panel">
                    <div className="panel-header">
                        <h3>
                            <span>📁</span>
                            Library ({sampleTracks.length})
                        </h3>
                    </div>
                    <div className="panel-content">
                        {sampleTracks.map((track) => (
                            <div 
                                key={track.id}
                                className="track-item"
                                onClick={() => handleTrackSelect(track)}
                            >
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
                                            handleTrackSelect(track);
                                        }}
                                        title="Play now"
                                    >
                                        ▶
                                    </button>
                                    <button 
                                        className="action-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddToQueue(track);
                                        }}
                                        title="Add to queue"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
