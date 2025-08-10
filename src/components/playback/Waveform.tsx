import { useState, useRef, useEffect } from 'react';
import type { Segment, AudioSource } from '../../types';

interface WaveformProps {
  audioBuffer?: AudioBuffer; // unused now; using sources per segment
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
  height?: number;
  segments?: Segment[];
  sources: Record<string, AudioSource>;
}

export const Waveform: React.FC<WaveformProps> = ({
  currentTime,
  duration,
  onSeek,
  className = '',
  height = 80,
  segments = [],
  sources
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
    
  // Clear canvas using transparent background; container handles theming
  ctx.clearRect(0, 0, width, canvasHeight);

  if (duration === 0 || segments.length === 0) return;

    // Enhanced color palette
    const colorSchemes = [
      { primary: '#3b82f6', accent: '#60a5fa' },
      { primary: '#10b981', accent: '#34d399' },
      { primary: '#f59e0b', accent: '#fbbf24' },
      { primary: '#ef4444', accent: '#f87171' },
      { primary: '#8b5cf6', accent: '#a78bfa' },
    ];

    // Draw segments sequentially without overlaps, using real waveform data when available
    let timelinePosition = 0; // Track timeline position as we draw segments
    
    segments.forEach((segment, index) => {
      const segmentWidth = (segment.segmentDuration / duration) * width;
      if (segmentWidth < 1) return; // Skip tiny segments

      const scheme = colorSchemes[index % colorSchemes.length];
      const buffer = sources[segment.sourceId]?.buffer;

      // Visual area
      const segX = timelinePosition;
      const segY = canvasHeight * 0.1;
      const segH = canvasHeight * 0.8;
      const midY = segY + segH / 2;

      if (buffer && buffer.numberOfChannels > 0) {
        const sampleRate = buffer.sampleRate;
        const startSample = Math.max(0, Math.floor((segment.segmentStart / 1000) * sampleRate));
        const endSample = Math.min(buffer.length, Math.floor((segment.segmentEnd / 1000) * sampleRate));
        const samplesInSegment = Math.max(1, endSample - startSample);
        const samplesPerPixel = samplesInSegment / Math.max(1, Math.floor(segmentWidth));
        const channelData = buffer.getChannelData(0);

        ctx.fillStyle = scheme.primary;
        // Draw vertical bars per pixel using min/max within the window
        for (let x = 0; x < segmentWidth; x++) {
          const windowStart = Math.floor(startSample + x * samplesPerPixel);
          const windowEnd = Math.min(endSample, Math.floor(startSample + (x + 1) * samplesPerPixel));
          let min = 1.0;
          let max = -1.0;
          for (let i = windowStart; i < windowEnd; i += 1) {
            const v = channelData[i] || 0;
            if (v < min) min = v;
            if (v > max) max = v;
          }
          // Convert to pixel coordinates
          const yTop = midY - (max * (segH / 2));
          const yBot = midY - (min * (segH / 2));
          const barH = Math.max(1, yBot - yTop);
          ctx.fillRect(segX + x, yTop, 1, barH);
        }
      } else {
        // Fallback: draw a simple gradient block
        const segmentGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        segmentGradient.addColorStop(0, scheme.accent + '40');
        segmentGradient.addColorStop(0.5, scheme.primary + '80');
        segmentGradient.addColorStop(1, scheme.accent + '40');
        ctx.fillStyle = segmentGradient;
        ctx.fillRect(segX, segY, segmentWidth, segH);
      }

      // Optional: segment separator
      if (index > 0) {
        ctx.strokeStyle = scheme.accent;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(segX, segY);
        ctx.lineTo(segX, segY + segH);
        ctx.stroke();
      }

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

  }, [currentTime, duration, segments, height, sources]);

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
  style={{ cursor: isInteracting ? 'grabbing' : 'pointer' }}
      />
    </div>
  );
};
