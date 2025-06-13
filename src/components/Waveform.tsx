import {
    useEffect,
    useRef,
    forwardRef,
    useImperativeHandle,
} from "react";
import WaveSurfer from "wavesurfer.js";

export type WaveformHandle = {
    playPause: () => void;
    seekTo: (seconds: number) => void;
    getCurrentTime: () => number;
    getDuration: () => number;
    setVolume: (volume: number) => void;
};

type Props = {
    url: string;
    onSeek: (time: number) => void;
};

const Waveform = forwardRef<WaveformHandle, Props>(({ url, onSeek }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WaveSurfer|null>(null);    // expose methods
    useImperativeHandle(ref, () => ({
        playPause: () => wsRef.current?.playPause()!,
        seekTo: (seconds: number) => {
            const ws = wsRef.current!;
            ws.seekTo(seconds / ws.getDuration());
        },
        getCurrentTime: () => wsRef.current?.getCurrentTime() || 0,
        getDuration:    () => wsRef.current?.getDuration()    || 0,
        setVolume: (volume: number) => wsRef.current?.setVolume(volume),
    }), []);

    useEffect(() => {        const ws = WaveSurfer.create({
            container: containerRef.current!,
            waveColor: "#aaa",
            progressColor: "#4f46e5",
            cursorColor: "#000",
            height: 100,
        });
        ws.load(url);
        ws.on("click" as any, (progress: number) => {
            onSeek(progress * ws.getDuration());
        });
        wsRef.current = ws;

        return () => {
            ws.destroy();
            wsRef.current = null;
        };
    }, [url, onSeek]);

    return <div ref={containerRef} />;
});

export default Waveform;
