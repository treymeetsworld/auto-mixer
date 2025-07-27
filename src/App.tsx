import { useAudio } from './core/AudioContext';

function App() {
  const { state, dispatch, audioEngine } = useAudio();

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
    if (state.currentTrack && state.nextTrack) {
      // For demo, set transition at 10 seconds (10000ms)
      dispatch({ 
        type: 'SET_TRANSITION', 
        payload: { transitionPoint: 10000 } 
      });
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app">
      <h1>Auto Mixer</h1>
      
      <div className="content">
        <div className="timeline-preview">
          <h3>Timeline Segments</h3>
          {state.timeline.segments.length > 0 ? (
            state.timeline.segments.map(segment => {
              const source = state.sources[segment.sourceId];
              return (
                <div key={segment.id} className="segment">
                  <strong>🎵 {source?.name}</strong>
                  <div className="segment-details">
                    <div className="detail-item">
                      <div className="label">Track Range:</div>
                      <div>{formatTime(segment.segmentStart)} - {formatTime(segment.segmentEnd)}</div>
                    </div>
                    <div className="detail-item">
                      <div className="label">Timeline Position:</div>
                      <div>{formatTime(segment.timelineStart)}</div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-segments">
              No segments yet. Upload audio files to see timeline segments.
            </div>
          )}
        </div>

        <div className="upload-section">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            id="audio-upload"
          />
          <label htmlFor="audio-upload" className="upload-button">
            📁 Upload Audio File
          </label>
          <p style={{ marginTop: '16px', color: '#666' }}>
            {!state.currentTrack ? 'Upload your first track to get started' : 
             !state.nextTrack ? 'Upload a second track to create transitions' :
             'Ready to set transitions!'}
          </p>
        </div>

        <div className="status">
          <h3>📊 Timeline Status</h3>
          <p>
            <strong>Current Track:</strong> 
            <span>{state.currentTrack ? state.sources[state.currentTrack]?.name : 'None'}</span>
          </p>
          <p>
            <strong>Next Track:</strong> 
            <span>{state.nextTrack ? state.sources[state.nextTrack]?.name : 'None'}</span>
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

        {state.currentTrack && state.nextTrack && (
          <button onClick={handleSetTransition} className="transition-button">
            ⚡ Set Transition at 10s
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
