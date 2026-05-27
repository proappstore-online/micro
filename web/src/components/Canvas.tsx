import { useRef, useCallback, useState, useEffect } from 'react'
import type { Shape, Point, ToolType } from '../types/canvas.ts'
import { createShape } from '../types/canvas.ts'
import { useCamera } from '../hooks/useCamera.ts'
import { useBoard } from '../hooks/useBoard.ts'
import { ShapeRenderer } from './ShapeRenderer.tsx'
import { SelectionHandles } from './SelectionHandles.tsx'
import { Toolbar } from './Toolbar.tsx'
import { TextEditor } from './TextEditor.tsx'

interface DragState {
  type: 'none' | 'pan' | 'draw' | 'move' | 'resize' | 'select-box'
  startCanvas: Point
  startScreen: Point
  shapeId?: string
  handle?: string
  origShapes?: Map<string, { x: number; y: number; width: number; height: number }>
}

const NONE_DRAG: DragState = { type: 'none', startCanvas: { x: 0, y: 0 }, startScreen: { x: 0, y: 0 } }

interface CanvasProps {
  boardId: string
  boardName: string
  initialShapes: Shape[]
  initialCamera: { x: number; y: number; zoom: number }
  onSave: (shapes: Shape[], camera: { x: number; y: number; zoom: number }) => void
  onRename: (name: string) => void
  onBack: () => void
}

export function Canvas({ boardId: _boardId, boardName, initialShapes, initialCamera, onSave, onRename, onBack }: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { camera, screenToCanvas, pan, zoomBy, resetView, setCamera } = useCamera(svgRef)
  const board = useBoard(initialShapes)
  const [drag, setDrag] = useState<DragState>(NONE_DRAG)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectBox, setSelectBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [editingName, setEditingName] = useState(false)
  const dragRef = useRef(drag)
  dragRef.current = drag

  const boardRef = useRef(board)
  boardRef.current = board

  const cameraRef = useRef(camera)
  cameraRef.current = camera

  const screenToCanvasRef = useRef(screenToCanvas)
  screenToCanvasRef.current = screenToCanvas

  useEffect(() => {
    setCamera(initialCamera)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save when shapes or camera change
  useEffect(() => {
    if (!board.dirty) return
    const timer = setTimeout(() => {
      onSave(board.shapes, camera)
      board.clearDirty()
    }, 1500)
    return () => clearTimeout(timer)
  }, [board.shapes, board.dirty, camera, onSave, board.clearDirty])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    if (e.ctrlKey || e.metaKey) {
      const factor = e.deltaY > 0 ? 0.9 : 1.1
      zoomBy(factor, e.clientX, e.clientY)
    } else {
      pan(-e.deltaX, -e.deltaY)
    }
  }, [pan, zoomBy])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const b = boardRef.current
    const canvasPoint = screenToCanvasRef.current(e.clientX, e.clientY)
    const screenPoint = { x: e.clientX, y: e.clientY }

    if (b.activeTool === 'pan' || e.button === 1) {
      setDrag({ type: 'pan', startCanvas: canvasPoint, startScreen: screenPoint })
      ;(e.target as Element).setPointerCapture(e.pointerId)
      return
    }

    if (e.button !== 0) return

    if (b.activeTool === 'select') {
      b.clearSelection()
      setSelectBox(null)
      setDrag({ type: 'select-box', startCanvas: canvasPoint, startScreen: screenPoint })
      ;(e.target as Element).setPointerCapture(e.pointerId)
      return
    }

    const shape = createShape(b.activeTool, canvasPoint.x, canvasPoint.y)
    if (b.activeTool === 'freehand' || b.activeTool === 'line') {
      ;(shape as any).points = [{ x: canvasPoint.x, y: canvasPoint.y }]
      ;(shape as any).stroke = b.activeColor
    } else {
      if (shape.type === 'rect' || shape.type === 'ellipse') {
        ;(shape as any).stroke = b.activeColor
      }
    }
    b.addShape(shape)
    b.setSelectedIds([shape.id])
    setDrag({ type: 'draw', startCanvas: canvasPoint, startScreen: screenPoint, shapeId: shape.id })
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current
    if (d.type === 'none') return

    const b = boardRef.current
    const canvasPoint = screenToCanvasRef.current(e.clientX, e.clientY)

    if (d.type === 'pan') {
      pan(e.movementX, e.movementY)
      return
    }

    if (d.type === 'select-box') {
      const x = Math.min(d.startCanvas.x, canvasPoint.x)
      const y = Math.min(d.startCanvas.y, canvasPoint.y)
      const w = Math.abs(canvasPoint.x - d.startCanvas.x)
      const h = Math.abs(canvasPoint.y - d.startCanvas.y)
      setSelectBox({ x, y, w, h })
      const ids = b.shapes.filter(s => {
        if (s.type === 'line' || s.type === 'freehand') return false
        return s.x < x + w && s.x + s.width > x && s.y < y + h && s.y + s.height > y
      }).map(s => s.id)
      b.setSelectedIds(ids)
      return
    }

    if (d.type === 'draw' && d.shapeId) {
      const shape = b.shapes.find(s => s.id === d.shapeId)
      if (!shape) return

      if (shape.type === 'freehand' || shape.type === 'line') {
        const pts = [...(shape as any).points, canvasPoint]
        b.updateShape(d.shapeId, { points: pts } as any)
      } else if (shape.type === 'sticky' || shape.type === 'text') {
        // stickies/text keep their default size
      } else {
        const x = Math.min(d.startCanvas.x, canvasPoint.x)
        const y = Math.min(d.startCanvas.y, canvasPoint.y)
        const width = Math.abs(canvasPoint.x - d.startCanvas.x)
        const height = Math.abs(canvasPoint.y - d.startCanvas.y)
        b.updateShape(d.shapeId, { x, y, width, height })
      }
      return
    }

    if (d.type === 'move' && d.origShapes) {
      const dx = canvasPoint.x - d.startCanvas.x
      const dy = canvasPoint.y - d.startCanvas.y
      for (const [id, orig] of d.origShapes) {
        b.updateShape(id, { x: orig.x + dx, y: orig.y + dy })
      }
      return
    }

    if (d.type === 'resize' && d.shapeId && d.handle && d.origShapes) {
      const orig = d.origShapes.get(d.shapeId)
      if (!orig) return
      const dx = canvasPoint.x - d.startCanvas.x
      const dy = canvasPoint.y - d.startCanvas.y
      const h = d.handle
      let { x, y, width, height } = orig

      if (h.includes('r')) { width += dx }
      if (h.includes('l')) { x += dx; width -= dx }
      if (h.includes('b')) { height += dy }
      if (h.includes('t')) { y += dy; height -= dy }

      if (width < 10) { width = 10 }
      if (height < 10) { height = 10 }

      b.updateShape(d.shapeId, { x, y, width, height })
    }
  }, [pan])

  const handlePointerUp = useCallback((_e: React.PointerEvent) => {
    const d = dragRef.current
    if (d.type === 'draw' && d.shapeId) {
      const b = boardRef.current
      const shape = b.shapes.find(s => s.id === d.shapeId)
      if (shape && (shape.type === 'text' || shape.type === 'sticky')) {
        setEditingId(shape.id)
      }
    }
    if (d.type === 'move' || d.type === 'resize') {
      boardRef.current.commitUpdate()
    }
    if (d.type === 'select-box') {
      setSelectBox(null)
    }
    setDrag(NONE_DRAG)
  }, [])

  const handleShapePointerDown = useCallback((e: React.PointerEvent, id: string) => {
    const b = boardRef.current
    if (b.activeTool !== 'select') return

    const canvasPoint = screenToCanvasRef.current(e.clientX, e.clientY)
    const selected = e.shiftKey ? [...new Set([...b.selectedIds, id])] : [id]
    b.setSelectedIds(selected)

    const origShapes = new Map<string, { x: number; y: number; width: number; height: number }>()
    for (const sid of selected) {
      const s = b.shapes.find(sh => sh.id === sid)
      if (s) origShapes.set(sid, { x: s.x, y: s.y, width: s.width, height: s.height })
    }

    b.commitUpdate()

    setDrag({
      type: 'move',
      startCanvas: canvasPoint,
      startScreen: { x: e.clientX, y: e.clientY },
      origShapes,
    })
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }, [])

  const handleResizeStart = useCallback((e: React.PointerEvent, shape: Shape, handle: string) => {
    boardRef.current.commitUpdate()
    const canvasPoint = screenToCanvasRef.current(e.clientX, e.clientY)
    const origShapes = new Map([[shape.id, { x: shape.x, y: shape.y, width: shape.width, height: shape.height }]])
    setDrag({
      type: 'resize',
      startCanvas: canvasPoint,
      startScreen: { x: e.clientX, y: e.clientY },
      shapeId: shape.id,
      handle,
      origShapes,
    })
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }, [])

  const handleDoubleClick = useCallback((id: string) => {
    const shape = boardRef.current.shapes.find(s => s.id === id)
    if (shape && (shape.type === 'text' || shape.type === 'sticky')) {
      setEditingId(id)
    }
  }, [])

  const commitText = useCallback((id: string, text: string) => {
    boardRef.current.commitUpdate()
    boardRef.current.updateShape(id, { text } as any)
    setEditingId(null)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const b = boardRef.current
      if (editingId || editingName) return

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) { b.redo() } else { b.undo() }
        return
      }

      switch (e.key) {
        case 'v': b.setActiveTool('select'); break
        case 'h': b.setActiveTool('pan'); break
        case 'r': b.setActiveTool('rect'); break
        case 'o': b.setActiveTool('ellipse'); break
        case 'l': b.setActiveTool('line'); break
        case 'p': b.setActiveTool('freehand'); break
        case 't': b.setActiveTool('text'); break
        case 's': b.setActiveTool('sticky'); break
        case 'Delete':
        case 'Backspace':
          if (b.selectedIds.length > 0) {
            e.preventDefault()
            b.deleteSelected()
          }
          break
        case 'a':
          if (e.metaKey || e.ctrlKey) { e.preventDefault(); b.selectAll() }
          break
        case 'd':
          if (e.metaKey || e.ctrlKey) { e.preventDefault(); b.duplicateSelected() }
          break
        case 'Escape':
          b.clearSelection()
          b.setActiveTool('select')
          break
        case ']':
          if (e.metaKey || e.ctrlKey) { e.preventDefault(); b.bringToFront() }
          break
        case '[':
          if (e.metaKey || e.ctrlKey) { e.preventDefault(); b.sendToBack() }
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editingId, editingName])

  const sortedShapes = [...board.shapes].sort((a, b) => a.zIndex - b.zIndex)
  const editingShape = editingId ? board.shapes.find(s => s.id === editingId) : null

  const cursorMap: Record<ToolType, string> = {
    select: 'default',
    pan: drag.type === 'pan' ? 'grabbing' : 'grab',
    rect: 'crosshair',
    ellipse: 'crosshair',
    line: 'crosshair',
    freehand: 'crosshair',
    text: 'text',
    sticky: 'crosshair',
  }

  return (
    <div className="fixed inset-0" style={{ background: 'var(--paper-deep)' }}>
      {/* Top-left: back + board name */}
      <div className="fixed left-4 top-4 z-50 flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] text-sm text-[var(--muted)] backdrop-blur-xl hover:text-[var(--ink)]"
          title="Back to boards"
        >
          &larr;
        </button>
        {editingName ? (
          <input
            autoFocus
            defaultValue={boardName}
            onBlur={e => { onRename(e.currentTarget.value); setEditingName(false) }}
            onKeyDown={e => { if (e.key === 'Enter') { onRename(e.currentTarget.value); setEditingName(false) } if (e.key === 'Escape') setEditingName(false) }}
            className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] px-2.5 py-1.5 text-sm font-semibold text-[var(--ink)] outline-none backdrop-blur-xl focus:border-[var(--sky)]"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--line)]"
          >
            {boardName}
          </button>
        )}
        {board.dirty && (
          <span className="text-[0.6rem] text-[var(--muted)]">saving...</span>
        )}
      </div>

      <svg
        ref={svgRef}
        className="h-full w-full"
        style={{ cursor: cursorMap[board.activeTool] }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <defs>
          <pattern id="grid-small" width={20 * camera.zoom} height={20 * camera.zoom} patternUnits="userSpaceOnUse"
            x={(-camera.x * camera.zoom) % (20 * camera.zoom) + ''}
            y={(-camera.y * camera.zoom) % (20 * camera.zoom) + ''}>
            <circle cx={1} cy={1} r={0.5} fill="var(--line)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-small)" />

        <g transform={`translate(${svgRef.current ? svgRef.current.clientWidth / 2 : 0}, ${svgRef.current ? svgRef.current.clientHeight / 2 : 0}) scale(${camera.zoom}) translate(${-camera.x}, ${-camera.y})`}>
          {sortedShapes.map(shape => (
            <ShapeRenderer
              key={shape.id}
              shape={shape}
              selected={board.selectedIds.includes(shape.id)}
              onPointerDown={handleShapePointerDown}
              onDoubleClick={handleDoubleClick}
            />
          ))}

          {board.selectedIds.map(id => {
            const shape = board.shapes.find(s => s.id === id)
            if (!shape) return null
            return <SelectionHandles key={`handles-${id}`} shape={shape} onResizeStart={handleResizeStart} />
          })}

          {selectBox && (
            <rect
              x={selectBox.x}
              y={selectBox.y}
              width={selectBox.w}
              height={selectBox.h}
              fill="rgba(76, 151, 181, 0.08)"
              stroke="var(--sky)"
              strokeWidth={1}
              strokeDasharray="4 2"
            />
          )}
        </g>
      </svg>

      <Toolbar
        activeTool={board.activeTool}
        activeColor={board.activeColor}
        onToolChange={board.setActiveTool}
        onColorChange={board.setActiveColor}
        zoom={camera.zoom}
        onZoomIn={() => zoomBy(1.2)}
        onZoomOut={() => zoomBy(0.8)}
        onZoomReset={resetView}
      />

      {editingShape && ('text' in editingShape) && (
        <TextEditor
          shape={editingShape as Shape & { text: string }}
          camera={camera}
          svgRect={svgRef.current?.getBoundingClientRect() ?? null}
          onCommit={commitText}
          onCancel={() => setEditingId(null)}
        />
      )}

      <div className="fixed bottom-4 left-4 text-[0.6rem] text-[var(--muted)] opacity-60" style={{ zIndex: 50 }}>
        V select &middot; H pan &middot; R rect &middot; O ellipse &middot; L line &middot; P draw &middot; T text &middot; S sticky &middot; Cmd+Z undo &middot; Cmd+Shift+Z redo
      </div>
    </div>
  )
}
