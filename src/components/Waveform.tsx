import { useState, useRef, useEffect, useCallback } from 'react';

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
  sources?: Record<string, { buffer?: AudioBuffer }>;
}

export const Waveform: React.FC<WaveformProps> = ({
  currentTime,
  duration,
  onSeek,
  className = '',
  height = 80,
  segments = [],
  sources = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [waveformData, setWaveformData] = useState<Record<string, number[]>>({});

  // Enhanced waveform data generation
  const generateWaveformData = useCallback((buffer: AudioBuffer, samples = 2000) => {
    const channelData = buffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / samples);
    const waveform: number[] = [];

    for (let i = 0; i < samples; i++) {
      const start = i * blockSize;
      const end = Math.min(start + blockSize, channelData.length);
      
      let max = 0;
      let rms = 0;
      
      for (let j = start; j < end; j++) {
        const sample = Math.abs(channelData[j]);
        max = Math.max(max, sample);
        rms += sample * sample;
      }
      
      rms = Math.sqrt(rms / (end - start));
      // Combine RMS and peak for better visual representation
      const combined = (rms * 0.7) + (max * 0.3);
      waveform.push(combined);
    }

    return waveform;
  }, []);

  // Generate waveform data for all segments
  useEffect(() => {
    const newWaveformData: Record<string, number[]> = {};
    
    segments.forEach(segment => {
      const source = sources[segment.sourceId];
      if (source?.buffer) {
        const timelineDuration = segment.timelineEnd - segment.timelineStart;
        const samplesForSegment = Math.floor((timelineDuration / duration) * 2000);
        
        if (samplesForSegment > 0) {
          newWaveformData[segment.id] = generateWaveformData(source.buffer, samplesForSegment);
        }
      }
    });
    
    setWaveformData(newWaveformData);
  }, [segments, sources, duration, generateWaveformData]);

  // Enhanced drawing with gradients and better visuals
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Make canvas responsive with high DPI support
    const container = canvas.parentElement;
    if (container) {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = height + 'px';
      
      ctx.scale(dpr, dpr);
    }

    const { width, height: canvasHeight } = { width: canvas.width / (window.devicePixelRatio || 1), height: canvas.height / (window.devicePixelRatio || 1) };
    
    // Clear canvas with gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    bgGradient.addColorStop(0, '#1a1a1a');
    bgGradient.addColorStop(1, '#0f0f0f');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, canvasHeight);

    if (duration === 0) return;

    // Draw segments with enhanced visuals
    segments.forEach((segment, index) => {
      const segmentWaveform = waveformData[segment.id];
      if (!segmentWaveform) return;

      const segmentStartX = (segment.timelineStart / duration) * width;
      const segmentEndX = (segment.timelineEnd / duration) * width;
      const segmentWidth = segmentEndX - segmentStartX;

      // Enhanced color palette with gradients
      const colorSchemes = [
        { primary: '#3b82f6', secondary: '#1d4ed8', accent: '#60a5fa' },
        { primary: '#10b981', secondary: '#047857', accent: '#34d399' },
        { primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24' },
        { primary: '#ef4444', secondary: '#dc2626', accent: '#f87171' },
        { primary: '#8b5cf6', secondary: '#7c3aed', accent: '#a78bfa' },
      ];
      
      const scheme = colorSchemes[index % colorSchemes.length];

      const barWidth = Math.max(1, segmentWidth / segmentWaveform.length);
      
      // Draw mirrored waveform (top and bottom)
      segmentWaveform.forEach((amplitude, i) => {
        const normalizedAmplitude = Math.pow(amplitude, 0.5); // Compress dynamic range
        const barHeight = normalizedAmplitude * (canvasHeight * 0.4);
        const x = segmentStartX + (i * barWidth);
        const centerY = canvasHeight / 2;
        
        // Create per-bar gradient
        const barGradient = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight);
        barGradient.addColorStop(0, scheme.accent + '80');
        barGradient.addColorStop(0.5, scheme.primary + 'CC');
        barGradient.addColorStop(1, scheme.accent + '80');
        
        ctx.fillStyle = barGradient;
        
        // Draw top bar
        ctx.fillRect(x, centerY - barHeight, barWidth * 0.8, barHeight);
        // Draw bottom bar (mirrored)
        ctx.fillRect(x, centerY, barWidth * 0.8, barHeight);
        
        // Add glow effect
        ctx.shadowColor = scheme.primary;
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.fillRect(x, centerY - barHeight, barWidth * 0.8, barHeight * 2);
        
        // Reset shadow
        ctx.shadowBlur = 0;
      });

      // Draw segment separator with glow
      ctx.strokeStyle = scheme.primary;
      ctx.lineWidth = 2;
      ctx.shadowColor = scheme.primary;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(segmentStartX, canvasHeight * 0.1);
      ctx.lineTo(segmentStartX, canvasHeight * 0.9);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Draw enhanced progress indicator
    const progressX = (currentTime / duration) * width;
    
    // Progress line with glow
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(progressX, 0);
    ctx.lineTo(progressX, canvasHeight);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Progress fill with gradient
    const progressGradient = ctx.createLinearGradient(0, 0, progressX, 0);
    progressGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    progressGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    ctx.fillStyle = progressGradient;
    ctx.fillRect(0, 0, progressX, canvasHeight);

    // Add subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    const gridSteps = 10;
    for (let i = 1; i < gridSteps; i++) {
      const x = (i / gridSteps) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }

  }, [waveformData, currentTime, duration, segments, height]);

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
    const x = e.clientX - rect.left;
    const clickRatio = x / canvas.width;
    const newTime = clickRatio * duration;
    
    onSeek(newTime);
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
