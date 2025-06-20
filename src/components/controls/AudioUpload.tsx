import { useCallback, useRef } from 'react';
import { useAudio } from '../../core/AudioContext';
import { v4 as uuidv4 } from 'uuid';

export function AudioUpload() {
    const { state, dispatch, audioEngine } = useAudio();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileLoad = useCallback(async (file: File, setAsCurrent: boolean) => {
        try {
            // Create object URL for the file
            const url = URL.createObjectURL(file);
            
            // Resume the audio context first (needed for Safari and Chrome's autoplay policy)
            await audioEngine.resume();
            
            // Load the audio file into the audio engine
            const buffer = await audioEngine.loadAudio(url);
            
            // Create a new audio source
            const source = {
                id: uuidv4(),
                url,
                name: file.name,
                duration: buffer.duration * 1000, // Convert to ms
                buffer
            };

            // Add source to state
            dispatch({ 
                type: 'LOAD_SOURCE', 
                payload: source 
            });

            // Set as current or next track
            if (setAsCurrent || !state.currentTrackId) {
                dispatch({
                    type: 'SET_CURRENT_TRACK',
                    payload: { trackId: source.id }
                });
            } else {
                dispatch({
                    type: 'SET_NEXT_TRACK',
                    payload: { trackId: source.id }
                });
            }

        } catch (error) {
            console.error('Error loading audio file:', error);
            alert('Error loading audio file');
        }
    }, [audioEngine, dispatch, state.currentTrackId]);

    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // If this is the first track or no current track, set as current
        const setAsCurrent = !state.currentTrackId;
        await handleFileLoad(file, setAsCurrent);

        // Reset file input so the same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [handleFileLoad, state.currentTrackId]);

    const handleCurrentTrack = useCallback(async () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, []);

    const handleNextTrack = useCallback(async () => {
        const file = await new Promise<File | null>((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'audio/*';
            input.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                resolve(target.files?.[0] || null);
            };
            input.click();
        });

        if (file) {
            await handleFileLoad(file, false);
        }
    }, [handleFileLoad]);

    return (
        <div className="audio-upload">
            <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                id="audio-upload"
                className="hidden"
            />
            <div className="upload-buttons">
                <button 
                    onClick={handleCurrentTrack}
                    className="upload-button"
                >
                    Upload As Current Track
                </button>
                {state.currentTrackId && (
                    <button 
                        onClick={handleNextTrack}
                        className="upload-button next"
                    >
                        Upload As Next Track
                    </button>
                )}
            </div>
            {state.nextTrackId && (
                <div className="next-track-info">
                    <span>Next Track: </span>
                    <span>{state.sources[state.nextTrackId]?.name}</span>
                </div>
            )}
        </div>
    );
}
