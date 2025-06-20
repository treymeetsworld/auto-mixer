import type { MasterTimeline } from '../types';
import './MasterTimelineControls.scss';

interface MasterTimelineControlsProps {
  timeline: MasterTimeline;
  currentMasterTime: number;
  isPlaying: boolean;
  onSeek: (masterTime: number) => void;
  onPlay: () => void;
  onPause: () => void;
}

export default function MasterTimelineControls({ 
  timeline, 
  currentMasterTime, 
  isPlaying,
  onSeek,
  onPlay,
  onPause 
}: MasterTimelineControlsProps) {
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newMasterTime = (clickX / rect.width) * timeline.totalDuration;
    onSeek(newMasterTime);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = timeline.totalDuration > 0 ? (currentMasterTime / timeline.totalDuration) * 100 : 0;

  return (
    <div className="master-timeline-controls">
      {/* Master Timeline */}
      <div className="timeline-container" onClick={handleTimelineClick}>
        {/* Progress bar */}
        <div className="timeline-progress">
          <div 
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Timeline segments */}
        <div className="timeline-segments">
          {timeline.segments.map((segment, index) => {
            const segmentStartPercent = (segment.startTime / timeline.totalDuration) * 100;
            const segmentWidthPercent = ((segment.endTime - segment.startTime) / timeline.totalDuration) * 100;
            
            return (
              <div
                key={`${segment.trackId}-${index}`}
                className={`timeline-segment ${segment.isTransition ? 'transition' : ''}`}
                style={{
                  left: `${segmentStartPercent}%`,
                  width: `${segmentWidthPercent}%`
                }}
              >
                <div className="segment-info">
                  <span className="track-title">{segment.track.title}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Transition markers */}
        <div className="transition-markers">
          {timeline.transitions.map((transition, index) => {
            const markerPercent = (transition.masterTime / timeline.totalDuration) * 100;
            
            return (
              <div
                key={index}
                className="transition-marker"
                style={{ left: `${markerPercent}%` }}
                title={`Transition at ${formatTime(transition.masterTime)}`}
              >
                <div className="marker-line" />
              </div>
            );
          })}
        </div>

        {/* Current time indicator */}
        <div 
          className="current-time-indicator"
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      {/* Master Controls */}
      <div className="master-controls">
        <button 
          className="master-play-button"
          onClick={handlePlayPause}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <div className="master-time-info">
          <span className="current-time">{formatTime(currentMasterTime)}</span>
          <span className="separator">/</span>
          <span className="total-time">{formatTime(timeline.totalDuration)}</span>
        </div>
      </div>
    </div>
  );
}
