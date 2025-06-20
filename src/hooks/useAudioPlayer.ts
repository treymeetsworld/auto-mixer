import { useRef, useEffect, useCallback } from 'react';

export interface AudioPlayerHook {
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setSource: (src: string) => void;
}

interface UseAudioPlayerOptions {
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  autoPlay?: boolean;
  startTime?: number;
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}): AudioPlayerHook {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio element if it doesn't exist
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';
    }
    
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      options.onTimeUpdate?.(audio.currentTime);
    };
    
    const handleDurationChange = () => {
      options.onDurationChange?.(audio.duration);
    };
    
    const handlePlay = () => {
      options.onPlay?.();
    };
    
    const handlePause = () => {
      options.onPause?.();
    };
    
    const handleEnded = () => {
      options.onEnded?.();
    };
    
    // Add event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      // Cleanup event listeners
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [options.onTimeUpdate, options.onDurationChange, options.onPlay, options.onPause, options.onEnded]);
  
  // Handle autoPlay and startTime
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleCanPlay = () => {
      if (options.startTime && options.startTime > 0) {
        audio.currentTime = options.startTime;
      }
      
      if (options.autoPlay) {
        audio.play().catch(console.error);
      }
    };
    
    audio.addEventListener('canplay', handleCanPlay);
    
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [options.autoPlay, options.startTime]);
  
  // Handle startTime changes independently
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !options.startTime) return;
    
    if (audio.readyState >= 2 && Math.abs(audio.currentTime - options.startTime) > 0.1) {
      audio.currentTime = options.startTime;
    }
  }, [options.startTime]);
  
  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (audio) {
      try {
        await audio.play();
      } catch (error) {
        console.error('Failed to play audio:', error);
      }
    }
  }, []);
  
  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
  }, []);
  
  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
    }
  }, []);
  
  const setVolume = useCallback((volume: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);
  
  const setSource = useCallback((src: string) => {
    const audio = audioRef.current;
    if (audio) {
      audio.src = src;
      audio.load();
    }
  }, []);
  
  return {
    play,
    pause,
    seek,
    setVolume,
    setSource
  };
}
