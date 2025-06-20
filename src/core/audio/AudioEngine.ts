/**
 * Core audio engine responsible for loading and playing audio
 */
export class AudioEngine {
    private context: AudioContext;
    private sources: Map<string, AudioBuffer>;
    private activeNodes: Map<string, AudioBufferSourceNode>;
    private mainGainNode: GainNode;
    private pausedTime: number = 0;
    private startTime: number = 0;

    constructor() {
        this.context = new AudioContext();
        this.sources = new Map();
        this.activeNodes = new Map();
        this.mainGainNode = this.context.createGain();
        this.mainGainNode.connect(this.context.destination);
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
     * Create a source node for a segment
     */
    private createSourceNode(
        buffer: AudioBuffer, 
        startTime: number, 
        offset: number = 0, 
        duration?: number
    ): AudioBufferSourceNode {
        const sourceNode = this.context.createBufferSource();
        sourceNode.buffer = buffer;
        
        const gainNode = this.context.createGain();
        sourceNode.connect(gainNode);
        gainNode.connect(this.mainGainNode);

        sourceNode.start(startTime, offset, duration);
        return sourceNode;
    }

    /**
     * Play a segment of audio
     */
    playSegment(
        sourceId: string, 
        buffer: AudioBuffer,
        offset: number = 0,
        duration?: number,
        fromPausedPosition: boolean = false
    ): string {
        const nodeId = `${sourceId}-${Date.now()}`;
        this.startTime = this.context.currentTime;
        
        const effectiveOffset = fromPausedPosition ? 
            (offset + this.pausedTime) / 1000 : // Add paused time if resuming
            offset / 1000; // Convert ms to seconds
        
        const sourceNode = this.createSourceNode(
            buffer,
            this.startTime,
            effectiveOffset,
            duration ? duration / 1000 : undefined
        );

        this.activeNodes.set(nodeId, sourceNode);
        sourceNode.onended = () => {
            this.activeNodes.delete(nodeId);
        };

        return nodeId;
    }

    /**
     * Pause all playing audio and store current position
     */
    pause() {
        if (this.startTime > 0) {
            this.pausedTime = (this.context.currentTime - this.startTime) * 1000;
        }
        this.stopAll();
    }

    /**
     * Get current playback position considering paused state
     */
    getCurrentPosition(): number {
        if (this.activeNodes.size === 0) {
            return this.pausedTime;
        }
        return ((this.context.currentTime - this.startTime) * 1000) + this.pausedTime;
    }

    /**
     * Reset playback position
     */
    resetPosition() {
        this.pausedTime = 0;
        this.startTime = 0;
    }

    /**
     * Stop all playing audio
     */
    stopAll() {
        this.activeNodes.forEach(node => {
            try {
                node.stop();
            } catch (e) {
                // Node might have already stopped
            }
        });
        this.activeNodes.clear();
    }

    /**
     * Set master volume
     */
    setVolume(value: number) {
        this.mainGainNode.gain.value = Math.max(0, Math.min(1, value));
    }

    /**
     * Get current audio context time
     */
    getCurrentTime(): number {
        return this.context.currentTime * 1000; // Convert to ms
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
