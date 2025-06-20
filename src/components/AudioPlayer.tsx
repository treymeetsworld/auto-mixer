import { useRef, useState, useEffect } from 'react';
import './AudioPlayer.scss';

interface AudioPlayerProps {
  src: string;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  autoPlay?: boolean;
  startTime?: number;
}

export default function AudioPlayer({ 
  src, 
  onTimeUpdate, 
  onDurationChange,
  onPlay,
  onPause,
  autoPlay = false,
  startTime = 0
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    };

    const handleDurationChange = () => {
      const dur = audio.duration;
      setDuration(dur);
      onDurationChange?.(dur);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [onTimeUpdate, onDurationChange, onPlay, onPause]);

  // Handle source changes, auto-play, and start time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    const handleCanPlay = () => {
      // Set start time if specified
      if (startTime > 0) {
        audio.currentTime = startTime;
        setCurrentTime(startTime);
      }
      
      // Auto-play if requested
      if (autoPlay) {
        audio.play().catch(console.error);
      }
    };

    // Reset state when source changes
    setCurrentTime(startTime);
    setIsPlaying(false);
    
    audio.addEventListener('canplay', handleCanPlay);
    
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [src, autoPlay, startTime]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={src} />
      
      <div className="player-controls">
        <button 
          className="play-button"
          onClick={togglePlayPause}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <div className="time-display">
          {formatTime(currentTime)}
        </div>
        
        <div className="progress-bar" onClick={handleSeek}>
          <div 
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        <div className="time-display">
          {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}
