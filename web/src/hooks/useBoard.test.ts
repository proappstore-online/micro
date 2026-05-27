import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBoard } from './useBoard.ts'
import { createShape } from '../types/canvas.ts'

describe('useBoard', () => {
  it('starts with empty shapes and select tool', () => {
    const { result } = renderHook(() => useBoard())
    expect(result.current.shapes).toEqual([])
    expect(result.current.selectedIds).toEqual([])
    expect(result.current.activeTool).toBe('select')
    expect(result.current.activeColor).toBe('#111111')
  })

  it('initializes with provided shapes', () => {
    const initial = [createShape('rect', 10, 20)]
    const { result } = renderHook(() => useBoard(initial))
    expect(result.current.shapes).toHaveLength(1)
    expect(result.current.shapes[0].x).toBe(10)
  })

  it('addShape appends and marks dirty', () => {
    const { result } = renderHook(() => useBoard())
    const shape = createShape('rect', 0, 0)

    act(() => result.current.addShape(shape))

    expect(result.current.shapes).toHaveLength(1)
    expect(result.current.shapes[0].id).toBe(shape.id)
    expect(result.current.dirty).toBe(true)
  })

  it('updateShape patches a shape', () => {
    const shape = createShape('rect', 0, 0)
    const { result } = renderHook(() => useBoard([shape]))

    act(() => result.current.updateShape(shape.id, { x: 50, y: 50 }))

    expect(result.current.shapes[0].x).toBe(50)
    expect(result.current.shapes[0].y).toBe(50)
  })

  it('deleteSelected removes selected shapes', () => {
    const a = createShape('rect', 0, 0)
    const b = createShape('rect', 100, 100)
    const { result } = renderHook(() => useBoard([a, b]))

    act(() => result.current.setSelectedIds([a.id]))
    act(() => result.current.deleteSelected())

    expect(result.current.shapes).toHaveLength(1)
    expect(result.current.shapes[0].id).toBe(b.id)
    expect(result.current.selectedIds).toEqual([])
  })

  it('duplicateSelected creates copies offset by 20px', () => {
    const shape = createShape('rect', 10, 10)
    const { result } = renderHook(() => useBoard([shape]))

    act(() => result.current.setSelectedIds([shape.id]))
    act(() => result.current.duplicateSelected())

    expect(result.current.shapes).toHaveLength(2)
    const dupe = result.current.shapes[1]
    expect(dupe.id).not.toBe(shape.id)
    expect(dupe.x).toBe(30)
    expect(dupe.y).toBe(30)
    expect(result.current.selectedIds).toEqual([dupe.id])
  })

  it('bringToFront increases zIndex above max', () => {
    const a = createShape('rect', 0, 0)
    const b = createShape('rect', 0, 0)
    const { result } = renderHook(() => useBoard([a, b]))
    const maxZ = Math.max(a.zIndex, b.zIndex)

    act(() => result.current.setSelectedIds([a.id]))
    act(() => result.current.bringToFront())

    const updated = result.current.shapes.find(s => s.id === a.id)!
    expect(updated.zIndex).toBeGreaterThan(maxZ)
  })

  it('sendToBack decreases zIndex below min', () => {
    const a = createShape('rect', 0, 0)
    const b = createShape('rect', 0, 0)
    const { result } = renderHook(() => useBoard([a, b]))
    const minZ = Math.min(a.zIndex, b.zIndex)

    act(() => result.current.setSelectedIds([b.id]))
    act(() => result.current.sendToBack())

    const updated = result.current.shapes.find(s => s.id === b.id)!
    expect(updated.zIndex).toBeLessThan(minZ)
  })

  it('selectAll selects all shapes', () => {
    const a = createShape('rect', 0, 0)
    const b = createShape('ellipse', 0, 0)
    const { result } = renderHook(() => useBoard([a, b]))

    act(() => result.current.selectAll())

    expect(result.current.selectedIds).toHaveLength(2)
  })

  it('clearSelection empties selectedIds', () => {
    const shape = createShape('rect', 0, 0)
    const { result } = renderHook(() => useBoard([shape]))

    act(() => result.current.setSelectedIds([shape.id]))
    act(() => result.current.clearSelection())

    expect(result.current.selectedIds).toEqual([])
  })

  it('undo reverses addShape', () => {
    const { result } = renderHook(() => useBoard())
    const shape = createShape('rect', 0, 0)

    act(() => result.current.addShape(shape))
    expect(result.current.shapes).toHaveLength(1)

    act(() => result.current.undo())
    expect(result.current.shapes).toHaveLength(0)
  })

  it('redo restores after undo', () => {
    const { result } = renderHook(() => useBoard())
    const shape = createShape('rect', 0, 0)

    act(() => result.current.addShape(shape))
    act(() => result.current.undo())
    expect(result.current.shapes).toHaveLength(0)

    act(() => result.current.redo())
    expect(result.current.shapes).toHaveLength(1)
  })

  it('clearDirty resets dirty flag', () => {
    const { result } = renderHook(() => useBoard())

    act(() => result.current.addShape(createShape('rect', 0, 0)))
    expect(result.current.dirty).toBe(true)

    act(() => result.current.clearDirty())
    expect(result.current.dirty).toBe(false)
  })

  it('tool and color changes work', () => {
    const { result } = renderHook(() => useBoard())

    act(() => result.current.setActiveTool('rect'))
    expect(result.current.activeTool).toBe('rect')

    act(() => result.current.setActiveColor('#ff0000'))
    expect(result.current.activeColor).toBe('#ff0000')
  })
})
