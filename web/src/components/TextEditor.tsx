import { useRef, useEffect } from 'react'
import type { Shape } from '../types/canvas.ts'
import type { Camera } from '../types/canvas.ts'

interface Props {
  shape: Shape & { text: string }
  camera: Camera
  svgRect: DOMRect | null
  onCommit: (id: string, text: string) => void
  onCancel: () => void
}

export function TextEditor({ shape, camera, svgRect, onCommit, onCancel }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el) {
      el.focus()
      el.select()
    }
  }, [])

  if (!svgRect) return null

  const screenX = (shape.x - camera.x) * camera.zoom + svgRect.left + svgRect.width / 2
  const screenY = (shape.y - camera.y) * camera.zoom + svgRect.top + svgRect.height / 2

  return (
    <textarea
      ref={ref}
      defaultValue={shape.text}
      onBlur={e => onCommit(shape.id, e.currentTarget.value)}
      onKeyDown={e => {
        if (e.key === 'Escape') onCancel()
        if (e.key === 'Enter' && !e.shiftKey && shape.type === 'text') {
          e.preventDefault()
          onCommit(shape.id, e.currentTarget.value)
        }
      }}
      className="fixed border-2 border-[var(--sky)] bg-[var(--paper)] p-2 text-[var(--ink)] outline-none"
      style={{
        left: screenX,
        top: screenY,
        width: shape.width * camera.zoom,
        height: shape.type === 'sticky' ? shape.height * camera.zoom : undefined,
        minHeight: shape.type === 'text' ? 28 * camera.zoom : undefined,
        fontSize: (shape.type === 'text' || shape.type === 'sticky' ? shape.fontSize : 14) * camera.zoom,
        fontFamily: "'Manrope', sans-serif",
        resize: 'none',
        borderRadius: shape.type === 'sticky' ? 4 : 2,
        zIndex: 100,
      }}
    />
  )
}
