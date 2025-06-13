import MusicTempo from 'music-tempo';

export function analyzeBPM(buffer: AudioBuffer): { bpm: number; beats: number[] } {
    const channelData = buffer.getChannelData(0);
    const audioData = Array.from(channelData.slice(0, 500000)); // shorter slice for performance
    const mt = new MusicTempo(audioData);
    return { bpm: mt.bpm, beats: mt.beats };
}
