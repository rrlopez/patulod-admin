import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { prismaQuery } from '../../lib/prisma-client'

interface DriverDocument {
  id: string
  type: string
  reviewStatus: string
  uploadedAt: string
  // base64 data (current compromise — Phase 5 will migrate to Supabase Storage)
  fileData: string | null
  fileName: string | null
  mimeType: string | null
}

const REVIEW_BADGE: Record<string, string> = {
  PENDING:  'badge-warning',
  APPROVED: 'badge-success',
  REJECTED: 'badge-error',
}

export function ApplicationDocuments({ applicationId }: { applicationId: string }) {
  const [previewDoc, setPreviewDoc] = useState<DriverDocument | null>(null)

  const { data: docs, isLoading, isError } = useQuery<DriverDocument[]>({
    queryKey: ['driver', applicationId, 'documents'],
    queryFn: () =>
      prismaQuery<DriverDocument[]>({
        model: 'driverDocument',
        operation: 'findMany',
        args: {
          where: { applicationId },
          orderBy: { uploadedAt: 'asc' },
          select: {
            id: true,
            type: true,
            reviewStatus: true,
            uploadedAt: true,
            fileData: true,
            fileName: true,
            mimeType: true,
          },
        },
      }),
    staleTime: 30_000,
  })

  return (
    <>
      <div className="card bg-base-200 border border-base-300 shadow-sm">
        <div className="card-body p-3">
          <h2 className="font-bold text-primary mb-3">Submitted Documents</h2>

          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 skeleton rounded-lg" />
              ))}
            </div>
          )}

          {isError && (
            <p className="text-xs text-error/70">Failed to load documents.</p>
          )}

          {!isLoading && docs?.length === 0 && (
            <p className="text-xs text-base-content/50 py-4 text-center">
              No documents submitted yet.
            </p>
          )}

          {!isLoading && docs && docs.length > 0 && (
            <div className="space-y-2">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-base-100 border border-base-300"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-base-content">
                      {doc.type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-base-content/50">
                      {doc.fileName ?? 'Unnamed file'} •{' '}
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`badge badge-xs ${REVIEW_BADGE[doc.reviewStatus] ?? 'badge-ghost'}`}>
                    {doc.reviewStatus}
                  </span>
                  {doc.fileData && (
                    <button
                      className="btn btn-xs btn-primary btn-outline"
                      onClick={() => setPreviewDoc(doc)}
                    >
                      View
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document preview modal */}
      {previewDoc && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-primary mb-3">
              {previewDoc.type.replace(/_/g, ' ')}
            </h3>
            {previewDoc.mimeType?.startsWith('image/') ? (
              <img
                src={`data:${previewDoc.mimeType};base64,${previewDoc.fileData}`}
                alt={previewDoc.type}
                className="w-full rounded-lg border border-base-300"
              />
            ) : previewDoc.mimeType === 'application/pdf' ? (
              <iframe
                src={`data:application/pdf;base64,${previewDoc.fileData}`}
                className="w-full h-96 rounded-lg border border-base-300"
                title={previewDoc.type}
              />
            ) : (
              <p className="text-sm text-base-content/60">
                Preview not available for this file type.
              </p>
            )}
            <div className="modal-action">
              <button className="btn btn-sm" onClick={() => setPreviewDoc(null)}>
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setPreviewDoc(null)} />
        </div>
      )}
    </>
  )
}
