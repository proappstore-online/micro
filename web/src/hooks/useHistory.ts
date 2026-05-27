import { useRef, useCallback } from 'react'
import type { Shape } from '../types/canvas.ts'

const MAX_HISTORY = 100

export function useHistory() {
  const past = useRef<Shape[][]>([])
  const future = useRef<Shape[][]>([])

  const push = useCallback((shapes: Shape[]) => {
    past.current = [...past.current.slice(-(MAX_HISTORY - 1)), shapes]
    future.current = []
  }, [])

  const undo = useCallback((current: Shape[]): Shape[] | null => {
    if (past.current.length === 0) return null
    const prev = past.current[past.current.length - 1]
    past.current = past.current.slice(0, -1)
    future.current = [...future.current, current]
    return prev
  }, [])

  const redo = useCallback((current: Shape[]): Shape[] | null => {
    if (future.current.length === 0) return null
    const next = future.current[future.current.length - 1]
    future.current = future.current.slice(0, -1)
    past.current = [...past.current, current]
    return next
  }, [])

  const canUndo = useCallback(() => past.current.length > 0, [])
  const canRedo = useCallback(() => future.current.length > 0, [])

  return { push, undo, redo, canUndo, canRedo }
}
