import { useState, useCallback, type RefObject } from 'react'
import type { Camera, Point } from '../types/canvas.ts'

const MIN_ZOOM = 0.1
const MAX_ZOOM = 5

export function useCamera(svgRef: RefObject<SVGSVGElement | null>) {
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 })

  const screenToCanvas = useCallback((screenX: number, screenY: number): Point => {
    const svg = svgRef.current
    if (!svg) return { x: screenX, y: screenY }
    const rect = svg.getBoundingClientRect()
    return {
      x: (screenX - rect.left - rect.width / 2) / camera.zoom + camera.x,
      y: (screenY - rect.top - rect.height / 2) / camera.zoom + camera.y,
    }
  }, [camera, svgRef])

  const pan = useCallback((dx: number, dy: number) => {
    setCamera(c => ({ ...c, x: c.x - dx / c.zoom, y: c.y - dy / c.zoom }))
  }, [])

  const zoomTo = useCallback((newZoom: number, focusX?: number, focusY?: number) => {
    setCamera(c => {
      const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom))
      if (focusX !== undefined && focusY !== undefined) {
        const svg = svgRef.current
        if (svg) {
          const rect = svg.getBoundingClientRect()
          const wx = (focusX - rect.left - rect.width / 2) / c.zoom + c.x
          const wy = (focusY - rect.top - rect.height / 2) / c.zoom + c.y
          return {
            x: wx - (focusX - rect.left - rect.width / 2) / z,
            y: wy - (focusY - rect.top - rect.height / 2) / z,
            zoom: z,
          }
        }
      }
      return { ...c, zoom: z }
    })
  }, [svgRef])

  const zoomBy = useCallback((factor: number, focusX?: number, focusY?: number) => {
    setCamera(c => {
      const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, c.zoom * factor))
      if (focusX !== undefined && focusY !== undefined) {
        const svg = svgRef.current
        if (svg) {
          const rect = svg.getBoundingClientRect()
          const wx = (focusX - rect.left - rect.width / 2) / c.zoom + c.x
          const wy = (focusY - rect.top - rect.height / 2) / c.zoom + c.y
          return {
            x: wx - (focusX - rect.left - rect.width / 2) / z,
            y: wy - (focusY - rect.top - rect.height / 2) / z,
            zoom: z,
          }
        }
      }
      return { ...c, zoom: z }
    })
  }, [svgRef])

  const resetView = useCallback(() => {
    setCamera({ x: 0, y: 0, zoom: 1 })
  }, [])

  return { camera, screenToCanvas, pan, zoomTo, zoomBy, resetView, setCamera }
}
