import { useState, useRef, useEffect } from 'react';
import type { Segment } from '../../types';

interface WaveformProps {
  audioBuffer?: AudioBuffer;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
  height?: number;
  segments?: Segment[];
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

    // Make canvas responsive with device pixel ratio scaling for crispness and proportion
    const container = canvas.parentElement;
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    const cssWidth = container ? container.clientWidth : canvas.clientWidth || 0;
    const cssHeight = height;
    // Set internal bitmap size scaled by DPR
    canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
    canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
    // Ensure CSS size matches desired size
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    // Scale context so drawing uses CSS pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Use CSS-pixel-based drawing dimensions
    const width = cssWidth;
    const canvasHeight = cssHeight;
    
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
    let timelinePosition = 0; // Track timeline position as we draw segments
    
    segments.forEach((segment, index) => {
      // In new architecture, segments are sequential with no timeline info
      // Each segment's duration determines its visual width
      const segmentWidth = (segment.segmentDuration / duration) * width;

      if (segmentWidth < 1) return; // Skip tiny segments

      const scheme = colorSchemes[index % colorSchemes.length];
      
      // Create gradient for the segment
      const segmentGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      segmentGradient.addColorStop(0, scheme.accent + '40');
      segmentGradient.addColorStop(0.5, scheme.primary + '80');
      segmentGradient.addColorStop(1, scheme.accent + '40');
      
  ctx.fillStyle = segmentGradient;
  // Increase inner fill to 80% height with 10% top padding for better proportion
  const segY = canvasHeight * 0.1;
  const segH = canvasHeight * 0.8;
  ctx.fillRect(timelinePosition, segY, segmentWidth, segH);

  // Draw segment border
      ctx.strokeStyle = scheme.primary;
      ctx.lineWidth = 2;
  ctx.strokeRect(timelinePosition, segY, segmentWidth, segH);

      // Draw segment separator
      if (index > 0) {
        ctx.strokeStyle = scheme.primary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(timelinePosition, 0);
        ctx.lineTo(timelinePosition, canvasHeight);
        ctx.stroke();
      }

      // Add segment label for debugging
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '12px monospace';
      ctx.fillText(`S${index + 1}`, timelinePosition + 5, 20);

      // Move to next timeline position
      timelinePosition += segmentWidth;
    });

    // Draw progress indicator - simple proportional to timeline
  const progressX = (currentTime / duration) * width;
    
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
    
    // Find which segment was clicked and calculate timeline position
    let cumulativeTimelineTime = 0; // Cumulative timeline time (not visual position)
    let cumulativeVisualWidth = 0; // Cumulative visual width
    let targetTime = 0;
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const segmentWidth = (segment.segmentDuration / duration) * rect.width;
      
      if (clickX >= cumulativeVisualWidth && clickX < cumulativeVisualWidth + segmentWidth) {
        // Click is in this segment
        const segmentClickRatio = (clickX - cumulativeVisualWidth) / segmentWidth;
        targetTime = cumulativeTimelineTime + (segmentClickRatio * segment.segmentDuration);
        break;
      }
      
      cumulativeTimelineTime += segment.segmentDuration;
      cumulativeVisualWidth += segmentWidth;
    }
    
    // If click is beyond all segments, seek to total timeline duration
    if (targetTime === 0 && segments.length > 0) {
      targetTime = duration;
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
