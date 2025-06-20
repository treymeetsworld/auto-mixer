import { AudioProvider } from './core/AudioContext';
import { AudioUpload } from './components/controls/AudioUpload';
import { Timeline } from './components/timeline/Timeline';
import { TransportControls } from './components/controls/TransportControls';
import { VolumeControls } from './components/controls/VolumeControls';

function App() {
  return (
    <AudioProvider>
      <div className="app">
        <h1>Auto-Mixer</h1>
        <div className="content">
          <AudioUpload />
          <div className="controls-section">
            <TransportControls />
            <VolumeControls />
          </div>
          <Timeline />
        </div>
      </div>
    </AudioProvider>
  )
}

export default App
