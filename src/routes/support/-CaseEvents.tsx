import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../../lib/auth-client'
import { prismaQuery } from '../../lib/prisma-client'

interface CaseEvent {
  id: string
  actorId: string | null
  action: string
  note: string | null
  timestamp: string
}

const ACTION_LABEL: Record<string, string> = {
  NOTE_ADDED:      'Note added',
  STATUS_CHANGED:  'Status changed',
  ASSIGNED:        'Assigned',
  REOPENED:        'Reopened',
  RESOLVED:        'Resolved',
  CLOSED:          'Closed',
}

export function CaseEvents({ caseId }: { caseId: string }) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [noteText, setNoteText] = useState('')
  const [isInternal, setIsInternal] = useState(false)

  const { data: events, isLoading, isError } = useQuery<CaseEvent[]>({
    queryKey: ['support', caseId, 'events'],
    queryFn: () =>
      prismaQuery<CaseEvent[]>({
        model: 'supportCaseEvent',
        operation: 'findMany',
        args: {
          where: { caseId },
          orderBy: { timestamp: 'asc' },
          select: { id: true, actorId: true, action: true, note: true, timestamp: true },
        },
      }),
    staleTime: 30_000,
  })

  const addNoteMutation = useMutation({
    mutationFn: (note: string) =>
      prismaQuery({
        model: 'supportCaseEvent',
        operation: 'create',
        args: {
          data: {
            caseId,
            actorId: session?.user?.id ?? null,
            action: 'NOTE_ADDED',
            note: isInternal ? `[Internal] ${note}` : note,
          },
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', caseId, 'events'] })
      setNoteText('')
      setIsInternal(false)
    },
  })

  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm">
      <div className="card-body">
        <h2 className="card-title text-primary mb-2">Notes & Updates</h2>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 bg-base-100 rounded-lg space-y-1">
                <div className="h-3 skeleton rounded w-1/3" />
                <div className="h-3 skeleton rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <p className="text-xs text-error/70">Failed to load events.</p>
        )}

        {!isLoading && events?.length === 0 && (
          <p className="text-xs text-base-content/50 py-3 text-center">No notes yet.</p>
        )}

        {!isLoading && events && events.length > 0 && (
          <div className="space-y-2 mb-4">
            {events.map((e) => {
              const internal = e.note?.startsWith('[Internal]')
              const noteContent = internal ? e.note?.replace('[Internal] ', '') : e.note
              return (
                <div
                  key={e.id}
                  className={`p-3 rounded-lg border ${
                    internal ? 'bg-warning/10 border-warning/20' : 'bg-base-100 border-base-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-base-content">
                      {ACTION_LABEL[e.action] ?? e.action.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      {internal && <span className="badge badge-xs badge-warning">Internal</span>}
                      <span className="text-xs text-base-content/40">
                        {new Date(e.timestamp).toLocaleString('en-US', {
                          month: 'short', day: 'numeric',
                          hour: 'numeric', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  {noteContent && <p className="text-sm text-base-content/80">{noteContent}</p>}
                </div>
              )
            })}
          </div>
        )}

        {/* Add note form */}
        <div className="pt-3 border-t border-base-300">
          <textarea
            className="textarea textarea-bordered w-full text-sm"
            placeholder="Add a note…"
            rows={3}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-warning checkbox-sm"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
              />
              <span className="text-xs text-base-content/60">Mark as internal note</span>
            </label>
            <button
              className="btn btn-primary btn-sm"
              disabled={!noteText.trim() || addNoteMutation.isPending}
              onClick={() => addNoteMutation.mutate(noteText.trim())}
            >
              {addNoteMutation.isPending && <span className="loading loading-spinner loading-xs" />}
              Add Note
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
