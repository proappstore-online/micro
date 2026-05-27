import { useState, useEffect, useCallback } from 'react'
import type { Board } from '../types/board.ts'

interface Props {
  listBoards: () => Promise<Board[]>
  onCreateBoard: (name: string) => Promise<string>
  onOpenBoard: (id: string) => void
  onDeleteBoard: (id: string) => Promise<void>
  userName: string
}

export function BoardsList({ listBoards, onCreateBoard, onOpenBoard, onDeleteBoard, userName }: Props) {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await listBoards()
      setBoards(list)
    } catch (e) {
      console.error('Failed to load boards', e)
      setError('Failed to load boards. Please try again.')
    }
    setLoading(false)
  }, [listBoards])

  useEffect(() => { refresh() }, [refresh])

  const handleCreate = async () => {
    setCreating(true)
    setError(null)
    try {
      await onCreateBoard('Untitled board')
    } catch (e) {
      console.error('Failed to create board', e)
      setError('Failed to create board. Please try again.')
      setCreating(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await onDeleteBoard(id)
    setBoards(prev => prev.filter(b => b.id !== id))
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60_000) return 'Just now'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
    if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="min-h-[100dvh] px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 text-xs text-[var(--muted)]">
          Signed in as <strong className="text-[var(--ink)]">{userName}</strong>
        </div>
        <div className="flex items-end justify-between">
          <h1 className="display-font text-3xl font-bold text-[var(--ink)]">Your boards</h1>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="rounded-2xl bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-[var(--paper)] hover:opacity-90 disabled:opacity-50"
          >
            {creating ? 'Creating...' : '+ New board'}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-[var(--error)] bg-[color-mix(in_srgb,var(--error)_8%,transparent)] px-4 py-3 text-sm text-[var(--error)]">
            {error}
            <button onClick={refresh} className="ml-2 underline">Retry</button>
          </div>
        )}

        <div className="mt-8">
          {loading ? (
            <div className="py-20 text-center text-sm text-[var(--muted)]">Loading boards...</div>
          ) : boards.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg text-[var(--muted)]">No boards yet</p>
              <p className="mt-2 text-sm text-[var(--muted)]">Create your first board to get started</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {boards.map(b => (
                <button
                  key={b.id}
                  onClick={() => onOpenBoard(b.id)}
                  className="group relative rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] p-5 text-left transition-all hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-card)]"
                >
                  <div className="mb-8 h-24 rounded-xl bg-[var(--paper-deep)]" />
                  <div className="text-sm font-semibold text-[var(--ink)]">{b.name}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    Edited {formatDate(b.updated_at)}
                  </div>
                  <button
                    onClick={e => handleDelete(e, b.id)}
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-xs text-[var(--muted)] opacity-0 transition-opacity hover:bg-[var(--line)] hover:text-[var(--error)] group-hover:opacity-100"
                    title="Delete board"
                  >
                    x
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="mt-12 text-center text-[0.65rem] uppercase tracking-[0.18em] text-[var(--muted)]">
          Part of{' '}
          <a href="https://proappstore.online" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--ink)]">
            ProAppStore
          </a>
        </p>
      </div>
    </div>
  )
}
