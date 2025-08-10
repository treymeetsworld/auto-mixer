import { describe, it, expect, beforeEach } from 'vitest'
import { AudioEngine } from '../core/audio/AudioEngine'

describe('AudioEngine', () => {
  let audioEngine: AudioEngine
  
  beforeEach(() => {
    audioEngine = new AudioEngine()
  })

  it('should initialize with default values', () => {
    expect(audioEngine.getCurrentTime()).toBe(0)
    expect(audioEngine.getIsPlaying()).toBe(false)
    expect(audioEngine.getVolume()).toBe(0.8)
    expect(audioEngine.getPlaybackRate()).toBe(1.0)
  })

  it('should set volume correctly', () => {
    audioEngine.setVolume(0.5)
    expect(audioEngine.getVolume()).toBe(0.5)
  })

  it('should clamp volume to valid range', () => {
    audioEngine.setVolume(-0.5)
    expect(audioEngine.getVolume()).toBe(0)
    
    audioEngine.setVolume(1.5)
    expect(audioEngine.getVolume()).toBe(1)
  })

  it('should set playback rate correctly', () => {
    audioEngine.setPlaybackRate(1.5)
    expect(audioEngine.getPlaybackRate()).toBe(1.5)
  })

  it('should clamp playback rate to valid range', () => {
    audioEngine.setPlaybackRate(0.1)
    expect(audioEngine.getPlaybackRate()).toBe(0.25)
    
    audioEngine.setPlaybackRate(3.0)
    expect(audioEngine.getPlaybackRate()).toBe(2.0)
  })

  it('should handle resume correctly', async () => {
    await expect(audioEngine.resume()).resolves.not.toThrow()
  })

  it('should handle stop correctly', () => {
    expect(() => audioEngine.stop()).not.toThrow()
    expect(audioEngine.getIsPlaying()).toBe(false)
    expect(audioEngine.getCurrentTime()).toBe(0)
  })

  it('should handle pause correctly', () => {
    expect(() => audioEngine.pause()).not.toThrow()
    expect(audioEngine.getIsPlaying()).toBe(false)
  })

  it('should handle mute correctly', () => {
    audioEngine.setMuted(true)
    expect(audioEngine.getVolume()).toBe(0)
    
    audioEngine.setMuted(false)
    expect(audioEngine.getVolume()).toBe(0.8)
  })

  it('should return null for current buffer when none loaded', () => {
    expect(audioEngine.getCurrentBuffer()).toBe(null)
  })
})
