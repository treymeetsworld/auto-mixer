import { useState, useEffect, useRef } from 'react';
import { useAudio } from './core/AudioContext';
import { TimelineSection, SegmentDetails } from './components/timeline';
import { TransitionSettings } from './components/transition';
import { TrendingUp } from 'lucide-react';

function App() {
  const { state, dispatch, audioEngine } = useAudio();
  const [pendingTransitionPoint, setPendingTransitionPoint] = useState(0);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
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

  const handleRemoveSegment = (segmentId: string) => {
    dispatch({ type: 'REMOVE_SEGMENT', payload: { segmentId } });
  };

  

  // Allow selecting a File programmatically (from folder view)
  const handleSelectFile = async (file: File) => {
    try {
      const url = URL.createObjectURL(file);
      await audioEngine.resume();
      const buffer = await audioEngine.loadAudio(url);
      const source = {
        id: `source-${Date.now()}`,
        url,
        name: file.name,
        duration: buffer.duration * 1000,
        buffer
      };
      dispatch({ type: 'LOAD_SOURCE', payload: source });
      if (!state.currentTrack) {
        dispatch({ type: 'SELECT_FIRST_TRACK', payload: { sourceId: source.id } });
      } else if (!state.nextTrack) {
        dispatch({ type: 'SELECT_NEXT_TRACK', payload: { sourceId: source.id } });
      } else {
        dispatch({ type: 'ADD_TRACK_WITH_TRANSITION', payload: { sourceId: source.id, transitionPoint: state.timeline.duration } });
      }
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };

  const handleSetTransition = (nextStartOffset?: number) => {
    if (state.currentTrack && state.nextTrack && pendingTransitionPoint !== undefined) {
      dispatch({ 
        type: 'SET_TRANSITION', 
        payload: { transitionPoint: pendingTransitionPoint, nextStartOffset } 
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

  // Derive current and next track names based on timeline position
  const { currentName, nextName } = (() => {
    const { segments, timeline } = state;
    let activeIndex = -1;
    let cumulative = 0;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const start = cumulative;
      const end = cumulative + seg.segmentDuration;
      if (timeline.currentTime >= start && timeline.currentTime < end) {
        activeIndex = i;
        break;
      }
      cumulative = end;
    }
    if (activeIndex === -1 && segments.length > 0) activeIndex = segments.length - 1;
    const currentSeg = segments[activeIndex];
    const nextSeg = activeIndex >= 0 && activeIndex + 1 < segments.length ? segments[activeIndex + 1] : undefined;
  const currentName = currentSeg ? removeFileExtension(state.sources[currentSeg.sourceId]?.name || 'Unknown') : 'None';
  const nextName = nextSeg ? removeFileExtension(state.sources[nextSeg.sourceId]?.name || 'None') : 'None';
    return { currentName, nextName };
  })();

  // Fetch album artwork for the current track name (simple public API)
  useEffect(() => {
    if (!currentName || currentName === 'None') {
      setArtworkUrl(null);
      return;
    }
    const controller = new AbortController();
    // Parse the filename into artist and title to improve search accuracy
    const parseTrack = (name: string) => {
      const stripped = name.replace(/[\(\[\{].*?[\)\]\}]/g, '').trim(); // remove (Clean), [Remix], etc.
      const parts = stripped.split(' - ');
      let artist: string | undefined;
      let title: string | undefined;
      if (parts.length >= 2) {
        artist = parts[0]?.trim();
        title = parts.slice(1).join(' - ').trim();
      } else {
        title = stripped;
      }
      const stripFeat = (s?: string) => s?.replace(/\b(feat\.?|ft\.?|featuring)\b.*$/i, '').trim();
      artist = stripFeat(artist);
      title = stripFeat(title);
      return { artist, title };
    };

    const searchITunes = async (term: string) => {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=musicTrack&limit=1`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return null;
      try { return await res.json(); } catch { return null; }
    };

    (async () => {
      try {
        const { artist, title } = parseTrack(currentName);
        const candidates: string[] = [];
        if (title && artist) candidates.push(`${title} ${artist}`);
        if (title) candidates.push(title);
        if (artist) candidates.push(artist);
        if (candidates.length === 0) candidates.push(currentName);

        let foundUrl: string | null = null;
        for (const q of candidates) {
          const data = await searchITunes(q);
          const raw = data?.results?.[0]?.artworkUrl100 as string | undefined;
          if (raw) { foundUrl = raw.replace('100x100', '200x200'); break; }
        }
        setArtworkUrl(foundUrl);
      } catch {
        // ignore network or parsing errors
      }
    })();
    return () => controller.abort();
  }, [currentName]);

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
            onPlayPause={handlePlayPause}
            onStop={handleStop}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
            onMuteToggle={handleMuteToggle}
            onPlaybackRateChange={handlePlaybackRateChange}
            formatTime={formatTime}
          />

          <div className="details-and-transition">
            <TransitionSettings
              currentTrack={state.currentTrack}
              nextTrack={state.nextTrack}
              sources={state.sources}
              pendingTransitionPoint={pendingTransitionPoint}
              onTransitionPointChange={setPendingTransitionPoint}
              onSetTransition={handleSetTransition}
              onSelectFile={handleSelectFile}
              formatTime={formatTime}
            />

            <SegmentDetails
              segments={state.segments}
              sources={state.sources}
              formatTime={formatTime}
              removeFileExtension={removeFileExtension}
              onRemoveSegment={handleRemoveSegment}
            />
          </div>
        </div>

        <div className="sidebar">
          <div className="status">
            <h3><TrendingUp size={18} className="inline-icon" /> Timeline Status</h3>
            <div className="tracks-overview">
              <div className="track-card current">
                <div className="album-art" aria-label="Current track artwork">
                  {artworkUrl ? (
                    <img src={artworkUrl} alt={`Artwork for ${currentName}`} />
                  ) : (
                    <span>🎵</span>
                  )}
                </div>
                <div className="name">{currentName}</div>
              </div>
            </div>

            <p>
              <strong>Next Track:</strong>
              <span title={nextName}>{nextName}</span>
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
