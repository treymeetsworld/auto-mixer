/**
 * Minimal AudioEngine for step-by-step implementation
 */
export class AudioEngine {
  private context: AudioContext;

  constructor() {
    this.context = new AudioContext();
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
}
