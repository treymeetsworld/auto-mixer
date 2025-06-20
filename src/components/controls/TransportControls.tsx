import { useCallback } from 'react';
import { useAudio } from '../../core/AudioContext';

export function TransportControls() {
    const { state, dispatch, audioEngine } = useAudio();
    const { timeline } = state;

    const handlePlayPause = useCallback(async () => {
        if (timeline.isPlaying) {
            audioEngine.stopAll();
            dispatch({ type: 'SET_PLAYBACK', payload: { isPlaying: false } });
        } else {
            await audioEngine.resume();
            
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
                        segment.duration
                    );
                }
            });

            dispatch({ type: 'SET_PLAYBACK', payload: { isPlaying: true } });
        }
    }, [timeline.isPlaying, audioEngine, dispatch, state.sources, timeline.segments]);

    return (
        <div className="transport-controls">
            <button 
                onClick={handlePlayPause}
                className="transport-button"
            >
                {timeline.isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
                onClick={() => audioEngine.stopAll()}
                className="transport-button"
            >
                Stop
            </button>
        </div>
    );
}
