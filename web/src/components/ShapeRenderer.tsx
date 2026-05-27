import type { Shape } from '../types/canvas.ts'

interface Props {
  shape: Shape
  selected: boolean
  onPointerDown: (e: React.PointerEvent, id: string) => void
  onDoubleClick: (id: string) => void
}

export function ShapeRenderer({ shape, selected, onPointerDown, onDoubleClick }: Props) {
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    onPointerDown(e, shape.id)
  }

  const selectionStroke = selected ? 'var(--sky)' : 'none'
  const selectionWidth = selected ? 2 / 1 : 0

  switch (shape.type) {
    case 'rect':
      return (
        <g
          transform={`translate(${shape.x}, ${shape.y}) rotate(${shape.rotation})`}
          style={{ opacity: shape.opacity, cursor: 'move' }}
          onPointerDown={handlePointerDown}
          onDoubleClick={() => onDoubleClick(shape.id)}
        >
          <rect
            width={shape.width}
            height={shape.height}
            rx={shape.cornerRadius}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
          />
          {selected && (
            <rect
              x={-3}
              y={-3}
              width={shape.width + 6}
              height={shape.height + 6}
              rx={shape.cornerRadius + 2}
              fill="none"
              stroke={selectionStroke}
              strokeWidth={selectionWidth}
              strokeDasharray="6 3"
              pointerEvents="none"
            />
          )}
        </g>
      )

    case 'ellipse':
      return (
        <g
          transform={`translate(${shape.x}, ${shape.y}) rotate(${shape.rotation})`}
          style={{ opacity: shape.opacity, cursor: 'move' }}
          onPointerDown={handlePointerDown}
          onDoubleClick={() => onDoubleClick(shape.id)}
        >
          <ellipse
            cx={shape.width / 2}
            cy={shape.height / 2}
            rx={shape.width / 2}
            ry={shape.height / 2}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
          />
          {selected && (
            <rect
              x={-3}
              y={-3}
              width={shape.width + 6}
              height={shape.height + 6}
              fill="none"
              stroke={selectionStroke}
              strokeWidth={selectionWidth}
              strokeDasharray="6 3"
              pointerEvents="none"
            />
          )}
        </g>
      )

    case 'text':
      return (
        <g
          transform={`translate(${shape.x}, ${shape.y}) rotate(${shape.rotation})`}
          style={{ opacity: shape.opacity, cursor: 'move' }}
          onPointerDown={handlePointerDown}
          onDoubleClick={() => onDoubleClick(shape.id)}
        >
          <rect width={shape.width} height={shape.height} fill="transparent" />
          <text
            x={shape.textAlign === 'center' ? shape.width / 2 : shape.textAlign === 'right' ? shape.width : 0}
            y={shape.fontSize}
            fontSize={shape.fontSize}
            fontWeight={shape.fontWeight}
            textAnchor={shape.textAlign === 'center' ? 'middle' : shape.textAlign === 'right' ? 'end' : 'start'}
            fill={shape.fill}
            fontFamily="'Manrope', sans-serif"
            style={{ userSelect: 'none' }}
          >
            {shape.text || 'Text'}
          </text>
          {selected && (
            <rect
              x={-3}
              y={-3}
              width={shape.width + 6}
              height={shape.height + 6}
              fill="none"
              stroke={selectionStroke}
              strokeWidth={selectionWidth}
              strokeDasharray="6 3"
              pointerEvents="none"
            />
          )}
        </g>
      )

    case 'sticky':
      return (
        <g
          transform={`translate(${shape.x}, ${shape.y}) rotate(${shape.rotation})`}
          style={{ opacity: shape.opacity, cursor: 'move' }}
          onPointerDown={handlePointerDown}
          onDoubleClick={() => onDoubleClick(shape.id)}
        >
          <rect
            width={shape.width}
            height={shape.height}
            rx={4}
            fill={shape.fill}
            stroke="rgba(0,0,0,0.08)"
            strokeWidth={1}
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
          />
          <foreignObject x={12} y={12} width={shape.width - 24} height={shape.height - 24}>
            <div
              style={{
                fontSize: shape.fontSize,
                fontFamily: "'Manrope', sans-serif",
                color: '#111',
                wordBreak: 'break-word',
                overflow: 'hidden',
                height: '100%',
              }}
            >
              {shape.text || 'Double-click to edit'}
            </div>
          </foreignObject>
          {selected && (
            <rect
              x={-3}
              y={-3}
              width={shape.width + 6}
              height={shape.height + 6}
              rx={6}
              fill="none"
              stroke={selectionStroke}
              strokeWidth={selectionWidth}
              strokeDasharray="6 3"
              pointerEvents="none"
            />
          )}
        </g>
      )

    case 'line': {
      if (shape.points.length < 2) return null
      const d = `M ${shape.points.map(p => `${p.x} ${p.y}`).join(' L ')}`
      return (
        <g
          style={{ opacity: shape.opacity, cursor: 'move' }}
          onPointerDown={handlePointerDown}
        >
          <path d={d} fill="none" stroke="transparent" strokeWidth={12} />
          <path d={d} fill="none" stroke={shape.stroke} strokeWidth={shape.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          {selected && (
            <path d={d} fill="none" stroke={selectionStroke} strokeWidth={selectionWidth} strokeDasharray="6 3" pointerEvents="none" />
          )}
        </g>
      )
    }

    case 'arrow': {
      if (shape.points.length < 2) return null
      const markerId = `arrowhead-${shape.id}`
      const d = `M ${shape.points.map(p => `${p.x} ${p.y}`).join(' L ')}`
      return (
        <g
          style={{ opacity: shape.opacity, cursor: 'move' }}
          onPointerDown={handlePointerDown}
        >
          <defs>
            <marker
              id={markerId}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={shape.stroke} />
            </marker>
          </defs>
          <path d={d} fill="none" stroke="transparent" strokeWidth={12} />
          <path
            d={d}
            fill="none"
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            markerEnd={`url(#${markerId})`}
          />
          {selected && (
            <path d={d} fill="none" stroke={selectionStroke} strokeWidth={selectionWidth} strokeDasharray="6 3" pointerEvents="none" />
          )}
        </g>
      )
    }

    case 'freehand': {
      if (shape.points.length < 2) return null
      const pts = shape.points
      let d = `M ${pts[0].x} ${pts[0].y}`
      for (let i = 1; i < pts.length; i++) {
        const mid = {
          x: (pts[i - 1].x + pts[i].x) / 2,
          y: (pts[i - 1].y + pts[i].y) / 2,
        }
        d += ` Q ${pts[i - 1].x} ${pts[i - 1].y} ${mid.x} ${mid.y}`
      }
      d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`
      return (
        <g
          style={{ opacity: shape.opacity, cursor: 'move' }}
          onPointerDown={handlePointerDown}
        >
          <path d={d} fill="none" stroke="transparent" strokeWidth={12} />
          <path d={d} fill="none" stroke={shape.stroke} strokeWidth={shape.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          {selected && (
            <path d={d} fill="none" stroke={selectionStroke} strokeWidth={selectionWidth} strokeDasharray="6 3" pointerEvents="none" />
          )}
        </g>
      )
    }
  }
}
