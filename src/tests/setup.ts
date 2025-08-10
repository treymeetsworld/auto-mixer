import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Web Audio API
globalThis.AudioContext = class MockAudioContext {
  createGain() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      gain: { value: 1, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
    }
  }
  
  createBuffer(numberOfChannels: number, length: number, sampleRate: number) {
    return {
      numberOfChannels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData: vi.fn(() => new Float32Array(length))
    }
  }
  
  createBufferSource() {
    return {
      buffer: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
      playbackRate: { value: 1, setValueAtTime: vi.fn() }
    }
  }
  
  decodeAudioData(_arrayBuffer: ArrayBuffer) {
    return Promise.resolve(this.createBuffer(2, 44100, 44100))
  }
  
  get currentTime() { return 0 }
  get sampleRate() { return 44100 }
  get state() { return 'running' }
  
  resume() { return Promise.resolve() }
  suspend() { return Promise.resolve() }
  close() { return Promise.resolve() }
} as any

// Mock fetch for audio file loading
globalThis.fetch = vi.fn()

// Mock URL.createObjectURL
globalThis.URL.createObjectURL = vi.fn(() => 'mock-object-url')
globalThis.URL.revokeObjectURL = vi.fn()

// Mock requestAnimationFrame
globalThis.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16))
globalThis.cancelAnimationFrame = vi.fn()

// Mock HTMLMediaElement methods
Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  writable: true,
  value: vi.fn(),
})

Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: vi.fn(() => Promise.resolve()),
})

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: vi.fn(),
})
