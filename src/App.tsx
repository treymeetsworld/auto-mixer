import { useState, useEffect, useRef } from 'react';
import AudioPlayer, { type AudioPlayerRef } from './components/AudioPlayer';
import TrackSelector from './components/TrackSelector';
import TransitionControl from './components/TransitionControl';
import MasterTimelineComponent from './components/MasterTimeline';
import type { Track, TransitionPoint, MasterTimeline } from './types';
import { calculateMasterTimeline, getMasterTimeFromTrackTime, getTrackTimeFromMasterTime } from './utils/timeline';
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
  const [isInTransition, setIsInTransition] = useState(false); // Track if we're in the middle of a transition
  const [isInSecondSegment, setIsInSecondSegment] = useState(false); // Track if we're in second part of a mix
  const [lastTransition, setLastTransition] = useState<TransitionPoint | null>(null); // Keep the last transition for timeline continuity
  const [currentTrack, setCurrentTrack] = useState<Track>(sampleTracks[0]);
  const [nextTrack, setNextTrack] = useState<Track | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [transitionPoint, setTransitionPoint] = useState<TransitionPoint | null>(null);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const [nextStartTime, setNextStartTime] = useState(0);
  const [masterTimeline, setMasterTimeline] = useState<MasterTimeline>(() => 
    calculateMasterTimeline(sampleTracks[0], null, null)
  );
  const [currentMasterTime, setCurrentMasterTime] = useState(0);

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    
    // Calculate master time based on current track and time
    const masterTime = getMasterTimeFromTrackTime(masterTimeline, currentTrack.id, time);
    setCurrentMasterTime(masterTime);
    
    // Check if we should transition to next track
    if (transitionPoint && nextTrack && time >= transitionPoint.startTime && !isInTransition) {
      // Mark that we're transitioning
      setIsInTransition(true);
      setLastTransition(transitionPoint); // Store the transition
      
      // Transition to next track
      const startTime = transitionPoint.nextSongStartTime || 0;
      
      setCurrentTrack(nextTrack);
      setNextTrack(null);
      setTransitionPoint(null);
      setNextStartTime(startTime);
      setShouldAutoPlay(true);
      setCurrentTime(startTime);
      setIsInSecondSegment(true); // Now we're in the second segment
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
      setNextStartTime(0);
      setShouldAutoPlay(false);
      // Recalculate timeline for new current track
      const newTimeline = calculateMasterTimeline(track, null, null);
      setMasterTimeline(newTimeline);
      setCurrentMasterTime(0);
    } else {
      // Queue as next track
      setNextTrack(track);
      // Don't recalculate timeline yet - wait for transition to be set
    }
  };

  const handleMasterSeek = (masterTime: number) => {
    // Find which track and time this master time corresponds to
    const result = getTrackTimeFromMasterTime(masterTimeline, masterTime);
    if (result && result.trackId === currentTrack.id) {
      // If we're seeking within the current track, just update the time
      setCurrentTime(result.trackTime);
      setCurrentMasterTime(masterTime);
      // Seek the audio player
      audioPlayerRef.current?.seek(result.trackTime);
    }
  };

  const handleSetTransition = (transition: TransitionPoint) => {
    setTransitionPoint(transition);
    setLastTransition(transition); // Store for timeline continuity
    // Calculate and store the complete timeline with the transition
    const newTimeline = calculateMasterTimeline(currentTrack, nextTrack, transition);
    setMasterTimeline(newTimeline);
    console.log('Transition set:', transition);
    console.log('Complete timeline stored:', newTimeline);
  };

  const handleClearNext = () => {
    setNextTrack(null);
    setTransitionPoint(null);
    // Recalculate timeline without next track
    const newTimeline = calculateMasterTimeline(currentTrack, null, null);
    setMasterTimeline(newTimeline);
  };

  // Reset auto-play state after track changes
  useEffect(() => {
    if (shouldAutoPlay) {
      // Reset auto-play after it's been used
      const timer = setTimeout(() => {
        setShouldAutoPlay(false);
        setNextStartTime(0);
        setIsInTransition(false); // Reset transition flag
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [currentTrack, shouldAutoPlay]);

  // Recalculate timeline when tracks/transitions change
  useEffect(() => {
    if (!isInTransition) {
      // If we're in the second segment of a mix, use the last transition data
      if (isInSecondSegment && lastTransition && !nextTrack && !transitionPoint) {
        const newTimeline = calculateMasterTimeline(currentTrack, null, lastTransition, true);
        setMasterTimeline(newTimeline);
      } else {
        // Normal timeline calculation
        const newTimeline = calculateMasterTimeline(currentTrack, nextTrack, transitionPoint);
        setMasterTimeline(newTimeline);
      }
    }
  }, [currentTrack, nextTrack, transitionPoint, isInTransition, isInSecondSegment, lastTransition]);

  return (
    <div className="app">
      <h1>Auto Mixer</h1>
      
      <div className="current-track">
        <h2>{currentTrack.title}</h2>
        <p>{currentTrack.artist}</p>
        {transitionPoint && nextTrack && (
          <div className="transition-info">
            <small>
              Will transition to "{nextTrack.title}" at {Math.floor(transitionPoint.startTime / 60)}:{(transitionPoint.startTime % 60).toString().padStart(2, '0')} | 
              Total mix duration: {Math.floor(masterTimeline.totalDuration / 60)}:{(masterTimeline.totalDuration % 60).toString().padStart(2, '0')}
            </small>
          </div>
        )}
      </div>

      <MasterTimelineComponent
        timeline={masterTimeline}
        currentMasterTime={currentMasterTime}
        onSeek={handleMasterSeek}
      />

      <AudioPlayer 
        ref={audioPlayerRef}
        src={currentTrack.url}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        autoPlay={shouldAutoPlay}
        startTime={nextStartTime}
      />

      <div className="track-info">
        <p>Track Time: {Math.floor(currentTime)}s | Master Time: {Math.floor(currentMasterTime)}s</p>
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
