// music-tempo.d.ts
declare module 'music-tempo' {
    interface MusicTempoResult {
        bpm: number;
        beats: number[];
    }

    class MusicTempo {
        constructor(audioData: number[] | Float32Array);
        bpm: number;
        beats: number[];
    }

    export = MusicTempo;
}