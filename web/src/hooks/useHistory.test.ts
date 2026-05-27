import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHistory } from './useHistory.ts'
import type { Shape } from '../types/canvas.ts'

function makeShape(id: string): Shape {
  return { id, type: 'rect', x: 0, y: 0, width: 100, height: 100, rotation: 0, fill: '#000', stroke: '#000', strokeWidth: 1, opacity: 1, zIndex: 1, cornerRadius: 0 }
}

describe('useHistory', () => {
  it('starts with empty undo/redo', () => {
    const { result } = renderHook(() => useHistory())
    expect(result.current.canUndo()).toBe(false)
    expect(result.current.canRedo()).toBe(false)
  })

  it('undo returns null when empty', () => {
    const { result } = renderHook(() => useHistory())
    const prev = result.current.undo([makeShape('a')])
    expect(prev).toBeNull()
  })

  it('redo returns null when empty', () => {
    const { result } = renderHook(() => useHistory())
    const next = result.current.redo([makeShape('a')])
    expect(next).toBeNull()
  })

  it('push then undo restores previous state', () => {
    const { result } = renderHook(() => useHistory())
    const state1 = [makeShape('a')]
    const state2 = [makeShape('a'), makeShape('b')]

    act(() => result.current.push(state1))
    expect(result.current.canUndo()).toBe(true)

    const restored = result.current.undo(state2)
    expect(restored).toEqual(state1)
    expect(result.current.canRedo()).toBe(true)
  })

  it('undo then redo restores forward state', () => {
    const { result } = renderHook(() => useHistory())
    const state1 = [makeShape('a')]
    const state2 = [makeShape('a'), makeShape('b')]

    act(() => result.current.push(state1))
    const afterUndo = result.current.undo(state2)
    expect(afterUndo).toEqual(state1)

    const afterRedo = result.current.redo(state1)
    expect(afterRedo).toEqual(state2)
  })

  it('push clears redo stack', () => {
    const { result } = renderHook(() => useHistory())

    act(() => result.current.push([makeShape('a')]))
    result.current.undo([makeShape('b')])
    expect(result.current.canRedo()).toBe(true)

    act(() => result.current.push([makeShape('c')]))
    expect(result.current.canRedo()).toBe(false)
  })

  it('respects MAX_HISTORY limit', () => {
    const { result } = renderHook(() => useHistory())

    for (let i = 0; i < 150; i++) {
      act(() => result.current.push([makeShape(`s${i}`)]))
    }

    let undoCount = 0
    let current = [makeShape('final')]
    while (true) {
      const prev = result.current.undo(current)
      if (!prev) break
      current = prev
      undoCount++
    }
    expect(undoCount).toBe(100)
  })

  it('multiple undo/redo cycles work correctly', () => {
    const { result } = renderHook(() => useHistory())
    const s1 = [makeShape('a')]
    const s2 = [makeShape('a'), makeShape('b')]
    const s3 = [makeShape('a'), makeShape('b'), makeShape('c')]

    act(() => result.current.push(s1))
    act(() => result.current.push(s2))

    const r1 = result.current.undo(s3)
    expect(r1).toEqual(s2)

    const r2 = result.current.undo(s2)
    expect(r2).toEqual(s1)

    const r3 = result.current.redo(s1)
    expect(r3).toEqual(s2)

    const r4 = result.current.redo(s2)
    expect(r4).toEqual(s3)

    expect(result.current.canRedo()).toBe(false)
  })
})
