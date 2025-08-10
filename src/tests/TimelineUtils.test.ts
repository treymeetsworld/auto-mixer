import { describe, it, expect } from 'vitest'
import { 
  calculateSegmentDuration, 
  calculateTimelineDuration, 
  createSegment, 
  updateSegmentEnd,
  validateSegment 
} from '../core/timeline/TimelineUtils'
import type { AudioSource, Segment } from '../types'

describe('Timeline Utilities', () => {
  const mockSource: AudioSource = {
    id: 'source-1',
    url: 'test-url',
    name: 'test.mp3',
    duration: 60000, // 60 seconds
    buffer: undefined
  }

  describe('calculateSegmentDuration', () => {
    it('should calculate correct duration', () => {
      const duration = calculateSegmentDuration(5000, 15000)
      expect(duration).toBe(10000)
    })

    it('should handle zero duration', () => {
      const duration = calculateSegmentDuration(5000, 5000)
      expect(duration).toBe(0)
    })
  })

  describe('calculateTimelineDuration', () => {
    it('should calculate total duration from segments', () => {
      const segments: Segment[] = [
        {
          id: 'seg-1',
          sourceId: 'source-1',
          segmentStart: 0,
          segmentEnd: 15000,
          segmentDuration: 15000
        },
        {
          id: 'seg-2',
          sourceId: 'source-2',
          segmentStart: 5000,
          segmentEnd: 20000,
          segmentDuration: 15000
        }
      ]

      const totalDuration = calculateTimelineDuration(segments)
      expect(totalDuration).toBe(30000)
    })

    it('should return 0 for empty segments array', () => {
      const totalDuration = calculateTimelineDuration([])
      expect(totalDuration).toBe(0)
    })
  })

  describe('createSegment', () => {
    it('should create segment with correct properties', () => {
      const segment = createSegment('seg-1', mockSource, 5000, 15000)
      
      expect(segment).toEqual({
        id: 'seg-1',
        sourceId: mockSource.id,
        segmentStart: 5000,
        segmentEnd: 15000,
        segmentDuration: 10000
      })
    })
  })

  describe('updateSegmentEnd', () => {
    it('should update segment end and recalculate duration', () => {
      const originalSegment: Segment = {
        id: 'seg-1',
        sourceId: 'source-1',
        segmentStart: 5000,
        segmentEnd: 15000,
        segmentDuration: 10000
      }

      const updatedSegment = updateSegmentEnd(originalSegment, 20000)
      
      expect(updatedSegment).toEqual({
        id: 'seg-1',
        sourceId: 'source-1',
        segmentStart: 5000,
        segmentEnd: 20000,
        segmentDuration: 15000
      })
    })
  })

  describe('validateSegment', () => {
    it('should validate correct segment', () => {
      const segment: Segment = {
        id: 'seg-1',
        sourceId: 'source-1',
        segmentStart: 5000,
        segmentEnd: 15000,
        segmentDuration: 10000
      }

      const isValid = validateSegment(segment, mockSource)
      expect(isValid).toBe(true)
    })

    it('should reject segment with negative start', () => {
      const segment: Segment = {
        id: 'seg-1',
        sourceId: 'source-1',
        segmentStart: -1000,
        segmentEnd: 15000,
        segmentDuration: 16000
      }

      const isValid = validateSegment(segment, mockSource)
      expect(isValid).toBe(false)
    })

    it('should reject segment exceeding source duration', () => {
      const segment: Segment = {
        id: 'seg-1',
        sourceId: 'source-1',
        segmentStart: 5000,
        segmentEnd: 70000, // Exceeds 60s source
        segmentDuration: 65000
      }

      const isValid = validateSegment(segment, mockSource)
      expect(isValid).toBe(false)
    })

    it('should reject segment with start >= end', () => {
      const segment: Segment = {
        id: 'seg-1',
        sourceId: 'source-1',
        segmentStart: 15000,
        segmentEnd: 10000, // End before start
        segmentDuration: -5000
      }

      const isValid = validateSegment(segment, mockSource)
      expect(isValid).toBe(false)
    })
  })
})
