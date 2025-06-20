import { useState, useEffect } from 'react';
import AudioPlayer from './components/AudioPlayer';
import TrackSelector from './components/TrackSelector';
import TransitionControl from './components/TransitionControl';
import type { Track, TransitionPoint } from './types';
import './App.scss';

// Sample tracks for testing
const sampleTracks: Track[] = [
  {
    id: '1',
    title: 'The Vibe',
    artist: 'Ayo Jay',
    url: '/Ayo Jay - The Vibe (Clean).mp3',
    duration: 240
  },
  {
    id: '2',
    title: 'Your Number', 
    artist: 'Ayo Jay ft Fetty Wap',
    url: '/Ayo Jay ft Fetty Wap - Your Number (Clean).mp3',
    duration: 180
  }
];

function App() {
  const [currentTrack, setCurrentTrack] = useState<Track>(sampleTracks[0]);
  const [nextTrack, setNextTrack] = useState<Track | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [transitionPoint, setTransitionPoint] = useState<TransitionPoint | null>(null);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const [nextStartTime, setNextStartTime] = useState(0);

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    
    // Check if we should transition to next track
    if (transitionPoint && nextTrack && time >= transitionPoint.startTime) {
      // Transition to next track
      const startTime = transitionPoint.nextSongStartTime || 0; // Use nextSongStartTime for where next song begins
      
      setCurrentTrack(nextTrack);
      setNextTrack(null);
      setTransitionPoint(null);
      setNextStartTime(startTime);
      setShouldAutoPlay(true);
      setCurrentTime(startTime);
    }
  };

  const handleDurationChange = (duration: number) => {
    // Update track duration if needed
    console.log('Duration loaded:', duration);
  };

  const handleTrackSelect = (track: Track) => {
    if (track.id === currentTrack.id) return;
    
    // If no current track is playing, switch immediately
    if (!currentTrack) {
      setCurrentTrack(track);
      setCurrentTime(0);
    } else {
      // Queue as next track
      setNextTrack(track);
    }
  };

  const handleSetTransition = (transition: TransitionPoint) => {
    setTransitionPoint(transition);
    console.log('Transition set:', transition);
  };

  const handleClearNext = () => {
    setNextTrack(null);
    setTransitionPoint(null);
  };

  // Reset auto-play state after track changes
  useEffect(() => {
    if (shouldAutoPlay) {
      // Reset auto-play after it's been used
      const timer = setTimeout(() => {
        setShouldAutoPlay(false);
        setNextStartTime(0);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [currentTrack, shouldAutoPlay]);

  return (
    <div className="app">
      <h1>Auto Mixer</h1>
      
      <div className="current-track">
        <h2>{currentTrack.title}</h2>
        <p>{currentTrack.artist}</p>
        {transitionPoint && nextTrack && (
          <div className="transition-info">
            <small>
              Will transition to "{nextTrack.title}" at {Math.floor(transitionPoint.startTime / 60)}:{(transitionPoint.startTime % 60).toString().padStart(2, '0')}
            </small>
          </div>
        )}
      </div>

      <AudioPlayer 
        src={currentTrack.url}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        autoPlay={shouldAutoPlay}
        startTime={nextStartTime}
      />

      <div className="track-info">
        <p>Current Time: {Math.floor(currentTime)}s</p>
      </div>

      <TransitionControl
        currentTrack={currentTrack}
        nextTrack={nextTrack}
        currentTime={currentTime}
        onSetTransition={handleSetTransition}
        onClearNext={handleClearNext}
      />

      <TrackSelector 
        tracks={sampleTracks.filter(track => track.id !== currentTrack.id)}
        onSelectTrack={handleTrackSelect}
        currentTrackId={nextTrack?.id}
      />
    </div>
  );
}

export default App;
