import { describe, it, expect } from 'vitest'
import { reducer, createInitialState } from '../core/state/reducer'
import type { AppState, Segment, AudioSource } from '../types'

const seg = (id: string, sourceId: string, start: number, end: number): Segment => ({
  id,
  sourceId,
  segmentStart: start,
  segmentEnd: end,
  segmentDuration: end - start,
})

describe('REMOVE_SEGMENT when removing the first segment', () => {
  it('second becomes current and timeline equals full second track if it has no offset', () => {
    const s1: AudioSource = { id: 'src1', url: 'u1', name: 'one.mp3', duration: 120000 }
    const s2: AudioSource = { id: 'src2', url: 'u2', name: 'two.mp3', duration: 180000 }
    // After transition, first truncated to 10s
    const firstTruncated = seg('seg1', 'src1', 0, 10000)
    // Second has no offset and is full length
    const secondFull = seg('seg2', 'src2', 0, 180000)

    const initial = createInitialState()
    const state: AppState = {
      ...initial,
      sources: { [s1.id]: s1, [s2.id]: s2 },
      segments: [firstTruncated, secondFull],
      timeline: { ...initial.timeline, duration: 190000, currentTime: 0 },
      currentTrack: 'src2',
      nextTrack: null,
    }

    const next = reducer(state, { type: 'REMOVE_SEGMENT', payload: { segmentId: 'seg1' } })

    expect(next.segments).toHaveLength(1)
    expect(next.segments[0]).toMatchObject({ sourceId: 'src2', segmentStart: 0, segmentEnd: 180000 })
    expect(next.timeline.duration).toBe(180000)
    expect(next.currentTrack).toBe('src2')
  })

  it('second becomes current and timeline equals remaining clipped duration if it has a start offset', () => {
    const s1: AudioSource = { id: 'src1', url: 'u1', name: 'one.mp3', duration: 120000 }
    const s2: AudioSource = { id: 'src2', url: 'u2', name: 'two.mp3', duration: 180000 }
    // First truncated to 10s
    const firstTruncated = seg('seg1', 'src1', 0, 10000)
    // Second starts at 20s (offset) and goes to full end -> duration 160s
    const secondWithOffset = seg('seg2', 'src2', 20000, 180000)

    const initial = createInitialState()
    const state: AppState = {
      ...initial,
      sources: { [s1.id]: s1, [s2.id]: s2 },
      segments: [firstTruncated, secondWithOffset],
      timeline: { ...initial.timeline, duration: 170000, currentTime: 0 },
      currentTrack: 'src2',
      nextTrack: null,
    }

    const next = reducer(state, { type: 'REMOVE_SEGMENT', payload: { segmentId: 'seg1' } })

    expect(next.segments).toHaveLength(1)
    expect(next.segments[0]).toMatchObject({ sourceId: 'src2', segmentStart: 20000, segmentEnd: 180000 })
    expect(next.timeline.duration).toBe(160000) // 2:40
    expect(next.currentTrack).toBe('src2')
  })
})
