import { createContext, useContext, useRef, useReducer, ReactNode } from 'react';
import type { AppState, ActionType } from '../types';
import { AudioEngine } from '../core/audio/AudioEngine';
import { createInitialState, reducer } from '../core/state/reducer';

interface AudioContextValue {
    state: AppState;
    dispatch: React.Dispatch<ActionType>;
    audioEngine: AudioEngine;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, createInitialState());
    const audioEngineRef = useRef<AudioEngine | null>(null);

    if (!audioEngineRef.current) {
        audioEngineRef.current = new AudioEngine();
    }

    return (
        <AudioContext.Provider 
            value={{ 
                state, 
                dispatch, 
                audioEngine: audioEngineRef.current 
            }}
        >
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
}
