import type { ToolType } from '../types/canvas.ts'
import { SHAPE_COLORS } from '../types/canvas.ts'

interface Props {
  activeTool: ToolType
  activeColor: string
  onToolChange: (tool: ToolType) => void
  onColorChange: (color: string) => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
}

const tools: { type: ToolType; label: string; icon: string }[] = [
  { type: 'select', label: 'Select', icon: '↖' },
  { type: 'pan', label: 'Pan', icon: '✋' },
  { type: 'rect', label: 'Rectangle', icon: '▢' },
  { type: 'ellipse', label: 'Ellipse', icon: '◯' },
  { type: 'line', label: 'Line', icon: '╱' },
  { type: 'freehand', label: 'Draw', icon: '✎' },
  { type: 'text', label: 'Text', icon: 'T' },
  { type: 'sticky', label: 'Sticky', icon: '▧' },
]

export function Toolbar({ activeTool, activeColor, onToolChange, onColorChange, zoom, onZoomIn, onZoomOut, onZoomReset }: Props) {
  return (
    <>
      {/* Main toolbar */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] px-2 py-1.5 backdrop-blur-xl" style={{ zIndex: 50 }}>
        {tools.map(t => (
          <button
            key={t.type}
            onClick={() => onToolChange(t.type)}
            title={t.label}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-base transition-colors"
            style={{
              background: activeTool === t.type ? 'var(--ink)' : 'transparent',
              color: activeTool === t.type ? 'var(--paper)' : 'var(--muted)',
            }}
          >
            {t.icon}
          </button>
        ))}

        <div className="mx-1 h-6 w-px bg-[var(--line)]" />

        {/* Color swatches */}
        <div className="flex items-center gap-0.5">
          {SHAPE_COLORS.map(c => (
            <button
              key={c}
              onClick={() => onColorChange(c)}
              className="h-5 w-5 rounded-full border transition-transform"
              style={{
                background: c,
                borderColor: activeColor === c ? 'var(--sky)' : c === '#ffffff' ? 'var(--line-strong)' : c,
                transform: activeColor === c ? 'scale(1.25)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="fixed bottom-4 right-4 flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] px-1.5 py-1 backdrop-blur-xl" style={{ zIndex: 50 }}>
        <button onClick={onZoomOut} className="flex h-7 w-7 items-center justify-center rounded-lg text-sm text-[var(--muted)] hover:text-[var(--ink)]">
          −
        </button>
        <button onClick={onZoomReset} className="min-w-[3rem] text-center text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)]">
          {Math.round(zoom * 100)}%
        </button>
        <button onClick={onZoomIn} className="flex h-7 w-7 items-center justify-center rounded-lg text-sm text-[var(--muted)] hover:text-[var(--ink)]">
          +
        </button>
      </div>
    </>
  )
}
