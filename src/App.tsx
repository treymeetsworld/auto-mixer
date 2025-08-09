import { useState, useEffect, useRef } from 'react';
import { useAudio } from './core/AudioContext';
import { Waveform } from './components/Waveform';
import { 
  Upload,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Volume1,
  ListMusic,
  RotateCcw,
  TrendingUp
} from 'lucide-react';

function App() {
  const { state, dispatch, audioEngine } = useAudio();
  const [pendingTransitionPoint, setPendingTransitionPoint] = useState(0);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const currentPlayingSegmentRef = useRef<any>(null);

  // Update playback time with transition detection
  useEffect(() => {
    if (state.timeline.isPlaying) {
      const updateTime = () => {
        const currentTime = audioEngine.getCurrentTime();
        
        // Find current segment based on timeline position
        const currentSegment = getCurrentSegment();
        
        // If we don't have a playing segment tracked, set it to the current segment
        if (!currentPlayingSegmentRef.current && currentSegment) {
          currentPlayingSegmentRef.current = currentSegment;
        }
        
        // Use the tracked playing segment for audio time calculations
        const playingSegment = currentPlayingSegmentRef.current || currentSegment;
        
        // Debug current state
        if (playingSegment) {
          console.log('Audio playback state:', {
            audioCurrentTime: currentTime,
            segmentStart: playingSegment.segmentStart,
            segmentEnd: playingSegment.segmentEnd,
            segmentDuration: playingSegment.segmentEnd - playingSegment.segmentStart,
            timelineStart: playingSegment.timelineStart,
            timelineEnd: playingSegment.timelineEnd,
            segmentId: playingSegment.id,
            shouldTransition: currentTime >= (playingSegment.segmentEnd - playingSegment.segmentStart)
          });
        }
        
        // Calculate actual timeline position
        let timelinePosition = state.timeline.currentTime;
        
        if (playingSegment) {
          // Calculate timeline position based on current playing segment and audio position
          const segmentOffset = Math.min(currentTime, playingSegment.segmentEnd - playingSegment.segmentStart);
          timelinePosition = playingSegment.timelineStart + segmentOffset;
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
        if (playingSegment && currentTime >= (playingSegment.segmentEnd - playingSegment.segmentStart)) {
          console.log('Segment transition triggered:', {
            currentTime,
            segmentDuration: playingSegment.segmentEnd - playingSegment.segmentStart,
            segmentId: playingSegment.id
          });
          
          // Find the next segment
          const currentIndex = state.timeline.segments.findIndex(seg => seg.id === playingSegment.id);
          const nextSegment = state.timeline.segments[currentIndex + 1];
          
          if (nextSegment) {
            const nextSource = state.sources[nextSegment.sourceId];
            if (nextSource?.buffer) {
              const effectiveVolume = state.timeline.isMuted ? 0 : state.timeline.volume;
              
              console.log('Transitioning to next segment:', nextSegment.id);
              
              // Update the tracked playing segment BEFORE starting playback
              currentPlayingSegmentRef.current = nextSegment;
              
              // Transition to next segment
              audioEngine.play(
                nextSource.buffer, 
                nextSegment.segmentStart,
                effectiveVolume,
                state.timeline.playbackRate
              ).catch(error => console.error('Transition error:', error));
            }
          } else {
            console.log('No next segment found, stopping playback');
            currentPlayingSegmentRef.current = null;
            dispatch({ type: 'STOP_PLAYBACK' });
          }
        }
        
        animationFrameRef.current = requestAnimationFrame(updateTime);
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
          const segmentOffset = state.timeline.currentTime - currentSegment.timelineStart;
          const effectiveVolume = state.timeline.isMuted ? 0 : state.timeline.volume;
          
          // Reset the tracked playing segment when starting fresh
          currentPlayingSegmentRef.current = currentSegment;
          
          await audioEngine.play(
            currentSegment.buffer, 
            currentSegment.segmentStart + segmentOffset,
            effectiveVolume,
            state.timeline.playbackRate
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
    console.log('=== SEEK START ===', {
      seekTime: time,
      currentTimelineTime: state.timeline.currentTime,
      currentPlayingSegment: currentPlayingSegmentRef.current?.id,
      totalDuration: state.timeline.duration
    });
    
    // Update the timeline current time immediately for responsive UI
    dispatch({ type: 'SEEK_TO_TIME', payload: { time } });
    
    // Find the segment that contains the target seek time
    const targetSegment = state.timeline.segments.find(seg => 
      time >= seg.timelineStart && 
      time < seg.timelineEnd
    );
    
    console.log('Seek target segment:', {
      targetSegment: targetSegment ? {
        id: targetSegment.id,
        timelineStart: targetSegment.timelineStart,
        timelineEnd: targetSegment.timelineEnd,
        segmentStart: targetSegment.segmentStart,
        segmentEnd: targetSegment.segmentEnd
      } : null,
      allSegments: state.timeline.segments.map(seg => ({
        id: seg.id,
        timelineStart: seg.timelineStart,
        timelineEnd: seg.timelineEnd
      }))
    });
    
    if (targetSegment) {
      const source = state.sources[targetSegment.sourceId];
      if (source?.buffer) {
        const effectiveVolume = state.timeline.isMuted ? 0 : state.timeline.volume;
        // Calculate the offset within the target segment
        const segmentOffset = time - targetSegment.timelineStart;
        const seekPosition = targetSegment.segmentStart + segmentOffset;
        
        console.log('Seek calculation:', {
          segmentOffset,
          seekPosition,
          segmentStart: targetSegment.segmentStart,
          targetSegmentId: targetSegment.id
        });
        
        // Update the tracked playing segment when seeking
        currentPlayingSegmentRef.current = targetSegment;
        
        try {
          await audioEngine.seekTo(seekPosition, source.buffer, effectiveVolume, state.timeline.playbackRate);
          console.log('=== SEEK COMPLETE ===');
        } catch (error) {
          console.error('Seek error:', error);
        }
      }
    } else {
      console.log('No target segment found for seek time:', time);
    }
  };

  const handleVolumeChange = (volume: number) => {
    audioEngine.setVolume(volume);
    dispatch({ type: 'SET_VOLUME', payload: { volume } });
  };

  const handleMuteToggle = () => {
    const newMuted = !state.timeline.isMuted;
    audioEngine.setMuted(newMuted);
    dispatch({ type: 'TOGGLE_MUTE' });
  };

  const handlePlaybackRateChange = (rate: number) => {
    audioEngine.setPlaybackRate(rate);
    dispatch({ type: 'SET_PLAYBACK_RATE', payload: { rate } });
    
    // If playing, restart with new rate
    if (state.timeline.isPlaying) {
      handlePlayPause(); // Pause
      setTimeout(() => handlePlayPause(), 50); // Resume with new rate
    }
  };

  const getCurrentSegment = () => {
    const segment = state.timeline.segments.find(seg => 
      state.timeline.currentTime >= seg.timelineStart && 
      state.timeline.currentTime < seg.timelineEnd
    );
    
    if (segment) {
      const source = state.sources[segment.sourceId];
      return { ...segment, buffer: source?.buffer };
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
        // If both current and next track exist, automatically add this track to timeline
        // Find the end time of the last segment in the timeline
        const lastSegment = state.timeline.segments[state.timeline.segments.length - 1];
        const startTime = lastSegment ? lastSegment.timelineEnd : 0;
        
        // Create a new segment for this track
        const newSegment = {
          id: `segment-${source.id}-1`,
          sourceId: source.id,
          segmentStart: 0,
          segmentEnd: source.duration,
          timelineStart: startTime,
          timelineEnd: startTime + source.duration,
          duration: source.duration
        };
        
        // Add the segment directly to the timeline
        dispatch({
          type: 'ADD_SEGMENT_TO_TIMELINE',
          payload: { segment: newSegment }
        });
        
        console.log('Added additional track to timeline:', {
          trackName: source.name,
          segmentId: newSegment.id,
          timelineStart: newSegment.timelineStart,
          timelineEnd: newSegment.timelineEnd
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
          <div className="timeline-section">
            <div className="timeline-header">
              <h3>Timeline Segments</h3>
              <div className="timeline-controls">
                <div className="add-track-button">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    id="audio-upload"
                  />
                  <label htmlFor="audio-upload" className="add-track-label">
                    <span className="upload-icon"><Upload size={18} /></span>
                    <span className="upload-text">Add Track</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="segments-container">
              {state.timeline.segments.map((segment, index) => {
                const source = state.sources[segment.sourceId];
                return (
                  <div key={segment.id} className="segment">
                    <strong>#{index + 1} {source ? removeFileExtension(source.name) : 'Unknown Track'}</strong>
                  </div>
                );
              })}
            </div>
            
            {state.timeline.segments.length === 0 && (
              <div className="no-segments">
                No segments yet. Upload audio files to see timeline segments.
              </div>
            )}

            {state.timeline.segments.length > 0 && (
              <div className="playback-controls">
                <div className="transport-controls">
                  <button 
                    onClick={handlePlayPause}
                    className="control-button play-pause"
                    title={state.timeline.isPlaying ? "Pause" : "Play"}
                  >
                    {state.timeline.isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  
                  <button 
                    onClick={handleStop}
                    className="control-button stop"
                    title="Stop"
                  >
                    <Square size={16} />
                  </button>
                  
                  <div className="time-display">
                    <span className="current-time">{formatTime(state.timeline.currentTime)}</span>
                    <span className="time-separator">/</span>
                    <span className="total-time">{formatTime(state.timeline.duration)}</span>
                  </div>
                </div>

                <div className="seek-control waveform">
                  <Waveform
                    currentTime={state.timeline.currentTime}
                    duration={state.timeline.duration}
                    onSeek={handleSeek}
                    segments={state.timeline.segments}
                    height={80}
                    className="timeline-waveform"
                  />
                </div>

                <div className="bottom-controls">
                  <div className="volume-control">
                    <button 
                      onClick={handleMuteToggle}
                      className="control-button mute"
                      title={state.timeline.isMuted ? "Unmute" : "Mute"}
                    >
                      {state.timeline.isMuted ? <VolumeX size={16} /> : state.timeline.volume > 0.5 ? <Volume2 size={16} /> : <Volume1 size={16} />}
                    </button>
                    
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={state.timeline.isMuted ? 0 : state.timeline.volume}
                      className="volume-slider"
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      title="Volume"
                    />
                    
                    <span className="volume-display">
                      {Math.round((state.timeline.isMuted ? 0 : state.timeline.volume) * 100)}%
                    </span>
                  </div>

                  <div className="playback-rate-control">
                    <label htmlFor="playback-rate">Speed:</label>
                    <select 
                      id="playback-rate"
                      value={state.timeline.playbackRate}
                      onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                      className="rate-select"
                      title="Playback speed"
                    >
                      <option value="0.25">0.25x</option>
                      <option value="0.5">0.5x</option>
                      <option value="0.75">0.75x</option>
                      <option value="1.0">1.0x</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2.0">2.0x</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="details-and-transition">
            {state.timeline.segments.length > 0 && (
              <div className="timeline-details">
                <h3><ListMusic size={18} className="inline-icon" /> Segment Details</h3>
                {state.timeline.segments.map((segment, index) => {
                  const source = state.sources[segment.sourceId];
                  return (
                    <div key={`details-${segment.id}`} className="segment-detail-card">
                      <div className="detail-content-inline">
                        <strong>#{index + 1} {source ? removeFileExtension(source.name) : 'Unknown Track'}</strong>
                        <span className="detail-separator">•</span>
                        <span className="detail-text">
                          Source: {formatTime(segment.segmentStart)} - {formatTime(segment.segmentEnd)}
                        </span>
                        <span className="detail-separator">•</span>
                        <span className="detail-text">
                          Duration: {formatTime(segment.duration)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {state.currentTrack && state.nextTrack && (
              <div className="transition-section">
                <h3><RotateCcw size={18} className="inline-icon" /> Transition Settings</h3>
                <div className="transition-options">
                  <div className="transition-group">
                    <h4>Custom Transition</h4>
                    <div className="custom-transition">
                      <input
                        type="range"
                        min="0"
                        max={state.currentTrack ? state.sources[state.currentTrack]?.duration : 100000}
                        step="1000"
                        value={pendingTransitionPoint}
                        className="transition-slider"
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          setPendingTransitionPoint(value);
                        }}
                      />
                      <div className="slider-labels">
                        <span>0:00</span>
                        <span>
                          {state.currentTrack ? formatTime(state.sources[state.currentTrack]?.duration || 0) : '0:00'}
                        </span>
                      </div>
                      <div className="transition-controls">
                        <div className="current-time">
                          Transition at: <strong>{formatTime(pendingTransitionPoint)}</strong>
                        </div>
                        <button 
                          onClick={handleSetTransition}
                          className="set-transition-button"
                        >
                          <RotateCcw size={16} className="inline-icon" /> Set Transition
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
              <span>{state.timeline.segments.length}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
