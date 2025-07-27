import { useState } from 'react';
import { useAudio } from './core/AudioContext';

function App() {
  const { state, dispatch, audioEngine } = useAudio();
  const [pendingTransitionPoint, setPendingTransitionPoint] = useState(0);

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
          <div className="timeline-preview">
            <div className="timeline-header">
              <h3>Timeline Segments</h3>
              <div className="add-track-button">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  id="audio-upload"
                />
                <label htmlFor="audio-upload" className="add-track-label">
                  <span className="upload-icon">📁</span>
                  <span className="upload-text">Add Track</span>
                </label>
              </div>
            </div>
            
            <div className="segments-container">
              {state.timeline.segments.map(segment => {
                const source = state.sources[segment.sourceId];
                return (
                  <div key={segment.id} className="segment">
                    <strong>🎵 {source ? removeFileExtension(source.name) : 'Unknown Track'}</strong>
                  </div>
                );
              })}
            </div>
            
            {state.timeline.segments.length === 0 && (
              <div className="no-segments">
                No segments yet. Upload audio files to see timeline segments.
              </div>
            )}
          </div>

          {state.timeline.segments.length > 0 && (
            <div className="timeline-details">
              <h3>📋 Segment Details</h3>
              {state.timeline.segments.map(segment => {
                const source = state.sources[segment.sourceId];
                return (
                  <div key={`details-${segment.id}`} className="segment-detail-card">
                    <div className="detail-content-inline">
                      <strong>{source ? removeFileExtension(source.name) : 'Unknown Track'}</strong>
                      <span className="detail-separator">•</span>
                      <span className="detail-text">
                        Track: {formatTime(segment.segmentStart)} - {formatTime(segment.segmentEnd)}
                      </span>
                      <span className="detail-separator">•</span>
                      <span className="detail-text">
                        Timeline: {formatTime(segment.timelineStart)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {state.currentTrack && state.nextTrack && (
            <div className="transition-section">
              <h3>⚡ Transition Settings</h3>
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
                        ⚡ Set Transition
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar">
          <div className="status">
            <h3>📊 Timeline Status</h3>
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
