import { describe, it, expect } from 'vitest'
import { reducer, createInitialState } from '../core/state/reducer'
import type { AudioSource } from '../types'

describe('App Reducer', () => {
  const mockSource: AudioSource = {
    id: 'source-1',
    url: 'mock-url',
    duration: 30000, // 30 seconds
    name: 'test-track.mp3',
    buffer: undefined
  }

  const initialState = createInitialState()

  it('should return initial state', () => {
    expect(initialState).toEqual({
      sources: {},
      segments: [],
      timeline: {
        duration: 0,
        isPlaying: false,
        currentTime: 0
      },
      currentTrack: null,
      nextTrack: null,
      volume: 0.8,
      isMuted: false,
      playbackRate: 1.0
    })
  })

  it('should handle LOAD_SOURCE action', () => {
    const action = { type: 'LOAD_SOURCE' as const, payload: mockSource }
    const state = reducer(initialState, action)
    
    expect(state.sources[mockSource.id]).toEqual(mockSource)
    expect(Object.keys(state.sources)).toHaveLength(1)
  })

  it('should handle SELECT_FIRST_TRACK action', () => {
    const stateWithSource = reducer(initialState, { 
      type: 'LOAD_SOURCE', 
      payload: mockSource 
    })
    
    const action = { type: 'SELECT_FIRST_TRACK' as const, payload: { sourceId: mockSource.id } }
    const state = reducer(stateWithSource, action)
    
    expect(state.currentTrack).toBe(mockSource.id)
    expect(state.segments).toHaveLength(1)
    expect(state.segments[0]).toEqual({
      id: expect.any(String),
      sourceId: mockSource.id,
      segmentStart: 0,
      segmentEnd: mockSource.duration,
      segmentDuration: mockSource.duration
    })
    expect(state.timeline.duration).toBe(mockSource.duration)
  })

  it('should handle PLAY_PAUSE action', () => {
    let state = reducer(initialState, { type: 'PLAY_PAUSE' })
    expect(state.timeline.isPlaying).toBe(true)
    
    state = reducer(state, { type: 'PLAY_PAUSE' })
    expect(state.timeline.isPlaying).toBe(false)
  })

  it('should handle UPDATE_PLAYBACK_TIME action', () => {
    const action = { type: 'UPDATE_PLAYBACK_TIME' as const, payload: { currentTime: 5000 } }
    const state = reducer(initialState, action)
    
    expect(state.timeline.currentTime).toBe(5000)
  })

  it('should handle STOP_PLAYBACK action', () => {
    const playingState = {
      ...initialState,
      timeline: {
        ...initialState.timeline,
        isPlaying: true,
        currentTime: 5000
      }
    }
    
    const state = reducer(playingState, { type: 'STOP_PLAYBACK' })
    
    expect(state.timeline.isPlaying).toBe(false)
    expect(state.timeline.currentTime).toBe(0)
  })

  it('should handle SEEK_TO_TIME action', () => {
    const action = { type: 'SEEK_TO_TIME' as const, payload: { time: 10000 } }
    const state = reducer(initialState, action)
    
    expect(state.timeline.currentTime).toBe(10000)
  })

  it('should handle SET_VOLUME action', () => {
    const action = { type: 'SET_VOLUME' as const, payload: { volume: 0.5 } }
    const state = reducer(initialState, action)
    
    expect(state.volume).toBe(0.5)
  })

  it('should handle TOGGLE_MUTE action', () => {
    let state = reducer(initialState, { type: 'TOGGLE_MUTE' })
    expect(state.isMuted).toBe(true)
    
    state = reducer(state, { type: 'TOGGLE_MUTE' })
    expect(state.isMuted).toBe(false)
  })

  it('should handle SET_PLAYBACK_RATE action', () => {
    const action = { type: 'SET_PLAYBACK_RATE' as const, payload: { rate: 1.5 } }
    const state = reducer(initialState, action)
    
    expect(state.playbackRate).toBe(1.5)
  })

  it('should handle SELECT_NEXT_TRACK action', () => {
    const secondSource: AudioSource = {
      ...mockSource,
      id: 'source-2',
      name: 'second-track.mp3'
    }
    
    let state = reducer(initialState, { type: 'LOAD_SOURCE', payload: mockSource })
    state = reducer(state, { type: 'SELECT_FIRST_TRACK', payload: { sourceId: mockSource.id } })
    state = reducer(state, { type: 'LOAD_SOURCE', payload: secondSource })
    state = reducer(state, { type: 'SELECT_NEXT_TRACK', payload: { sourceId: secondSource.id } })
    
    expect(state.nextTrack).toBe(secondSource.id)
  })

  it('should handle SET_TRANSITION action', () => {
    const secondSource: AudioSource = {
      ...mockSource,
      id: 'source-2',
      name: 'second-track.mp3'
    }
    
    let state = reducer(initialState, { type: 'LOAD_SOURCE', payload: mockSource })
    state = reducer(state, { type: 'SELECT_FIRST_TRACK', payload: { sourceId: mockSource.id } })
    state = reducer(state, { type: 'LOAD_SOURCE', payload: secondSource })
    state = reducer(state, { type: 'SELECT_NEXT_TRACK', payload: { sourceId: secondSource.id } })
    
    const action = { type: 'SET_TRANSITION' as const, payload: { transitionPoint: 15000 } }
    state = reducer(state, action)
    
    expect(state.segments).toHaveLength(2)
    expect(state.segments[0].segmentEnd).toBe(15000)
    expect(state.segments[1].segmentStart).toBe(0)
    expect(state.timeline.duration).toBe(15000 + secondSource.duration)
  })
})
