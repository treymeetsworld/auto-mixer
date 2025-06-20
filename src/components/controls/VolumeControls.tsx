import { useCallback } from 'react';
import { useAudio } from '../../core/AudioContext';

export function VolumeControls() {
    const { state, dispatch, audioEngine } = useAudio();
    const { volume = 1, muted = false } = state.timeline;

    const handleVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(event.target.value);
        audioEngine.setVolume(muted ? 0 : newVolume);
        dispatch({ 
            type: 'SET_VOLUME', 
            payload: { volume: newVolume } 
        });
    }, [audioEngine, dispatch, muted]);

    const handleMute = useCallback(() => {
        const newMuted = !muted;
        audioEngine.setVolume(newMuted ? 0 : volume);
        dispatch({ 
            type: 'SET_MUTED', 
            payload: { muted: newMuted } 
        });
    }, [audioEngine, dispatch, muted, volume]);

    return (
        <div className="volume-controls">
            <button 
                onClick={handleMute}
                className="volume-button"
                title={muted ? 'Unmute' : 'Mute'}
            >
                {muted ? '🔇' : volume > 0.5 ? '🔊' : volume > 0 ? '🔉' : '🔈'}
            </button>
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
                title={`Volume: ${Math.round(volume * 100)}%`}
            />
        </div>
    );
}
