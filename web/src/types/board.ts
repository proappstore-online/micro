import type { Shape, Camera } from './canvas.ts'

export interface Board {
  id: string
  name: string
  created_at: number
  updated_at: number
}

export interface BoardData {
  shapes: Shape[]
  camera: Camera
}

export const MIGRATIONS = [
  {
    name: '0001_boards',
    sql: `CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      data TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
  },
]
