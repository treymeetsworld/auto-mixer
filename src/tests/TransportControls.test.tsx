import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import { TransportControls } from '../components/controls/TransportControls'

describe('TransportControls Integration', () => {
  const defaultProps = {
    isPlaying: false,
    currentTime: 30000, // 30 seconds
    duration: 180000, // 3 minutes
    onPlayPause: vi.fn(),
    onStop: vi.fn(),
    formatTime: (ms: number) => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render transport controls with time display', () => {
    render(<TransportControls {...defaultProps} />)
    
    // Check for play/pause button by title
    const playPauseButton = screen.getByTitle('Play')
    expect(playPauseButton).toBeInTheDocument()
    
    // Check for stop button
    const stopButton = screen.getByTitle('Stop')
    expect(stopButton).toBeInTheDocument()
    
    // Check for time display elements separately
    expect(screen.getByText('0:30')).toBeInTheDocument()
    expect(screen.getByText('3:00')).toBeInTheDocument()
    expect(screen.getByText('/')).toBeInTheDocument()
  })

  it('should show play icon when not playing', () => {
    render(<TransportControls {...defaultProps} isPlaying={false} />)
    
    const playPauseButton = screen.getByTitle('Play')
    // The button should contain the Play icon (we can check for the SVG)
    const playIcon = playPauseButton.querySelector('svg')
    expect(playIcon).toBeInTheDocument()
  })

  it('should show pause icon when playing', () => {
    render(<TransportControls {...defaultProps} isPlaying={true} />)
    
    const playPauseButton = screen.getByTitle('Pause')
    // The button should contain the Pause icon
    const pauseIcon = playPauseButton.querySelector('svg')
    expect(pauseIcon).toBeInTheDocument()
  })

  it('should call onPlayPause when play/pause button is clicked', () => {
    const mockOnPlayPause = vi.fn()
    render(<TransportControls {...defaultProps} onPlayPause={mockOnPlayPause} />)
    
    const playPauseButton = screen.getByTitle('Play')
    playPauseButton.click()
    
    expect(mockOnPlayPause).toHaveBeenCalledTimes(1)
  })

  it('should call onStop when stop button is clicked', () => {
    const mockOnStop = vi.fn()
    render(<TransportControls {...defaultProps} onStop={mockOnStop} />)
    
    const stopButton = screen.getByTitle('Stop')
    stopButton.click()
    
    expect(mockOnStop).toHaveBeenCalledTimes(1)
  })

  it('should format time correctly', () => {
    const customFormatTime = vi.fn((ms: number) => `${ms}ms`)
    render(<TransportControls {...defaultProps} formatTime={customFormatTime} currentTime={45000} duration={120000} />)
    
    expect(customFormatTime).toHaveBeenCalledWith(45000)
    expect(customFormatTime).toHaveBeenCalledWith(120000)
  })

  it('should update display when time changes', () => {
    const { rerender } = render(<TransportControls {...defaultProps} currentTime={30000} duration={180000} />)
    
    expect(screen.getByText('0:30')).toBeInTheDocument()
    expect(screen.getByText('3:00')).toBeInTheDocument()
    
    // Re-render with different time
    rerender(<TransportControls {...defaultProps} currentTime={90000} duration={180000} />)
    
    expect(screen.getByText('1:30')).toBeInTheDocument()
    expect(screen.getByText('3:00')).toBeInTheDocument()
  })

  it('should handle zero duration gracefully', () => {
    render(<TransportControls {...defaultProps} currentTime={0} duration={0} />)
    
    // Both current and total time should show 0:00
    const timeElements = screen.getAllByText('0:00')
    expect(timeElements).toHaveLength(2) // current time and total time
  })
})
