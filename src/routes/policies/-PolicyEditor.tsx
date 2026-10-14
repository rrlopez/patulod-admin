import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { prismaQuery } from '../../lib/prisma-client'

interface PolicyDetail {
  id: string
  type: string
  version: string
  content: string
  effectiveDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const TYPE_LABEL: Record<string, string> = {
  TERMS:   'Terms of Service',
  PRIVACY: 'Privacy Policy',
  SAFETY:  'Safety Guidelines',
}

interface PolicyEditorProps {
  policyId: string
}

export function PolicyEditor({ policyId }: PolicyEditorProps) {
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const { data: policy, isLoading, isError } = useQuery<PolicyDetail>({
    queryKey: ['policies', policyId],
    queryFn: () =>
      prismaQuery<PolicyDetail>({
        model: 'policyContent',
        operation: 'findUnique',
        args: { where: { id: policyId } },
      }),
    staleTime: 60_000,
  })

  // Sync editor when policy loads or selection changes
  useEffect(() => {
    if (policy) setContent(policy.content)
  }, [policy?.id, policy?.content])

  const saveMutation = useMutation({
    mutationFn: () =>
      prismaQuery({
        model: 'policyContent',
        operation: 'update',
        args: {
          where: { id: policyId },
          data: { content },
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies', policyId] })
      queryClient.invalidateQueries({ queryKey: ['policies', 'list'] })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
  })

  const publishMutation = useMutation({
    mutationFn: () =>
      prismaQuery({
        model: 'policyContent',
        operation: 'update',
        args: {
          where: { id: policyId },
          data: {
            content,
            isActive: true,
            effectiveDate: new Date().toISOString(),
          },
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
  })

  if (isLoading) {
    return (
      <div className="card bg-base-200 border border-base-300 shadow-sm">
        <div className="card-body space-y-3">
          <div className="h-5 skeleton rounded w-1/3" />
          <div className="h-3 skeleton rounded w-1/2" />
          <div className="h-96 skeleton rounded" />
        </div>
      </div>
    )
  }

  if (isError || !policy) {
    return (
      <div className="card bg-base-200 border border-base-300 shadow-sm">
        <div className="card-body">
          <div className="alert alert-error"><span>Failed to load policy.</span></div>
        </div>
      </div>
    )
  }

  const isPending = saveMutation.isPending || publishMutation.isPending
  const hasError = saveMutation.isError || publishMutation.isError

  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm">
      <div className="card-body">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-primary">
              {TYPE_LABEL[policy.type] ?? policy.type}
            </h2>
            <div className="flex gap-2 mt-1 text-xs text-base-content/60 flex-wrap">
              <span>Version {policy.version}</span>
              <span>·</span>
              <span>Effective: {new Date(policy.effectiveDate).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}</span>
              <span>·</span>
              <span>Updated: {new Date(policy.updatedAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}</span>
            </div>
          </div>
          <span className={`badge ${policy.isActive ? 'badge-success' : 'badge-ghost'}`}>
            {policy.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {saveSuccess && (
          <div className="alert alert-success py-2 text-xs mb-3">Changes saved successfully.</div>
        )}
        {hasError && (
          <div className="alert alert-error py-2 text-xs mb-3">Failed to save. Please try again.</div>
        )}

        {/* Type (read-only) */}
        <div className="form-control mb-3">
          <label className="label py-1">
            <span className="label-text">Policy Type</span>
          </label>
          <input
            type="text"
            value={policy.type}
            className="input input-bordered input-sm bg-base-300 cursor-not-allowed"
            disabled
          />
        </div>

        {/* Content editor */}
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text">Content</span>
            <span className="label-text-alt text-base-content/40">Markdown supported</span>
          </label>
          <textarea
            className="textarea textarea-bordered h-96 font-mono text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isPending}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-base-300">
          <button
            className="btn btn-primary btn-sm"
            disabled={isPending || content === policy.content}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending && <span className="loading loading-spinner loading-xs" />}
            Save Draft
          </button>
          <button
            className="btn btn-success btn-sm"
            disabled={isPending}
            onClick={() => publishMutation.mutate()}
          >
            {publishMutation.isPending && <span className="loading loading-spinner loading-xs" />}
            Save & Publish
          </button>
          <button
            className="btn btn-ghost btn-sm"
            disabled={isPending || content === policy.content}
            onClick={() => setContent(policy.content)}
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  )
}
