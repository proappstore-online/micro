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

export type ShapeType = 'rect' | 'ellipse' | 'text' | 'sticky' | 'line' | 'freehand'

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

export interface FreehandShape extends BaseShape {
  type: 'freehand'
  points: Point[]
}

export type Shape = RectShape | EllipseShape | TextShape | StickyShape | LineShape | FreehandShape

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
    case 'freehand':
      return { ...base, type: 'freehand', points: [], fill: 'none' }
  }
}
