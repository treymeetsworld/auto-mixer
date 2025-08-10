/**
 * Enhanced AudioEngine with full playback controls
 */
export class AudioEngine {
  private context: AudioContext;
  private gainNode: GainNode;
  private currentSource: AudioBufferSourceNode | null = null;
  private startTime: number = 0;
  private pausedAt: number = 0;
  private isPlaying: boolean = false;
  private currentBuffer: AudioBuffer | null = null;
  private playbackRate: number = 1.0;

  constructor() {
    this.context = new AudioContext();
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);
    this.gainNode.gain.value = 0.8;
  }

  /**
   * Load an audio file and store its buffer
   */
  async loadAudio(url: string): Promise<AudioBuffer> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (error) {
      console.error('Error loading audio:', error);
      throw error;
    }
  }

  /**
   * Resume audio context if it's suspended
   */
  async resume() {
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  /**
   * Play audio buffer from a specific time
   */
  async play(buffer: AudioBuffer, startOffset: number = 0, volume: number = 0.8, rate: number = 1.0): Promise<void> {
    await this.resume();
    
    // Stop any currently playing audio
    this.stop();

    // Store current settings
    this.currentBuffer = buffer;
    this.playbackRate = rate;

    // Create new audio source
    this.currentSource = this.context.createBufferSource();
    this.currentSource.buffer = buffer;
    this.currentSource.playbackRate.value = rate;
    this.currentSource.connect(this.gainNode);

    // Set volume
    this.setVolume(volume);

  // Calculate start position (absolute position in buffer)
  const offsetSeconds = startOffset / 1000;
  // Track the absolute buffer position baseline
  this.startTime = this.context.currentTime - offsetSeconds;
    
    // Start playback
    this.currentSource.start(0, offsetSeconds);
    this.isPlaying = true;
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this.currentSource && this.isPlaying) {
      // Store absolute buffer position at pause time
      this.pausedAt = (this.context.currentTime - this.startTime) * 1000;
      this.currentSource.stop();
      this.currentSource = null;
      this.isPlaying = false;
    }
  }

  /**
   * Stop playback and reset position
   */
  stop(): void {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
    this.isPlaying = false;
    this.pausedAt = 0;
    this.startTime = 0;
  }

  /**
   * Get current playback time in milliseconds
   */
  getCurrentTime(): number {
    // Return absolute position within current buffer in ms
    if (this.isPlaying && this.currentSource) {
      return (this.context.currentTime - this.startTime) * 1000;
    }
    return this.pausedAt;
  }

  /**
   * Check if audio is currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.gainNode.gain.value;
  }

  /**
   * Mute/unmute audio
   */
  setMuted(muted: boolean): void {
    if (muted) {
      this.gainNode.gain.value = 0;
    } else {
      // Restore previous volume - you might want to store this separately
      this.gainNode.gain.value = 0.8;
    }
  }

  /**
   * Seek to a specific time in milliseconds
   */
  async seekTo(timeMs: number, buffer?: AudioBuffer, volume: number = 0.8, rate: number = 1.0): Promise<void> {
    const wasPlaying = this.isPlaying;
    // Stop current playback but keep paused position
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
    this.isPlaying = false;
    this.pausedAt = timeMs;

    if (wasPlaying && buffer) {
      // Resume immediately at new position
      await this.play(buffer, timeMs, volume, rate);
    }
  }

  /**
   * Set playback rate (0.25-2.0)
   */
  setPlaybackRate(rate: number): void {
    this.playbackRate = Math.max(0.25, Math.min(2.0, rate));
    if (this.currentSource) {
      this.currentSource.playbackRate.value = this.playbackRate;
    }
  }

  /**
   * Get current playback rate
   */
  getPlaybackRate(): number {
    return this.playbackRate;
  }

  /**
   * Get currently loaded buffer
   */
  getCurrentBuffer(): AudioBuffer | null {
    return this.currentBuffer;
  }
}
