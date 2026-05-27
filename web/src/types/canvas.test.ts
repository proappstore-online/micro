import { describe, it, expect } from 'vitest'
import { createShape, computeSnap, STICKY_COLORS, SHAPE_COLORS } from './canvas.ts'
import type { RectShape, EllipseShape, TextShape, StickyShape, LineShape, ArrowShape, FreehandShape } from './canvas.ts'

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

  it('creates an arrow with empty points', () => {
    const s = createShape('arrow', 0, 0) as ArrowShape
    expect(s.type).toBe('arrow')
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

describe('computeSnap', () => {
  it('returns no adjustment when nothing is close', () => {
    const moving = { x: 0, y: 0, width: 50, height: 50 }
    const others = [{ x: 200, y: 200, width: 50, height: 50 }]
    const res = computeSnap(moving, others, 6)
    expect(res.adjX).toBe(0)
    expect(res.adjY).toBe(0)
    expect(res.guides).toHaveLength(0)
  })

  it('snaps left edge to neighbor left edge within threshold', () => {
    const moving = { x: 103, y: 0, width: 50, height: 50 }
    const others = [{ x: 100, y: 200, width: 50, height: 50 }]
    const res = computeSnap(moving, others, 6)
    expect(res.adjX).toBe(-3)
    expect(res.adjY).toBe(0)
    expect(res.guides).toHaveLength(1)
    expect(res.guides[0]).toMatchObject({ axis: 'x', pos: 100 })
  })

  it('snaps both axes when both are close', () => {
    const moving = { x: 102, y: 198, width: 40, height: 40 }
    const others = [{ x: 100, y: 200, width: 40, height: 40 }]
    const res = computeSnap(moving, others, 6)
    expect(res.adjX).toBe(-2)
    expect(res.adjY).toBe(2)
    expect(res.guides).toHaveLength(2)
  })

  it('snaps centers to centers', () => {
    const moving = { x: 0, y: 0, width: 40, height: 40 }    // center 20,20
    const others = [{ x: 1, y: 100, width: 40, height: 40 }] // center 21,120
    const res = computeSnap(moving, others, 6)
    expect(res.adjX).toBe(1) // shift right by 1 so centers align
  })

  it('picks the nearest snap target', () => {
    const moving = { x: 99, y: 0, width: 50, height: 50 } // left at 99, right at 149
    const others = [
      { x: 50, y: 0, width: 50, height: 50 },  // right edge at 100 — distance 1 from moving's left
      { x: 200, y: 0, width: 50, height: 50 }, // left edge at 200 — distance 51 from moving's right (out)
    ]
    const res = computeSnap(moving, others, 6)
    expect(res.adjX).toBe(1)
  })

  it('respects threshold', () => {
    const moving = { x: 110, y: 0, width: 50, height: 50 }
    const others = [{ x: 100, y: 0, width: 50, height: 50 }]
    const res = computeSnap(moving, others, 6) // diff is 10 — outside threshold
    expect(res.adjX).toBe(0)
  })
})
