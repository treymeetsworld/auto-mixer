import type { 
    MixState,
    MixSegment,
    CurrentTrack,
    NextTrack,
    Track,
    TimePoint,
    TransitionPoint
} from '../../types';

export class TimelineManager {
    private state: MixState;

    constructor(initialState?: Partial<MixState>) {
        this.state = {
            segments: [],
            totalDuration: 0,
            currentTime: 0,
            isPlaying: false,
            zoom: 1,
            ...initialState
        };
    }

    /**
     * Set the first track in the mix
     */
    setInitialTrack(track: Track): MixState {
        const segment: MixSegment = {
            id: `segment-${Date.now()}`,
            trackId: track.id,
            mixStartTime: 0,
            trackStartTime: 0,
            duration: track.duration
        };

        return this.updateState({
            currentTrack: {
                ...track,
                segmentStart: 0,
                segmentEnd: track.duration
            },
            segments: [segment],
            totalDuration: track.duration
        });
    }

    /**
     * Queue the next track for transition
     */
    setNextTrack(track: Track): MixState {
        return this.updateState({
            nextTrack: {
                ...track,
                scheduledStart: undefined
            }
        });
    }

    /**
     * Set a transition point for the current track
     */
    setTransitionPoint(time: number): MixState {
        if (!this.state.currentTrack || !this.state.nextTrack) {
            throw new Error('Cannot set transition point without current and next track');
        }

        const currentTrack = this.state.currentTrack;
        const nextTrack = this.state.nextTrack;

        // Update the current segment to end at transition
        const currentSegment = this.state.segments[this.state.segments.length - 1];
        const updatedCurrentSegment: MixSegment = {
            ...currentSegment,
            duration: time - currentSegment.mixStartTime,
            transitionOut: true
        };

        // Create the next segment starting at the transition point
        const nextSegment: MixSegment = {
            id: `segment-${Date.now()}`,
            trackId: nextTrack.id,
            mixStartTime: time,
            trackStartTime: 0,
            duration: nextTrack.duration
        };

        // Calculate new total duration
        const newDuration = Math.max(
            this.state.totalDuration,
            nextSegment.mixStartTime + nextSegment.duration
        );

        return this.updateState({
            segments: [
                ...this.state.segments.slice(0, -1),
                updatedCurrentSegment,
                nextSegment
            ],
            currentTrack: {
                ...currentTrack,
                segmentEnd: time
            },
            nextTrack: {
                ...nextTrack,
                scheduledStart: time
            },
            totalDuration: newDuration
        });
    }

    /**
     * Execute the transition to the next track
     */
    executeTransition(): MixState {
        if (!this.state.nextTrack?.scheduledStart) {
            throw new Error('No scheduled transition');
        }

        return this.updateState({
            currentTrack: {
                ...this.state.nextTrack,
                segmentStart: 0,
                segmentEnd: this.state.nextTrack.duration
            },
            nextTrack: undefined
        });
    }

    /**
     * Convert mix time to track time
     */
    getTrackTimeFromMixTime(mixTime: number): TimePoint {
        // Find the segment containing this mix time
        const segment = this.state.segments.find(seg => 
            mixTime >= seg.mixStartTime && 
            mixTime < (seg.mixStartTime + seg.duration)
        );

        if (!segment) {
            throw new Error('Invalid mix time');
        }

        return {
            mixTime,
            trackTime: mixTime - segment.mixStartTime + segment.trackStartTime,
            segmentId: segment.id
        };
    }

    /**
     * Get the current state of the mix
     */
    getState(): MixState {
        return this.state;
    }

    /**
     * Update playback time
     */
    setCurrentTime(time: number): MixState {
        return this.updateState({
            currentTime: Math.max(0, Math.min(time, this.state.totalDuration))
        });
    }

    /**
     * Set playback state
     */
    setPlaybackState(isPlaying: boolean): MixState {
        return this.updateState({
            isPlaying,
            // Reset time if stopping
            currentTime: isPlaying ? this.state.currentTime : 0
        });
    }

    /**
     * Get all transition points in the mix
     */
    getTransitionPoints(): TransitionPoint[] {
        return this.state.segments
            .filter(s => s.transitionOut)
            .map(segment => {
                const nextSegment = this.state.segments.find(
                    s => s.mixStartTime === segment.mixStartTime + segment.duration
                );
                
                if (!nextSegment) return null;

                return {
                    sourceTrackId: segment.trackId,
                    targetTrackId: nextSegment.trackId,
                    timeInSource: segment.duration,
                    mixPosition: segment.mixStartTime + segment.duration
                };
            })
            .filter((point): point is TransitionPoint => point !== null);
    }

    /**
     * Update the state immutably
     */
    private updateState(newState: Partial<MixState>): MixState {
        this.state = {
            ...this.state,
            ...newState
        };
        return this.state;
    }
}
