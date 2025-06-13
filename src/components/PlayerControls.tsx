import React, { useState, useEffect } from "react";
import type {WaveformHandle} from "./Waveform";
import { formatTime } from "../utils/audioUtils";

type Props = {
    waveformRef: React.RefObject<WaveformHandle | null>;
    onSeek: (time: number) => void;
    onTimeUpdate: (time: number) => void;
    onPlayingChange: (playing: boolean) => void;
    onNext?: () => void;
    onPrevious?: () => void;
    currentTrackId?: string; // Add track ID to reset play state when track changes
};

export default function PlayerControls({
    waveformRef,
    onSeek,
    onTimeUpdate,
    onPlayingChange,
    onNext,
    onPrevious,
    currentTrackId,
}: Props) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1); // Volume from 0 to 1
    const [isMuted, setIsMuted] = useState(false);
    const [previousVolume, setPreviousVolume] = useState(1);    // Reset play state when track changes
    useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        onPlayingChange(false);
    }, [currentTrackId, onPlayingChange]);

    // Initialize volume when waveform is ready
    useEffect(() => {
        if (waveformRef.current) {
            waveformRef.current.setVolume(volume);
        }
    }, [waveformRef, volume]);

    // poll Wavesurfer for current time so slider and display update
    useEffect(() => {
        const iv = setInterval(() => {
            const t = waveformRef.current?.getCurrentTime() || 0;
            setCurrentTime(t);
            onTimeUpdate(t);
        }, 100);
        return () => clearInterval(iv);
    }, [waveformRef, onTimeUpdate]);

    const togglePlay = () => {
        waveformRef.current?.playPause();
        setIsPlaying((p) => {
            const next = !p;
            onPlayingChange(next);
            return next;
        });
    };    const handleSeekInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        waveformRef.current?.seekTo(time);
        setCurrentTime(time);
        onSeek(time);
    };

    const toggleMute = () => {
        if (isMuted) {
            // Unmute: restore previous volume
            setVolume(previousVolume);
            setIsMuted(false);
            waveformRef.current?.setVolume(previousVolume);
        } else {
            // Mute: save current volume and set to 0
            setPreviousVolume(volume);
            setVolume(0);
            setIsMuted(true);
            waveformRef.current?.setVolume(0);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = Number(e.target.value);
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
        waveformRef.current?.setVolume(newVolume);
        
        // Update previous volume if not muted
        if (newVolume > 0) {
            setPreviousVolume(newVolume);
        }
    };

    const getVolumeIcon = () => {
        if (isMuted || volume === 0) return "fa-volume-mute";
        if (volume < 0.5) return "fa-volume-down";
        return "fa-volume-up";
    };

    const duration = waveformRef.current?.getDuration() || 0;

    return (
        <div className="player-controls">            <div className="controls-row">
                <button 
                    className="control-btn secondary"
                    onClick={onPrevious}
                    disabled={!onPrevious}
                    title="Previous track"
                >
                    <i className="fas fa-step-backward"></i>
                </button>
                
                <button 
                    className="control-btn primary play-btn"
                    onClick={togglePlay}
                    title={isPlaying ? "Pause" : "Play"}
                >
                    <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"}`}></i>
                </button>
                  <button 
                    className="control-btn secondary"
                    onClick={onNext}
                    disabled={!onNext}
                    title="Next track"
                >
                    <i className="fas fa-step-forward"></i>
                </button>
            </div>

            <div className="volume-container">
                <button 
                    className="volume-btn"
                    onClick={toggleMute}
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    <i className={`fas ${getVolumeIcon()}`}></i>
                </button>
                
                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                />
            </div>

            <div className="progress-container">
                <span className="time-display">
                    {formatTime(currentTime)}
                </span>
                
                <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.01}
                    value={currentTime}
                    onChange={handleSeekInput}
                    className="progress-slider"
                />
                
                <span className="time-display">
                    {formatTime(duration)}
                </span>
            </div>
        </div>
    );
}
