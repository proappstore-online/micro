import { useState, useCallback, useRef } from 'react'
import type { Shape, ToolType } from '../types/canvas.ts'
import { useHistory } from './useHistory.ts'

export function useBoard(initialShapes: Shape[] = []) {
  const [shapes, setShapes] = useState<Shape[]>(initialShapes)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeTool, setActiveTool] = useState<ToolType>('select')
  const [activeColor, setActiveColor] = useState('#111111')
  const [dirty, setDirty] = useState(false)
  const history = useHistory()
  const shapesRef = useRef(shapes)
  shapesRef.current = shapes

  const snapshot = useCallback(() => {
    history.push([...shapesRef.current])
  }, [history])

  const applyShapes = useCallback((next: Shape[]) => {
    setShapes(next)
    setDirty(true)
  }, [])

  const addShape = useCallback((shape: Shape) => {
    snapshot()
    applyShapes([...shapesRef.current, shape])
  }, [snapshot, applyShapes])

  const updateShape = useCallback((id: string, patch: Partial<Shape>) => {
    applyShapes(shapesRef.current.map(s => s.id === id ? { ...s, ...patch } as Shape : s))
  }, [applyShapes])

  const commitUpdate = useCallback(() => {
    snapshot()
  }, [snapshot])

  const deleteSelected = useCallback(() => {
    snapshot()
    applyShapes(shapesRef.current.filter(s => !selectedIds.includes(s.id)))
    setSelectedIds([])
  }, [selectedIds, snapshot, applyShapes])

  const bringToFront = useCallback(() => {
    if (selectedIds.length === 0) return
    snapshot()
    const maxZ = Math.max(...shapesRef.current.map(s => s.zIndex), 0)
    applyShapes(shapesRef.current.map(s =>
      selectedIds.includes(s.id) ? { ...s, zIndex: maxZ + 1 } as Shape : s
    ))
  }, [selectedIds, snapshot, applyShapes])

  const sendToBack = useCallback(() => {
    if (selectedIds.length === 0) return
    snapshot()
    const minZ = Math.min(...shapesRef.current.map(s => s.zIndex), 0)
    applyShapes(shapesRef.current.map(s =>
      selectedIds.includes(s.id) ? { ...s, zIndex: minZ - 1 } as Shape : s
    ))
  }, [selectedIds, snapshot, applyShapes])

  const duplicateSelected = useCallback(() => {
    snapshot()
    const dupes = shapesRef.current
      .filter(s => selectedIds.includes(s.id))
      .map(s => ({ ...s, id: crypto.randomUUID(), x: s.x + 20, y: s.y + 20, zIndex: Date.now() })) as Shape[]
    applyShapes([...shapesRef.current, ...dupes])
    setSelectedIds(dupes.map(s => s.id))
  }, [selectedIds, snapshot, applyShapes])

  const selectAll = useCallback(() => {
    setSelectedIds(shapesRef.current.map(s => s.id))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds([])
  }, [])

  const undo = useCallback(() => {
    const prev = history.undo(shapesRef.current)
    if (prev) {
      setShapes(prev)
      setSelectedIds([])
      setDirty(true)
    }
  }, [history])

  const redo = useCallback(() => {
    const next = history.redo(shapesRef.current)
    if (next) {
      setShapes(next)
      setSelectedIds([])
      setDirty(true)
    }
  }, [history])

  const loadShapes = useCallback((s: Shape[]) => {
    setShapes(s)
    setDirty(false)
  }, [])

  const clearDirty = useCallback(() => {
    setDirty(false)
  }, [])

  return {
    shapes,
    selectedIds,
    activeTool,
    activeColor,
    dirty,
    setShapes,
    setSelectedIds,
    setActiveTool,
    setActiveColor,
    addShape,
    updateShape,
    commitUpdate,
    deleteSelected,
    bringToFront,
    sendToBack,
    duplicateSelected,
    selectAll,
    clearSelection,
    undo,
    redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    loadShapes,
    clearDirty,
  }
}
