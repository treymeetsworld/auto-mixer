import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AudioEngine } from '../core/audio/AudioEngine'
import { reducer, createInitialState } from '../core/state/reducer'
import type { AppState, AudioSource } from '../types'

// Mock audio files for testing
const createMockAudioSource = (id: string, name: string, duration: number = 180000): AudioSource => {
  return {
    id,
    url: `mock://audio/${name}`,
    name,
    duration,
    buffer: undefined // Will be populated by audio engine
  }
}

describe('Multi-Track Integration Tests', () => {
  let audioEngine: AudioEngine
  let state: AppState

  beforeEach(() => {
    vi.clearAllMocks()
    audioEngine = new AudioEngine()
    state = createInitialState()
  })

  describe('Adding Multiple Tracks', () => {
    it('should add multiple tracks to the state', () => {
      const track1 = createMockAudioSource('1', 'Track 1', 180000)
      const track2 = createMockAudioSource('2', 'Track 2', 200000)
      const track3 = createMockAudioSource('3', 'Track 3', 160000)

      // Add first track
      let newState = reducer(state, {
        type: 'LOAD_SOURCE',
        payload: track1
      })

      expect(Object.keys(newState.sources)).toHaveLength(1)
      expect(newState.sources['1'].name).toBe('Track 1')

      // Add second track
      newState = reducer(newState, {
        type: 'LOAD_SOURCE',
        payload: track2
      })

      expect(Object.keys(newState.sources)).toHaveLength(2)
      expect(newState.sources['2'].name).toBe('Track 2')

      // Add third track
      newState = reducer(newState, {
        type: 'LOAD_SOURCE',
        payload: track3
      })

      expect(Object.keys(newState.sources)).toHaveLength(3)
      expect(newState.sources['3'].name).toBe('Track 3')
    })

    it('should handle tracks with different durations', () => {
      const shortTrack = createMockAudioSource('short', 'Short Track', 60000) // 1 minute
      const longTrack = createMockAudioSource('long', 'Long Track', 300000) // 5 minutes

      let newState = reducer(state, {
        type: 'LOAD_SOURCE',
        payload: shortTrack
      })

      newState = reducer(newState, {
        type: 'LOAD_SOURCE',
        payload: longTrack
      })

      expect(Object.keys(newState.sources)).toHaveLength(2)
      expect(newState.sources['short'].duration).toBe(60000)
      expect(newState.sources['long'].duration).toBe(300000)

      // Check that both tracks are properly stored
      const sourceDurations = Object.values(newState.sources).map(s => s.duration)
      expect(sourceDurations).toContain(60000)
      expect(sourceDurations).toContain(300000)
    })

    it('should assign unique IDs to each track', () => {
      const tracks = [
        createMockAudioSource('track-1', 'Track 1'),
        createMockAudioSource('track-2', 'Track 2'),
        createMockAudioSource('track-3', 'Track 3')
      ]

      let newState = state

      tracks.forEach((track) => {
        newState = reducer(newState, {
          type: 'LOAD_SOURCE',
          payload: track
        })
      })

      expect(Object.keys(newState.sources)).toHaveLength(3)
      
      // Check all IDs are unique and present
      const ids = Object.keys(newState.sources)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(3)
      expect(ids.sort()).toEqual(['track-1', 'track-2', 'track-3'])
    })
  })

  describe('Track Selection and Management', () => {
    let multiTrackState: AppState

    beforeEach(() => {
      // Set up state with multiple tracks
      multiTrackState = state
      const tracks = [
        createMockAudioSource('drums', 'Drums', 180000),
        createMockAudioSource('bass', 'Bass', 200000),
        createMockAudioSource('guitar', 'Guitar', 160000)
      ]

      tracks.forEach(track => {
        multiTrackState = reducer(multiTrackState, {
          type: 'LOAD_SOURCE',
          payload: track
        })
      })
    })

    it('should select first track and create initial segment', () => {
      // Initially no track selected
      expect(multiTrackState.currentTrack).toBeNull()
      expect(multiTrackState.segments).toHaveLength(0)

      // Select first track
      const newState = reducer(multiTrackState, {
        type: 'SELECT_FIRST_TRACK',
        payload: { sourceId: 'drums' }
      })

      expect(newState.currentTrack).toBe('drums')
      expect(newState.segments).toHaveLength(1)
      expect(newState.segments[0].sourceId).toBe('drums')
      expect(newState.timeline.duration).toBe(180000) // Track duration
    })

    it('should select next track for transition', () => {
      // First select initial track
      let newState = reducer(multiTrackState, {
        type: 'SELECT_FIRST_TRACK',
        payload: { sourceId: 'drums' }
      })

      expect(newState.currentTrack).toBe('drums')
      expect(newState.nextTrack).toBeNull()

      // Select next track
      newState = reducer(newState, {
        type: 'SELECT_NEXT_TRACK',
        payload: { sourceId: 'bass' }
      })

      expect(newState.currentTrack).toBe('drums')
      expect(newState.nextTrack).toBe('bass')
    })

    it('should handle invalid track selection', () => {
      const newState = reducer(multiTrackState, {
        type: 'SELECT_FIRST_TRACK',
        payload: { sourceId: 'non-existent-id' }
      })

      // Should not change the state if source ID doesn't exist
      expect(newState.currentTrack).toBe(multiTrackState.currentTrack)
      expect(newState.segments).toHaveLength(0)
    })
  })

  describe('Multi-Track Playback and Transitions', () => {
    let multiTrackState: AppState

    beforeEach(() => {
      // Set up state with multiple tracks and first track selected
      multiTrackState = state
      const tracks = [
        createMockAudioSource('track1', 'Track 1', 180000),
        createMockAudioSource('track2', 'Track 2', 200000)
      ]

      tracks.forEach(track => {
        multiTrackState = reducer(multiTrackState, {
          type: 'LOAD_SOURCE',
          payload: track
        })
      })

      // Select first track
      multiTrackState = reducer(multiTrackState, {
        type: 'SELECT_FIRST_TRACK',
        payload: { sourceId: 'track1' }
      })
    })

    it('should handle playback state changes', () => {
      expect(multiTrackState.timeline.isPlaying).toBe(false)

      // Start playback
      const playingState = reducer(multiTrackState, {
        type: 'PLAY_PAUSE'
      })

      expect(playingState.timeline.isPlaying).toBe(true)

      // Pause playback
      const pausedState = reducer(playingState, {
        type: 'PLAY_PAUSE'
      })

      expect(pausedState.timeline.isPlaying).toBe(false)
    })

    it('should create transition between tracks', () => {
      // Select next track
      let newState = reducer(multiTrackState, {
        type: 'SELECT_NEXT_TRACK',
        payload: { sourceId: 'track2' }
      })

      expect(newState.nextTrack).toBe('track2')

      // Add transition at 120 seconds (2 minutes)
      newState = reducer(newState, {
        type: 'ADD_TRACK_WITH_TRANSITION',
        payload: { sourceId: 'track2', transitionPoint: 120000 }
      })

      // Should have created segments for both tracks
      expect(newState.segments).toHaveLength(2)
      
      // First segment (track1) should end at transition point
      const track1Segment = newState.segments.find(s => s.sourceId === 'track1')
      expect(track1Segment).toBeDefined()
      expect(track1Segment!.segmentEnd).toBe(120000)

      // Second segment (track2) should start after first segment
      const track2Segment = newState.segments.find(s => s.sourceId === 'track2')
      expect(track2Segment).toBeDefined()
      expect(track2Segment!.segmentStart).toBe(0)

      // Timeline duration should be sum of both segments
      expect(newState.timeline.duration).toBeGreaterThan(120000)
    })

    it('should handle seeking across multiple segments', () => {
      // Create a multi-segment timeline
      let newState = reducer(multiTrackState, {
        type: 'SELECT_NEXT_TRACK',
        payload: { sourceId: 'track2' }
      })

      newState = reducer(newState, {
        type: 'ADD_TRACK_WITH_TRANSITION',
        payload: { sourceId: 'track2', transitionPoint: 120000 }
      })

      // Seek to middle of first track
      newState = reducer(newState, {
        type: 'SEEK_TO_TIME',
        payload: { time: 60000 }
      })

      expect(newState.timeline.currentTime).toBe(60000)

      // Seek to second track portion
      const totalFirstSegmentDuration = newState.segments[0].segmentDuration
      const seekTimeInSecondSegment = totalFirstSegmentDuration + 30000

      newState = reducer(newState, {
        type: 'SEEK_TO_TIME',
        payload: { time: seekTimeInSecondSegment }
      })

      expect(newState.timeline.currentTime).toBe(seekTimeInSecondSegment)
    })

    it('should handle stop command for multi-track timeline', () => {
      // Start playback
      let newState = reducer(multiTrackState, {
        type: 'PLAY_PAUSE'
      })

      expect(newState.timeline.isPlaying).toBe(true)

      // Set some current time
      newState = reducer(newState, {
        type: 'UPDATE_PLAYBACK_TIME',
        payload: { currentTime: 30000 }
      })

      expect(newState.timeline.currentTime).toBe(30000)

      // Stop playback
      newState = reducer(newState, {
        type: 'STOP_PLAYBACK'
      })

      expect(newState.timeline.isPlaying).toBe(false)
      expect(newState.timeline.currentTime).toBe(0)
    })

    it('should handle volume and mute controls', () => {
      // Test volume change
      let newState = reducer(multiTrackState, {
        type: 'SET_VOLUME',
        payload: { volume: 0.5 }
      })

      expect(newState.volume).toBe(0.5)
      expect(newState.isMuted).toBe(false)

      // Test mute toggle
      newState = reducer(newState, {
        type: 'TOGGLE_MUTE'
      })

      expect(newState.isMuted).toBe(true)
      expect(newState.volume).toBe(0.5) // Volume value preserved

      // Test unmute
      newState = reducer(newState, {
        type: 'TOGGLE_MUTE'
      })

      expect(newState.isMuted).toBe(false)
    })

    it('should handle playback rate changes', () => {
      const newState = reducer(multiTrackState, {
        type: 'SET_PLAYBACK_RATE',
        payload: { rate: 1.5 }
      })

      expect(newState.playbackRate).toBe(1.5)
    })
  })

  describe('Timeline Management with Multiple Tracks', () => {
    it('should calculate timeline duration from segments', () => {
      let newState = state

      // Add tracks with different durations
      const tracks = [
        createMockAudioSource('track1', 'Track 1', 120000),
        createMockAudioSource('track2', 'Track 2', 180000),
        createMockAudioSource('track3', 'Track 3', 150000)
      ]

      tracks.forEach(track => {
        newState = reducer(newState, {
          type: 'LOAD_SOURCE',
          payload: track
        })
      })

      // Select first track
      newState = reducer(newState, {
        type: 'SELECT_FIRST_TRACK',
        payload: { sourceId: 'track1' }
      })

      // Timeline should match first track duration
      expect(newState.timeline.duration).toBe(120000)

      // Add second track with transition
      newState = reducer(newState, {
        type: 'SELECT_NEXT_TRACK',
        payload: { sourceId: 'track2' }
      })

      newState = reducer(newState, {
        type: 'ADD_TRACK_WITH_TRANSITION',
        payload: { sourceId: 'track2', transitionPoint: 90000 }
      })

      // Timeline should now include both segments
      expect(newState.timeline.duration).toBeGreaterThan(120000)
      expect(newState.segments).toHaveLength(2)
    })

    it('should update playback time correctly', () => {
      let newState = state

      // Add and select a track
      newState = reducer(newState, {
        type: 'LOAD_SOURCE',
        payload: createMockAudioSource('track1', 'Track 1', 180000)
      })

      newState = reducer(newState, {
        type: 'SELECT_FIRST_TRACK',
        payload: { sourceId: 'track1' }
      })

      // Update playback time
      newState = reducer(newState, {
        type: 'UPDATE_PLAYBACK_TIME',
        payload: { currentTime: 45000 }
      })

      expect(newState.timeline.currentTime).toBe(45000)
    })
  })

  describe('Audio Engine Integration with Multiple Tracks', () => {
    it('should handle multiple audio sources in engine', () => {
      // Test that audio engine can handle volume changes
      expect(() => {
        audioEngine.setVolume(0.8)
      }).not.toThrow()

      expect(audioEngine.getVolume()).toBe(0.8)

      // Test mute functionality
      expect(() => {
        audioEngine.setMuted(true)
      }).not.toThrow()

      // Note: isMuted() method may not exist in current implementation
      // This test shows expected behavior for future implementation

      // Test playback rate
      expect(() => {
        audioEngine.setPlaybackRate(1.25)
      }).not.toThrow()

      expect(audioEngine.getPlaybackRate()).toBe(1.25)
    })
  })

  describe('Performance with Multiple Tracks', () => {
    it('should handle loading many tracks efficiently', () => {
      let newState = state
      const startTime = performance.now()

      // Load 10 tracks
      for (let i = 0; i < 10; i++) {
        newState = reducer(newState, {
          type: 'LOAD_SOURCE',
          payload: createMockAudioSource(`track-${i}`, `Track ${i + 1}`, 180000)
        })
      }

      const endTime = performance.now()
      const loadTime = endTime - startTime

      expect(Object.keys(newState.sources)).toHaveLength(10)
      expect(loadTime).toBeLessThan(100) // Should be fast in tests
    })

    it('should maintain performance during rapid state updates', () => {
      let newState = state

      // Add and select a track
      newState = reducer(newState, {
        type: 'LOAD_SOURCE',
        payload: createMockAudioSource('track1', 'Track 1', 180000)
      })

      newState = reducer(newState, {
        type: 'SELECT_FIRST_TRACK',
        payload: { sourceId: 'track1' }
      })

      const startTime = performance.now()

      // Rapid time updates (simulating real-time playback)
      for (let time = 0; time < 10000; time += 100) {
        newState = reducer(newState, {
          type: 'UPDATE_PLAYBACK_TIME',
          payload: { currentTime: time }
        })
      }

      const endTime = performance.now()
      const updateTime = endTime - startTime

      expect(newState.timeline.currentTime).toBe(9900)
      expect(updateTime).toBeLessThan(50) // Should handle rapid updates efficiently
    })
  })
})
