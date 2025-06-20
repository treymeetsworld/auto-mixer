import { useState, useEffect, useRef } from 'react';
import AudioPlayer, { type AudioPlayerRef } from './components/AudioPlayer';
import TrackSelector from './components/TrackSelector';
import TransitionControl from './components/TransitionControl';
import MasterTimelineControls from './components/MasterTimelineControls';
import type { Track, TransitionPoint, MasterTimeline } from './types';
import { getTrackTimeFromMasterTime, calculateMasterTimeline, getMasterTimeFromTrackTime } from './utils/timeline';
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
  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  
  // Simple state management with individual useState hooks
  const [currentTrack, setCurrentTrack] = useState<Track>(sampleTracks[0]);
  const [nextTrack, setNextTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentMasterTime, setCurrentMasterTime] = useState(0);
  const [masterTimeline, setMasterTimeline] = useState<MasterTimeline>(() => 
    calculateMasterTimeline(sampleTracks[0], null, null)
  );
  const [transitionPoint, setTransitionPoint] = useState<TransitionPoint | null>(null);
  const [isInTransition, setIsInTransition] = useState(false);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const [nextStartTime, setNextStartTime] = useState(0);

  const handleAudioTimeUpdate = (time: number) => {
    const masterTime = getMasterTimeFromTrackTime(masterTimeline, currentTrack.id, time);
    setCurrentTime(time);
    setCurrentMasterTime(masterTime);

    // Check for transitions
    if (transitionPoint && nextTrack && time >= transitionPoint.startTime && !isInTransition) {
      const startTime = transitionPoint.nextSongStartTime || 0;
      const isSameSongTransition = currentTrack.id === nextTrack.id;
      
      setIsInTransition(true);
      setCurrentTrack(nextTrack);
      setNextTrack(null);
      setTransitionPoint(null);
      setNextStartTime(startTime);
      setShouldAutoPlay(true);
      setCurrentTime(startTime);

      if (isSameSongTransition) {
        // For same-song transitions, force a seek
        setTimeout(() => {
          audioPlayerRef.current?.seek(startTime);
          if (isPlaying) {
            audioPlayerRef.current?.play();
          }
        }, 50);
      }
    }
  };

  const handleDurationChange = (duration: number) => {
    console.log('Duration loaded:', duration);
  };

  const handleAudioPlay = () => {
    setIsPlaying(true);
  };

  const handleAudioPause = () => {
    setIsPlaying(false);
  };

  const handleTrackSelect = (track: Track) => {
    if (!currentTrack) {
      setCurrentTrack(track);
      setCurrentTime(0);
      setNextStartTime(0);
      setShouldAutoPlay(false);
      setCurrentMasterTime(0);
    } else {
      setNextTrack(track);
    }
  };

  const handleMasterSeek = (masterTime: number) => {
    const result = getTrackTimeFromMasterTime(masterTimeline, masterTime);
    if (result && result.trackId === currentTrack.id) {
      setCurrentMasterTime(masterTime);
      audioPlayerRef.current?.seek(result.trackTime);
    }
  };

  const handleMasterPlay = () => {
    audioPlayerRef.current?.play();
    setIsPlaying(true);
  };

  const handleMasterPause = () => {
    audioPlayerRef.current?.pause();
    setIsPlaying(false);
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
      const timer = setTimeout(() => {
        setShouldAutoPlay(false);
        setNextStartTime(0);
        setIsInTransition(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [currentTrack, shouldAutoPlay]);

  // Recalculate timeline when tracks/transitions change
  useEffect(() => {
    if (!isInTransition) {
      let newTimeline: MasterTimeline;
      
      if (nextTrack && transitionPoint) {
        newTimeline = calculateMasterTimeline(currentTrack, nextTrack, transitionPoint);
      } else {
        newTimeline = calculateMasterTimeline(currentTrack, null, null);
      }
      
      setMasterTimeline(newTimeline);
    }
  }, [currentTrack, nextTrack, transitionPoint, isInTransition]);

  return (
    <div className="app">
      <h1>Auto Mixer</h1>
      
      <div className="current-track">
        <h2>{currentTrack?.title || 'No track selected'}</h2>
        <p>{currentTrack?.artist || ''}</p>
        {transitionPoint && nextTrack && (
          <div className="transition-info">
            <small>
              Next: "{nextTrack.title}" | Total mix: {Math.floor(masterTimeline.totalDuration / 60)}:{(masterTimeline.totalDuration % 60).toString().padStart(2, '0')}
            </small>
          </div>
        )}
      </div>

      <MasterTimelineControls
        timeline={masterTimeline}
        currentMasterTime={currentMasterTime}
        isPlaying={isPlaying}
        onSeek={handleMasterSeek}
        onPlay={handleMasterPlay}
        onPause={handleMasterPause}
      />

      {/* Hidden AudioPlayer - only for actual playback */}
      <div style={{ display: 'none' }}>
        <AudioPlayer 
          ref={audioPlayerRef}
          src={currentTrack?.url || ''}
          onTimeUpdate={handleAudioTimeUpdate}
          onDurationChange={handleDurationChange}
          onPlay={handleAudioPlay}
          onPause={handleAudioPause}
          autoPlay={shouldAutoPlay}
          startTime={nextStartTime}
        />
      </div>

      <TransitionControl
        currentTrack={currentTrack}
        nextTrack={nextTrack}
        currentTime={currentTime}
        onSetTransition={handleSetTransition}
        onClearNext={handleClearNext}
      />

      <TrackSelector 
        tracks={sampleTracks}
        onSelectTrack={handleTrackSelect}
        currentTrackId={currentTrack?.id}
        nextTrackId={nextTrack?.id}
      />
    </div>
  );
}

export default App;
