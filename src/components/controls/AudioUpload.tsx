import { useCallback } from 'react';
import { useAudio } from '../../core/AudioContext';
import { v4 as uuidv4 } from 'uuid';

export function AudioUpload() {
    const { dispatch, audioEngine } = useAudio();

    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

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

        } catch (error) {
            console.error('Error loading audio file:', error);
            alert('Error loading audio file');
        }
    }, [audioEngine, dispatch]);

    return (
        <div className="audio-upload">
            <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                id="audio-upload"
            />
            <label htmlFor="audio-upload" className="upload-button">
                Upload Audio File
            </label>
        </div>
    );
}
