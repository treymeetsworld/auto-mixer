import { describe, it, expect } from 'vitest'
import { reducer, createInitialState } from '../core/state/reducer'
import type { AppState, Segment, AudioSource } from '../types'

function seg(id: string, sourceId: string, start: number, end: number): Segment {
  return { id, sourceId, segmentStart: start, segmentEnd: end, segmentDuration: end - start }
}

describe('REMOVE_SEGMENT restores previous full duration when removing last', () => {
  it('timeline goes from 3:10 to 2:00 when deleting second of two tracks', () => {
    // First track originally 2:00 (120000 ms)
    const s1: AudioSource = { id: 'src1', url: 'u1', name: 'one.mp3', duration: 120000 }
    // After adding second track, first is truncated to 0..10000 (10s)
    const firstTruncated = seg('seg1', 'src1', 0, 10000)
    // Second track full 3:00 (180000 ms)
    const s2: AudioSource = { id: 'src2', url: 'u2', name: 'two.mp3', duration: 180000 }
    const secondFull = seg('seg2', 'src2', 0, 180000)

    const initial = createInitialState()
    const state: AppState = {
      ...initial,
      sources: { [s1.id]: s1, [s2.id]: s2 },
      segments: [firstTruncated, secondFull],
      timeline: { ...initial.timeline, duration: 190000, currentTime: 0 }, // 3:10
      currentTrack: 'src2',
      nextTrack: null
    }

    const next = reducer(state, { type: 'REMOVE_SEGMENT', payload: { segmentId: 'seg2' } })

    expect(next.segments).toHaveLength(1)
    expect(next.segments[0].sourceId).toBe('src1')
    expect(next.segments[0].segmentStart).toBe(0)
    expect(next.segments[0].segmentEnd).toBe(120000)
    expect(next.segments[0].segmentDuration).toBe(120000)
    expect(next.timeline.duration).toBe(120000)
  })
})
