import React, { useRef, useState, useEffect } from 'react';

interface SeekBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export const SeekBar: React.FC<SeekBarProps> = ({ currentTime, duration, onSeek }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const percent = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  const seekFromClientX = (clientX: number) => {
    const track = trackRef.current;
    if (!track || duration <= 0) return;
    const rect = track.getBoundingClientRect();
    const x = clientX - rect.left;
    const clamped = Math.max(0, Math.min(rect.width, x));
    const ratio = rect.width > 0 ? clamped / rect.width : 0;
    onSeek(ratio * duration);
  };

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setDragging(true);
    seekFromClientX(e.clientX);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    seekFromClientX(e.clientX);
  };

  const onMouseUp = () => setDragging(false);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [dragging]);

  const valueNow = Math.round(percent * 100);

  return (
    <div className="timeline-seekbar" aria-label="Timeline seek bar">
      <div
        className="timeline-seekbar__track"
        ref={trackRef}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valueNow}
        aria-valuetext={`${valueNow}%`}
        onMouseDown={onMouseDown}
      >
        <div className="timeline-seekbar__fill" style={{ width: `${percent * 100}%` }} />
        <div className="timeline-seekbar__thumb" style={{ left: `${percent * 100}%` }} />
      </div>
    </div>
  );
};
