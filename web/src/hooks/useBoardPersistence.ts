import { useCallback, useRef, useEffect } from 'react'
import type { Shape, Camera } from '../types/canvas.ts'
import type { Board, BoardData } from '../types/board.ts'
import { MIGRATIONS } from '../types/board.ts'

interface ProApp {
  db: {
    migrate: (migrations: { name: string; sql: string }[]) => Promise<unknown>
    query: <T>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>
    execute: (sql: string, params?: unknown[]) => Promise<{ meta: { changes: number } }>
  }
}

let migrated = false
let migratePromise: Promise<void> | null = null

async function ensureMigrated(app: ProApp) {
  if (migrated) return
  if (migratePromise) return migratePromise
  migratePromise = app.db.migrate(MIGRATIONS).then(() => { migrated = true }).finally(() => { migratePromise = null })
  return migratePromise
}

export function useBoardPersistence(app: ProApp) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lastSaved = useRef<string>('')

  const listBoards = useCallback(async (): Promise<Board[]> => {
    await ensureMigrated(app)
    const { rows } = await app.db.query<Board>('SELECT id, name, created_at, updated_at FROM boards ORDER BY updated_at DESC')
    return rows
  }, [app])

  const loadBoard = useCallback(async (id: string): Promise<{ board: Board; data: BoardData } | null> => {
    await ensureMigrated(app)
    const { rows } = await app.db.query<Board & { data: string }>('SELECT * FROM boards WHERE id = ?', [id])
    if (rows.length === 0) return null
    const row = rows[0]
    const data: BoardData = JSON.parse(row.data)
    return {
      board: { id: row.id, name: row.name, created_at: row.created_at, updated_at: row.updated_at },
      data,
    }
  }, [app])

  const createBoard = useCallback(async (name: string): Promise<{ id: string; data: BoardData }> => {
    await ensureMigrated(app)
    const id = crypto.randomUUID()
    const now = Date.now()
    const data: BoardData = { shapes: [], camera: { x: 0, y: 0, zoom: 1 } }
    await app.db.execute(
      'INSERT INTO boards (id, name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, name, JSON.stringify(data), now, now],
    )
    return { id, data }
  }, [app])

  const saveBoard = useCallback(async (id: string, shapes: Shape[], camera: Camera) => {
    const data: BoardData = { shapes, camera }
    const json = JSON.stringify(data)
    if (json === lastSaved.current) return
    lastSaved.current = json
    try {
      await app.db.execute(
        'UPDATE boards SET data = ?, updated_at = ? WHERE id = ?',
        [json, Date.now(), id],
      )
    } catch (e) {
      lastSaved.current = ''
      throw e
    }
  }, [app])

  const renameBoard = useCallback(async (id: string, name: string) => {
    await app.db.execute(
      'UPDATE boards SET name = ?, updated_at = ? WHERE id = ?',
      [name, Date.now(), id],
    )
  }, [app])

  const deleteBoard = useCallback(async (id: string) => {
    await app.db.execute('DELETE FROM boards WHERE id = ?', [id])
  }, [app])

  const debouncedSave = useCallback((id: string, shapes: Shape[], camera: Camera) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveBoard(id, shapes, camera).catch(console.error)
    }, 1500)
  }, [saveBoard])

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  return { listBoards, loadBoard, createBoard, saveBoard, renameBoard, deleteBoard, debouncedSave }
}
