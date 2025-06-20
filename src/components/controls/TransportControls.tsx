import { useCallback } from 'react';
import { useAudio } from '../../core/AudioContext';
import type { Segment } from '../../types';

export function TransportControls() {
    const { state, dispatch, audioEngine } = useAudio();
    const { timeline } = state;

    const handleStop = useCallback(() => {
        audioEngine.stopAll();
        audioEngine.resetPosition();
        dispatch({ type: 'SET_PLAYBACK', payload: { isPlaying: false } });
        dispatch({ type: 'SET_CURRENT_TIME', payload: { time: 0 } });
    }, [audioEngine, dispatch]);

    const handlePlayPause = useCallback(async () => {
        if (timeline.isPlaying) {
            // Just pause the playback
            audioEngine.pause();
            dispatch({ type: 'SET_PLAYBACK', payload: { isPlaying: false } });
        } else {
            await audioEngine.resume();
            
            // Find the first source and play it if there are no segments yet
            if (timeline.segments.length === 0) {
                const firstSource = Object.values(state.sources)[0];
                if (firstSource?.buffer) {
                    // Create a segment for the entire source
                    const newSegment: Segment = {
                        id: firstSource.id,
                        sourceId: firstSource.id,
                        startTime: 0,
                        duration: firstSource.duration,
                        sourceOffset: 0,
                        volume: 1,
                        muted: false
                    };
                    
                    dispatch({ type: 'ADD_SEGMENT', payload: newSegment });
                    
                    audioEngine.playSegment(
                        newSegment.id,
                        firstSource.buffer,
                        newSegment.sourceOffset,
                        newSegment.duration,
                        false // Not resuming from pause
                    );
                }
            } else {
                // Play all active segments
                const activeSegments = timeline.segments.filter(segment => {
                    const source = state.sources[segment.sourceId];
                    return source && source.buffer;
                });

                activeSegments.forEach(segment => {
                    const source = state.sources[segment.sourceId];
                    if (source && source.buffer) {
                        audioEngine.playSegment(
                            segment.id,
                            source.buffer,
                            segment.sourceOffset,
                            segment.duration,
                            true // Resume from pause
                        );
                    }
                });
            }

            dispatch({ type: 'SET_PLAYBACK', payload: { isPlaying: true } });
        }
    }, [timeline.isPlaying, timeline.segments, audioEngine, dispatch, state.sources]);

    return (
        <div className="transport-controls">
            <button 
                onClick={handlePlayPause}
                className="transport-button"
                disabled={Object.keys(state.sources).length === 0}
            >
                {timeline.isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
                onClick={handleStop}
                className="transport-button"
                disabled={Object.keys(state.sources).length === 0 || !timeline.isPlaying}
            >
                Stop
            </button>
        </div>
    );
}
