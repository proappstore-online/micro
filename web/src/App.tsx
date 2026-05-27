import { useState, useCallback, useEffect, useRef } from 'react'
import { initPro } from '@proappstore/sdk'
import { useProAuth } from '@proappstore/sdk/hooks'
import { Canvas } from './components/Canvas.tsx'
import { BoardsList } from './components/BoardsList.tsx'
import { useBoardPersistence } from './hooks/useBoardPersistence.ts'
import type { Shape, Camera } from './types/canvas.ts'
import type { BoardData } from './types/board.ts'

const app = initPro({
  appId: 'micro',
  dataApiBase: 'https://pas-data-micro.serge-the-dev.workers.dev',
})

interface OpenBoard {
  id: string
  name: string
  data: BoardData
}

export default function App() {
  const { user, loading, signIn } = useProAuth(app)
  const persistence = useBoardPersistence(app)
  const [view, setView] = useState<'list' | 'canvas'>('list')
  const [openBoard, setOpenBoard] = useState<OpenBoard | null>(null)
  const openBoardRef = useRef(openBoard)
  openBoardRef.current = openBoard

  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#board/') && user) {
      const id = hash.slice(7)
      persistence.loadBoard(id).then(result => {
        if (result) {
          setOpenBoard({ id: result.board.id, name: result.board.name, data: result.data })
          setView('canvas')
        }
      })
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenBoard = useCallback(async (id: string) => {
    const result = await persistence.loadBoard(id)
    if (result) {
      setOpenBoard({ id: result.board.id, name: result.board.name, data: result.data })
      setView('canvas')
      window.location.hash = `board/${id}`
    }
  }, [persistence])

  const handleCreateBoard = useCallback(async (name: string): Promise<string> => {
    const { id, data } = await persistence.createBoard(name)
    setOpenBoard({ id, name, data })
    setView('canvas')
    window.location.hash = `board/${id}`
    return id
  }, [persistence])

  const handleBack = useCallback(() => {
    setView('list')
    setOpenBoard(null)
    window.location.hash = ''
  }, [])

  const handleSave = useCallback((shapes: Shape[], camera: Camera) => {
    const board = openBoardRef.current
    if (!board) return
    persistence.debouncedSave(board.id, shapes, camera)
  }, [persistence])

  const handleRename = useCallback(async (name: string) => {
    const board = openBoardRef.current
    if (!board) return
    await persistence.renameBoard(board.id, name)
    setOpenBoard(prev => prev ? { ...prev, name } : null)
  }, [persistence])

  const handleDeleteBoard = useCallback(async (id: string) => {
    await persistence.deleteBoard(id)
  }, [persistence])

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-[var(--muted)]">
        Loading...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-6">
        <div className="text-center">
          <h1 className="display-font text-4xl font-bold text-[var(--ink)]">Micro</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Collaborative whiteboard for teams
          </p>
          <button
            onClick={signIn}
            className="mt-8 rounded-2xl bg-[var(--ink)] px-8 py-3 text-sm font-semibold text-[var(--paper)] hover:opacity-90"
          >
            Sign in to start
          </button>
          <p className="mt-8 text-[0.65rem] uppercase tracking-[0.18em] text-[var(--muted)]">
            Part of{' '}
            <a href="https://proappstore.online" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--ink)]">
              ProAppStore
            </a>
          </p>
        </div>
      </div>
    )
  }

  if (view === 'canvas' && openBoard) {
    return (
      <Canvas
        key={openBoard.id}
        boardId={openBoard.id}
        boardName={openBoard.name}
        initialShapes={openBoard.data.shapes}
        initialCamera={openBoard.data.camera}
        onSave={handleSave}
        onRename={handleRename}
        onBack={handleBack}
      />
    )
  }

  return (
    <BoardsList
      listBoards={persistence.listBoards}
      onCreateBoard={handleCreateBoard}
      onOpenBoard={handleOpenBoard}
      onDeleteBoard={handleDeleteBoard}
      userName={user.login}
    />
  )
}
