import { useState, useEffect, useRef } from 'react';
import { useAudio } from './core/AudioContext';
import { TimelineSection, SegmentDetails } from './components/timeline';
import { TransitionSettings } from './components/transition';
import { TrendingUp } from 'lucide-react';

function App() {
  const { state, dispatch, audioEngine } = useAudio();
  const [pendingTransitionPoint, setPendingTransitionPoint] = useState(0);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const currentPlayingSegmentRef = useRef<any>(null);

  // Animation frame for playback progress
  useEffect(() => {
    if (state.timeline.isPlaying) {
      const updateTime = () => {
        try {
          // currentTime here is the elapsed time within the currently playing source buffer
          const engineElapsedMs = audioEngine.getCurrentTime();
          
          // Find current segment based on timeline position
          const currentSegment = getCurrentSegment();
          
          // If we don't have a playing segment tracked, set it to the current segment
          if (!currentPlayingSegmentRef.current && currentSegment) {
            currentPlayingSegmentRef.current = currentSegment;
          }
          
          // Use the tracked playing segment for audio time calculations
          const playingSegment = currentPlayingSegmentRef.current || currentSegment;
          
          // Calculate actual timeline position
          let timelinePosition = state.timeline.currentTime;
          
          if (playingSegment) {
            // Calculate timeline start position for the current playing segment
            let segmentTimelineStart = 0;
            for (const segment of state.segments) {
              if (segment.id === playingSegment.id) break;
              segmentTimelineStart += segment.segmentDuration;
            }
            
            // Calculate the absolute position inside source buffer
            // engineElapsedMs is the absolute buffer time used when starting playback
            // playingSegment.segmentStart is the source buffer start for this segment
            const segmentOffset = Math.max(0, engineElapsedMs - playingSegment.segmentStart);
            const clampedOffset = Math.min(segmentOffset, playingSegment.segmentEnd - playingSegment.segmentStart);
            timelinePosition = segmentTimelineStart + clampedOffset;
          }
          
          dispatch({ 
            type: 'UPDATE_PLAYBACK_TIME', 
            payload: { currentTime: timelinePosition } 
          });
          
          // Stop at end of timeline
          if (timelinePosition >= state.timeline.duration) {
            dispatch({ type: 'STOP_PLAYBACK' });
            return;
          }
          
          // Check if current audio has reached the end of its segment
          if (playingSegment && engineElapsedMs >= playingSegment.segmentEnd) {
            // Find the next segment
            const currentIndex = state.segments.findIndex(seg => seg.id === playingSegment.id);
            const nextSegment = state.segments[currentIndex + 1];
            
            if (nextSegment) {
              const nextSource = state.sources[nextSegment.sourceId];
              if (nextSource?.buffer) {
                const effectiveVolume = state.isMuted ? 0 : state.volume;
                
                // Update the tracked playing segment BEFORE starting playback
                currentPlayingSegmentRef.current = nextSegment;
                
                // Transition to next segment
                audioEngine.play(
                  nextSource.buffer, 
                  nextSegment.segmentStart,
                  effectiveVolume,
                  state.playbackRate
                ).catch(error => console.error('Transition error:', error));
              }
            } else {
              currentPlayingSegmentRef.current = null;
              dispatch({ type: 'STOP_PLAYBACK' });
            }
          }
          
          animationFrameRef.current = requestAnimationFrame(updateTime);
        } catch (error) {
          console.error('Playback error:', error);
          dispatch({ type: 'STOP_PLAYBACK' });
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(updateTime);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.timeline.isPlaying, audioEngine, dispatch, state.timeline.duration]);

  const handlePlayPause = async () => {
    try {
      if (!state.timeline.isPlaying) {
        // Find current segment based on timeline position
        const currentSegment = getCurrentSegment();
        if (currentSegment && currentSegment.buffer) {
          // Calculate timeline start position for this segment
          let segmentTimelineStart = 0;
          for (const segment of state.segments) {
            if (segment.id === currentSegment.id) break;
            segmentTimelineStart += segment.segmentDuration;
          }
          
          const segmentOffset = state.timeline.currentTime - segmentTimelineStart;
          const effectiveVolume = state.isMuted ? 0 : state.volume;
          
          // Reset the tracked playing segment when starting fresh
          currentPlayingSegmentRef.current = currentSegment;
          
          await audioEngine.play(
            currentSegment.buffer, 
            currentSegment.segmentStart + segmentOffset,
            effectiveVolume,
            state.playbackRate
          );
        }
      } else {
        audioEngine.pause();
      }
      dispatch({ type: 'PLAY_PAUSE' });
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const handleStop = () => {
    audioEngine.stop();
    currentPlayingSegmentRef.current = null;
    dispatch({ type: 'STOP_PLAYBACK' });
  };

  const handleSeek = async (time: number) => {
  // Update the timeline current time immediately for responsive UI
  dispatch({ type: 'SEEK_TO_TIME', payload: { time } });
    
    // Calculate which segment contains the target time
    let cumulativeTime = 0;
    let targetSegment = null;
    let segmentTimelineStart = 0;
    
    for (const segment of state.segments) {
      if (time >= cumulativeTime && time < cumulativeTime + segment.segmentDuration) {
        targetSegment = segment;
        segmentTimelineStart = cumulativeTime;
        break;
      }
      cumulativeTime += segment.segmentDuration;
    }
    
    if (targetSegment) {
      const source = state.sources[targetSegment.sourceId];
      
      if (source?.buffer) {
        const effectiveVolume = state.isMuted ? 0 : state.volume;
        // Calculate the offset within the target segment
        const segmentOffset = time - segmentTimelineStart;
        const seekPosition = targetSegment.segmentStart + segmentOffset;
        
        // Update the tracked playing segment when seeking
        const previousPlayingSegment = currentPlayingSegmentRef.current;
        currentPlayingSegmentRef.current = targetSegment;
        
        try {
          // If we're playing, restart immediately at the new position for continuity
          if (state.timeline.isPlaying) {
            await audioEngine.play(
              source.buffer,
              seekPosition,
              effectiveVolume,
              state.playbackRate
            );
          } else {
            await audioEngine.seekTo(seekPosition, source.buffer, effectiveVolume, state.playbackRate);
          }
        } catch (error) {
          console.error('Seek error:', error);
          // Restore previous playing segment on error
          currentPlayingSegmentRef.current = previousPlayingSegment;
        }
      } else {
        console.error('No source or buffer found for segment:', targetSegment.sourceId);
      }
    } else {
      console.error('No target segment found for seek time:', time, 'Available segments:', state.segments.map(seg => ({ id: seg.id, duration: seg.segmentDuration })));
    }
  };

  const handleVolumeChange = (volume: number) => {
    audioEngine.setVolume(volume);
    dispatch({ type: 'SET_VOLUME', payload: { volume } });
  };

  const handleMuteToggle = () => {
    dispatch({ type: 'TOGGLE_MUTE' });
    const newMutedState = !state.isMuted;
    const effectiveVolume = newMutedState ? 0 : state.volume;
    audioEngine.setVolume(effectiveVolume);
  };  const handlePlaybackRateChange = (rate: number) => {
    audioEngine.setPlaybackRate(rate);
    dispatch({ type: 'SET_PLAYBACK_RATE', payload: { rate } });
    
    // If playing, restart with new rate
    if (state.timeline.isPlaying) {
      handlePlayPause(); // Pause
      setTimeout(() => handlePlayPause(), 50); // Resume with new rate
    }
  };

  const getCurrentSegment = () => {
    // Calculate which segment contains the current time
    let cumulativeTime = 0;
    
    for (const segment of state.segments) {
      if (state.timeline.currentTime >= cumulativeTime && 
          state.timeline.currentTime < cumulativeTime + segment.segmentDuration) {
        const source = state.sources[segment.sourceId];
        return { ...segment, buffer: source?.buffer };
      }
      cumulativeTime += segment.segmentDuration;
    }
    
    return null;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Create object URL for the file
      const url = URL.createObjectURL(file);
      
      // Resume audio context
      await audioEngine.resume();
      
      // Load the audio buffer
      const buffer = await audioEngine.loadAudio(url);
      
      // Create audio source
      const source = {
        id: `source-${Date.now()}`,
        url,
        name: file.name,
        duration: buffer.duration * 1000, // Convert to ms
        buffer
      };

      // Load source into state
      dispatch({ type: 'LOAD_SOURCE', payload: source });

      // If no current track, select this as first track (Step 1 from LOGIC.md)
      if (!state.currentTrack) {
        dispatch({ 
          type: 'SELECT_FIRST_TRACK', 
          payload: { sourceId: source.id } 
        });
      } else if (!state.nextTrack) {
        // If current track exists but no next track, select as next (Step 2 from LOGIC.md)
        dispatch({ 
          type: 'SELECT_NEXT_TRACK', 
          payload: { sourceId: source.id } 
        });
      } else {
        // Auto-add track using ADD_TRACK_WITH_TRANSITION action
        // The transition point will be at the end of current timeline
        dispatch({ 
          type: 'ADD_TRACK_WITH_TRANSITION',
          payload: { 
            sourceId: source.id,
            transitionPoint: state.timeline.duration 
          } 
        });
      }

    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };

  const handleSetTransition = () => {
    if (state.currentTrack && state.nextTrack && pendingTransitionPoint !== undefined) {
      dispatch({ 
        type: 'SET_TRANSITION', 
        payload: { transitionPoint: pendingTransitionPoint } 
      });
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const removeFileExtension = (filename: string) => {
    return filename.replace(/\.[^/.]+$/, '');
  };

  return (
    <div className="app">
      <div className="content">
        <div className="main-content">
          <TimelineSection
            segments={state.segments}
            sources={state.sources}
            isPlaying={state.timeline.isPlaying}
            currentTime={state.timeline.currentTime}
            duration={state.timeline.duration}
            volume={state.volume}
            isMuted={state.isMuted}
            playbackRate={state.playbackRate}
            onFileUpload={handleFileUpload}
            onPlayPause={handlePlayPause}
            onStop={handleStop}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
            onMuteToggle={handleMuteToggle}
            onPlaybackRateChange={handlePlaybackRateChange}
            formatTime={formatTime}
          />

          <div className="details-and-transition">
            <SegmentDetails
              segments={state.segments}
              sources={state.sources}
              formatTime={formatTime}
              removeFileExtension={removeFileExtension}
            />

            <TransitionSettings
              currentTrack={state.currentTrack}
              nextTrack={state.nextTrack}
              sources={state.sources}
              pendingTransitionPoint={pendingTransitionPoint}
              onTransitionPointChange={setPendingTransitionPoint}
              onSetTransition={handleSetTransition}
              formatTime={formatTime}
            />
          </div>
        </div>

        <div className="sidebar">
          <div className="status">
            <h3><TrendingUp size={18} className="inline-icon" /> Timeline Status</h3>
            <p>
              <strong>Current Track:</strong> 
              <span>{state.currentTrack ? removeFileExtension(state.sources[state.currentTrack]?.name || 'Unknown') : 'None'}</span>
            </p>
            <p>
              <strong>Next Track:</strong> 
              <span>{state.nextTrack ? removeFileExtension(state.sources[state.nextTrack]?.name || 'Unknown') : 'None'}</span>
            </p>
            <p>
              <strong>Timeline Duration:</strong> 
              <span>{formatTime(state.timeline.duration)}</span>
            </p>
            <p>
              <strong>Current Time:</strong> 
              <span>{formatTime(state.timeline.currentTime)}</span>
            </p>
            <p>
              <strong>Total Segments:</strong> 
              <span>{state.segments.length}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
