import { describe, it, expect } from 'vitest'
import { createShape, STICKY_COLORS, SHAPE_COLORS } from './canvas.ts'
import type { RectShape, EllipseShape, TextShape, StickyShape, LineShape, FreehandShape } from './canvas.ts'

describe('createShape', () => {
  it('creates a rect with cornerRadius', () => {
    const s = createShape('rect', 10, 20) as RectShape
    expect(s.type).toBe('rect')
    expect(s.x).toBe(10)
    expect(s.y).toBe(20)
    expect(s.cornerRadius).toBe(8)
    expect(s.fill).toBe('transparent')
    expect(s.id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('creates an ellipse', () => {
    const s = createShape('ellipse', 0, 0) as EllipseShape
    expect(s.type).toBe('ellipse')
    expect(s.width).toBe(0)
    expect(s.height).toBe(0)
  })

  it('creates text with defaults', () => {
    const s = createShape('text', 5, 5) as TextShape
    expect(s.type).toBe('text')
    expect(s.text).toBe('')
    expect(s.fontSize).toBe(16)
    expect(s.textAlign).toBe('left')
    expect(s.width).toBe(200)
    expect(s.stroke).toBe('none')
  })

  it('creates a sticky note with yellow fill', () => {
    const s = createShape('sticky', 0, 0) as StickyShape
    expect(s.type).toBe('sticky')
    expect(s.fill).toBe('#fef08a')
    expect(s.width).toBe(200)
    expect(s.height).toBe(200)
    expect(s.text).toBe('')
  })

  it('creates a line with empty points', () => {
    const s = createShape('line', 0, 0) as LineShape
    expect(s.type).toBe('line')
    expect(s.points).toEqual([])
    expect(s.fill).toBe('none')
  })

  it('creates freehand with empty points', () => {
    const s = createShape('freehand', 0, 0) as FreehandShape
    expect(s.type).toBe('freehand')
    expect(s.points).toEqual([])
  })

  it('generates unique IDs', () => {
    const a = createShape('rect', 0, 0)
    const b = createShape('rect', 0, 0)
    expect(a.id).not.toBe(b.id)
  })

  it('sets incrementing zIndex from Date.now', () => {
    const a = createShape('rect', 0, 0)
    const b = createShape('rect', 0, 0)
    expect(b.zIndex).toBeGreaterThanOrEqual(a.zIndex)
  })

  it('exports color palettes', () => {
    expect(STICKY_COLORS).toHaveLength(6)
    expect(SHAPE_COLORS).toHaveLength(9)
    expect(SHAPE_COLORS[0]).toBe('#111111')
  })
})
