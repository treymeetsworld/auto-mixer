import { useAudio } from '../../core/AudioContext';
import type { AudioSource } from '../../types';

export function Timeline() {
    const { state } = useAudio();
    const sources = Object.values(state.sources);

    if (sources.length === 0) {
        return (
            <div className="timeline empty">
                <p>Upload an audio file to get started</p>
            </div>
        );
    }

    return (
        <div className="timeline">
            {sources.map((source: AudioSource) => (
                <div key={source.id} className="timeline-source">
                    <div className="source-info">
                        <span className="source-name">{source.name}</span>
                        <span className="source-duration">
                            {(source.duration / 1000).toFixed(2)}s
                        </span>
                    </div>
                    <div className="source-waveform">
                        {/* Placeholder for waveform visualization */}
                        <div className="waveform-placeholder" />
                    </div>
                </div>
            ))}
        </div>
    );
}
