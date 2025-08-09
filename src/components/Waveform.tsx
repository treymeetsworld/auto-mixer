import { useState, useRef, useEffect } from 'react';

interface WaveformProps {
  audioBuffer?: AudioBuffer;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
  height?: number;
  segments?: Array<{
    id: string;
    timelineStart: number;
    timelineEnd: number;
    segmentStart: number;
    segmentEnd: number;
    sourceId: string;
  }>;
}

export const Waveform: React.FC<WaveformProps> = ({
  currentTime,
  duration,
  onSeek,
  className = '',
  height = 80,
  segments = []
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  // Simple drawing based on segment durations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Make canvas responsive
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = height;
    }

    const { width, height: canvasHeight } = canvas;
    
    // Clear canvas with gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    bgGradient.addColorStop(0, '#1a1a1a');
    bgGradient.addColorStop(1, '#0f0f0f');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, canvasHeight);

    if (duration === 0 || segments.length === 0) return;

    // Enhanced color palette
    const colorSchemes = [
      { primary: '#3b82f6', accent: '#60a5fa' },
      { primary: '#10b981', accent: '#34d399' },
      { primary: '#f59e0b', accent: '#fbbf24' },
      { primary: '#ef4444', accent: '#f87171' },
      { primary: '#8b5cf6', accent: '#a78bfa' },
    ];

    // Draw segments sequentially without overlaps
    let currentX = 0;
    
    segments.forEach((segment, index) => {
      // Calculate segment width based on its duration relative to total duration
      const segmentDuration = segment.timelineEnd - segment.timelineStart;
      const segmentWidth = (segmentDuration / duration) * width;

      if (segmentWidth < 1) return; // Skip tiny segments

      const scheme = colorSchemes[index % colorSchemes.length];
      
      // Create gradient for the segment
      const segmentGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      segmentGradient.addColorStop(0, scheme.accent + '40');
      segmentGradient.addColorStop(0.5, scheme.primary + '80');
      segmentGradient.addColorStop(1, scheme.accent + '40');
      
      ctx.fillStyle = segmentGradient;
      ctx.fillRect(currentX, canvasHeight * 0.2, segmentWidth, canvasHeight * 0.6);

      // Draw segment border
      ctx.strokeStyle = scheme.primary;
      ctx.lineWidth = 2;
      ctx.strokeRect(currentX, canvasHeight * 0.2, segmentWidth, canvasHeight * 0.6);

      // Draw segment separator
      if (index > 0) {
        ctx.strokeStyle = scheme.primary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(currentX, 0);
        ctx.lineTo(currentX, canvasHeight);
        ctx.stroke();
      }

      // Add segment label for debugging
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '12px monospace';
      ctx.fillText(`S${index + 1}`, currentX + 5, 20);

      // Move to next position
      currentX += segmentWidth;
    });

    // Draw progress indicator based on current time
    let progressX = 0;
    let accumulatedTime = 0;
    
    // Find which segment we're currently in and calculate progress position
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const segmentDuration = segment.timelineEnd - segment.timelineStart;
      const segmentWidth = (segmentDuration / duration) * width;
      
      if (currentTime >= segment.timelineStart && currentTime < segment.timelineEnd) {
        // We're in this segment
        const segmentProgress = (currentTime - segment.timelineStart) / segmentDuration;
        progressX = accumulatedTime + (segmentProgress * segmentWidth);
        break;
      } else if (currentTime >= segment.timelineEnd) {
        // We've passed this segment
        accumulatedTime += segmentWidth;
        progressX = accumulatedTime;
      }
    }
    
    // Draw progress line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(progressX, 0);
    ctx.lineTo(progressX, canvasHeight);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Progress fill
    const progressGradient = ctx.createLinearGradient(0, 0, progressX, 0);
    progressGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    progressGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    ctx.fillStyle = progressGradient;
    ctx.fillRect(0, 0, progressX, canvasHeight);

  }, [currentTime, duration, segments, height]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Trigger redraw on resize
      const canvas = canvasRef.current;
      if (canvas) {
        const event = new Event('resize');
        window.dispatchEvent(event);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [height]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = clickX / rect.width;
    
    // Convert click position back to timeline time
    let accumulatedWidth = 0;
    let targetTime = 0;
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const segmentDuration = segment.timelineEnd - segment.timelineStart;
      const segmentWidth = (segmentDuration / duration) * rect.width;
      
      if (clickX >= accumulatedWidth && clickX < accumulatedWidth + segmentWidth) {
        // Click is in this segment
        const segmentClickRatio = (clickX - accumulatedWidth) / segmentWidth;
        targetTime = segment.timelineStart + (segmentClickRatio * segmentDuration);
        break;
      }
      
      accumulatedWidth += segmentWidth;
    }
    
    // Fallback to proportional time if click is beyond all segments
    if (targetTime === 0 && segments.length > 0) {
      targetTime = clickRatio * duration;
    }
    
    onSeek(targetTime);
  };

  const handleMouseDown = () => {
    setIsInteracting(true);
  };

  const handleMouseUp = () => {
    setIsInteracting(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isInteracting) return;
    handleClick(e);
  };

  return (
    <div className={`waveform-container ${className}`}>
      <canvas
        ref={canvasRef}
        className="waveform-canvas"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
        style={{ 
          cursor: isInteracting ? 'grabbing' : 'pointer',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)'
        }}
      />
    </div>
  );
};
