import { useEffect, useRef } from 'react';
import { useAudio } from '../../core/AudioContext';
import type { AudioSource } from '../../types';

function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function Timeline() {
    const { state, dispatch, audioEngine } = useAudio();
    const sources = Object.values(state.sources);
    const animationRef = useRef<number>();

    useEffect(() => {
        if (state.timeline.isPlaying) {
            const updateTime = () => {
                const currentTime = audioEngine.getCurrentPosition();
                dispatch({ 
                    type: 'SET_CURRENT_TIME', 
                    payload: { time: currentTime } 
                });
                animationRef.current = requestAnimationFrame(updateTime);
            };
            animationRef.current = requestAnimationFrame(updateTime);
        } else if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [state.timeline.isPlaying, dispatch, audioEngine]);

    if (sources.length === 0) {
        return (
            <div className="timeline empty">
                <p>Upload an audio file to get started</p>
            </div>
        );
    }

    return (
        <div className="timeline">
            <div className="timeline-header">
                <div className="timeline-time">
                    {formatTime(state.timeline.currentTime)}
                </div>
            </div>
            {sources.map((source: AudioSource) => (
                <div key={source.id} className="timeline-source">
                    <div className="source-info">
                        <span className="source-name">{source.name}</span>
                        <span className="source-duration">
                            {formatTime(source.duration)}
                        </span>
                    </div>
                    <div className="source-waveform">
                        <div className="waveform-placeholder" />
                        {state.timeline.isPlaying && (
                            <div 
                                className="playhead"
                                style={{ 
                                    left: `${(state.timeline.currentTime / source.duration) * 100}%` 
                                }}
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
