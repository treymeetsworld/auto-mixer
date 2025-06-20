import { Segment, Timeline } from '../../types';

export class TimelineManager {
    private timeline: Timeline;

    constructor(initialTimeline?: Timeline) {
        this.timeline = initialTimeline || {
            segments: [],
            duration: 0,
            currentTime: 0,
            isPlaying: false,
            zoom: 1
        };
    }

    /**
     * Add a new segment to the timeline
     */
    addSegment(segment: Segment): Timeline {
        const newSegments = [...this.timeline.segments, segment];
        return this.updateTimeline({
            ...this.timeline,
            segments: newSegments,
            duration: this.calculateDuration(newSegments)
        });
    }

    /**
     * Remove a segment from the timeline
     */
    removeSegment(segmentId: string): Timeline {
        const newSegments = this.timeline.segments.filter(s => s.id !== segmentId);
        return this.updateTimeline({
            ...this.timeline,
            segments: newSegments,
            duration: this.calculateDuration(newSegments)
        });
    }

    /**
     * Update a segment's properties
     */
    updateSegment(updatedSegment: Segment): Timeline {
        const newSegments = this.timeline.segments.map(segment =>
            segment.id === updatedSegment.id ? updatedSegment : segment
        );
        return this.updateTimeline({
            ...this.timeline,
            segments: newSegments,
            duration: this.calculateDuration(newSegments)
        });
    }

    /**
     * Get active segments at a specific time
     */
    getActiveSegmentsAtTime(time: number): Segment[] {
        return this.timeline.segments.filter(segment => 
            time >= segment.startTime && 
            time < (segment.startTime + segment.duration)
        );
    }

    /**
     * Calculate total timeline duration based on segments
     */
    private calculateDuration(segments: Segment[]): number {
        if (segments.length === 0) return 0;
        return Math.max(...segments.map(s => s.startTime + s.duration));
    }

    /**
     * Update timeline state
     */
    private updateTimeline(newTimeline: Timeline): Timeline {
        this.timeline = newTimeline;
        return this.timeline;
    }

    /**
     * Get current timeline state
     */
    getTimeline(): Timeline {
        return this.timeline;
    }

    /**
     * Set current playback time
     */
    setCurrentTime(time: number): Timeline {
        return this.updateTimeline({
            ...this.timeline,
            currentTime: Math.max(0, Math.min(time, this.timeline.duration))
        });
    }

    /**
     * Set playback state
     */
    setPlaybackState(isPlaying: boolean): Timeline {
        return this.updateTimeline({
            ...this.timeline,
            isPlaying
        });
    }
}
