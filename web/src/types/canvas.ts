export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export type ShapeType = 'rect' | 'ellipse' | 'text' | 'sticky' | 'line' | 'arrow' | 'freehand'

export type ToolType = 'select' | 'pan' | ShapeType

export interface BaseShape {
  id: string
  type: ShapeType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  fill: string
  stroke: string
  strokeWidth: number
  opacity: number
  zIndex: number
}

export interface RectShape extends BaseShape {
  type: 'rect'
  cornerRadius: number
}

export interface EllipseShape extends BaseShape {
  type: 'ellipse'
}

export interface TextShape extends BaseShape {
  type: 'text'
  text: string
  fontSize: number
  fontWeight: number
  textAlign: 'left' | 'center' | 'right'
}

export interface StickyShape extends BaseShape {
  type: 'sticky'
  text: string
  fontSize: number
}

export interface LineShape extends BaseShape {
  type: 'line'
  points: Point[]
}

export interface ArrowShape extends BaseShape {
  type: 'arrow'
  points: Point[]
}

export interface FreehandShape extends BaseShape {
  type: 'freehand'
  points: Point[]
}

export type Shape = RectShape | EllipseShape | TextShape | StickyShape | LineShape | ArrowShape | FreehandShape

export interface Camera {
  x: number
  y: number
  zoom: number
}

export interface BoardState {
  shapes: Shape[]
  camera: Camera
  selectedIds: string[]
  activeTool: ToolType
  activeColor: string
}

export const STICKY_COLORS = [
  '#fef08a', // yellow
  '#bbf7d0', // green
  '#bfdbfe', // blue
  '#fecaca', // red
  '#e9d5ff', // purple
  '#fed7aa', // orange
]

export const SHAPE_COLORS = [
  '#111111',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#ffffff',
]

export interface SnapGuide {
  axis: 'x' | 'y'
  pos: number
  from: number
  to: number
}

export interface SnapResult {
  adjX: number
  adjY: number
  guides: SnapGuide[]
}

export function computeSnap(moving: Bounds, others: Bounds[], threshold: number): SnapResult {
  const myXs = [moving.x, moving.x + moving.width / 2, moving.x + moving.width]
  const myYs = [moving.y, moving.y + moving.height / 2, moving.y + moving.height]

  let bestX: { dist: number; adj: number; target: number; other: Bounds } | null = null
  let bestY: { dist: number; adj: number; target: number; other: Bounds } | null = null

  for (const o of others) {
    const oXs = [o.x, o.x + o.width / 2, o.x + o.width]
    const oYs = [o.y, o.y + o.height / 2, o.y + o.height]
    for (const my of myXs) for (const t of oXs) {
      const d = Math.abs(my - t)
      if (d <= threshold && (!bestX || d < bestX.dist)) bestX = { dist: d, adj: t - my, target: t, other: o }
    }
    for (const my of myYs) for (const t of oYs) {
      const d = Math.abs(my - t)
      if (d <= threshold && (!bestY || d < bestY.dist)) bestY = { dist: d, adj: t - my, target: t, other: o }
    }
  }

  const adjX = bestX?.adj ?? 0
  const adjY = bestY?.adj ?? 0
  const guides: SnapGuide[] = []
  if (bestX) {
    const movedTop = moving.y + adjY
    const movedBot = movedTop + moving.height
    guides.push({
      axis: 'x',
      pos: bestX.target,
      from: Math.min(movedTop, bestX.other.y),
      to: Math.max(movedBot, bestX.other.y + bestX.other.height),
    })
  }
  if (bestY) {
    const movedLeft = moving.x + adjX
    const movedRight = movedLeft + moving.width
    guides.push({
      axis: 'y',
      pos: bestY.target,
      from: Math.min(movedLeft, bestY.other.x),
      to: Math.max(movedRight, bestY.other.x + bestY.other.width),
    })
  }
  return { adjX, adjY, guides }
}

export function createShape(type: ShapeType, x: number, y: number): Shape {
  const base: BaseShape = {
    id: crypto.randomUUID(),
    type,
    x,
    y,
    width: 0,
    height: 0,
    rotation: 0,
    fill: 'transparent',
    stroke: '#111111',
    strokeWidth: 2,
    opacity: 1,
    zIndex: Date.now(),
  }

  switch (type) {
    case 'rect':
      return { ...base, type: 'rect', fill: 'transparent', cornerRadius: 8 }
    case 'ellipse':
      return { ...base, type: 'ellipse', fill: 'transparent' }
    case 'text':
      return { ...base, type: 'text', text: '', fontSize: 16, fontWeight: 400, textAlign: 'left', fill: '#111111', stroke: 'none', width: 200, height: 28 }
    case 'sticky':
      return { ...base, type: 'sticky', text: '', fontSize: 14, fill: '#fef08a', stroke: 'none', width: 200, height: 200 }
    case 'line':
      return { ...base, type: 'line', points: [], fill: 'none' }
    case 'arrow':
      return { ...base, type: 'arrow', points: [], fill: 'none' }
    case 'freehand':
      return { ...base, type: 'freehand', points: [], fill: 'none' }
  }
}
