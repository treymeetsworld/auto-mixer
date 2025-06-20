import { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import './AudioPlayer.scss';

export interface AudioPlayerRef {
  seek: (time: number) => void;
  play: () => void;
  pause: () => void;
}

interface AudioPlayerProps {
  src: string;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  autoPlay?: boolean;
  startTime?: number;
}

const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(({ 
  src, 
  onTimeUpdate, 
  onDurationChange,
  onPlay,
  onPause,
  autoPlay = false,
  startTime = 0
}, ref) => {
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

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleWaiting = () => {
      setIsPlaying(false);
    };

    const handlePlaying = () => {
      setIsPlaying(true);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
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
        // Note: don't set setIsPlaying(true) here - let the 'play' event handler do it
      }
    };

    const handleLoadStart = () => {
      // Reset state when source starts loading
      setCurrentTime(startTime);
      setIsPlaying(false);
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);
    
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, [src, autoPlay, startTime]);

  // Handle startTime changes independently (for same-song transitions)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    // If the audio is ready and we have a new startTime, seek to it immediately
    if (audio.readyState >= 2) { // HAVE_CURRENT_DATA or higher
      if (startTime !== audio.currentTime) {
        audio.currentTime = startTime;
        setCurrentTime(startTime);
        
        // If autoPlay is true, ensure playback continues
        if (autoPlay && audio.paused) {
          audio.play().catch(console.error);
        }
      }
    }
  }, [startTime, autoPlay]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    seek: (time: number) => {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = time;
        setCurrentTime(time);
      }
    },
    play: () => {
      const audio = audioRef.current;
      if (audio) {
        audio.play().catch(console.error);
      }
    },
    pause: () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
      }
    }
  }), []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
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
});

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;
