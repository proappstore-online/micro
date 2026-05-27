import type { Shape, Point } from '../types/canvas.ts'

interface Props {
  shape: Shape
  onResizeStart: (e: React.PointerEvent, shape: Shape, handle: string) => void
}

const HANDLE_SIZE = 8

export function SelectionHandles({ shape, onResizeStart }: Props) {
  if (shape.type === 'line' || shape.type === 'freehand') return null

  const handles: { pos: Point; cursor: string; name: string }[] = [
    { pos: { x: 0, y: 0 }, cursor: 'nwse-resize', name: 'tl' },
    { pos: { x: shape.width, y: 0 }, cursor: 'nesw-resize', name: 'tr' },
    { pos: { x: shape.width, y: shape.height }, cursor: 'nwse-resize', name: 'br' },
    { pos: { x: 0, y: shape.height }, cursor: 'nesw-resize', name: 'bl' },
    { pos: { x: shape.width / 2, y: 0 }, cursor: 'ns-resize', name: 'tc' },
    { pos: { x: shape.width, y: shape.height / 2 }, cursor: 'ew-resize', name: 'rc' },
    { pos: { x: shape.width / 2, y: shape.height }, cursor: 'ns-resize', name: 'bc' },
    { pos: { x: 0, y: shape.height / 2 }, cursor: 'ew-resize', name: 'lc' },
  ]

  return (
    <g transform={`translate(${shape.x}, ${shape.y}) rotate(${shape.rotation})`} pointerEvents="all">
      {handles.map(h => (
        <rect
          key={h.name}
          x={h.pos.x - HANDLE_SIZE / 2}
          y={h.pos.y - HANDLE_SIZE / 2}
          width={HANDLE_SIZE}
          height={HANDLE_SIZE}
          rx={2}
          fill="white"
          stroke="var(--sky)"
          strokeWidth={1.5}
          style={{ cursor: h.cursor }}
          onPointerDown={e => {
            e.stopPropagation()
            onResizeStart(e, shape, h.name)
          }}
        />
      ))}
    </g>
  )
}
