import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { prismaQuery } from '../../lib/prisma-client'
import { formatDate } from '../../lib/date-format'

interface DriverDocument {
  id: string
  documentType: string
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
  const [isUpdating, setIsUpdating] = useState(false)
  const queryClient = useQueryClient()

  const { data: docs, isLoading, isError } = useQuery<DriverDocument[]>({
    queryKey: ['driver', applicationId, 'documents'],
    queryFn: async () => {
      const result = await prismaQuery<DriverDocument[]>({
        model: 'driverDocument',
        operation: 'findMany',
        args: {
          where: { driverApplicationId: applicationId },
          orderBy: { uploadedAt: 'asc' },
          select: {
            id: true,
            documentType: true,
            reviewStatus: true,
            uploadedAt: true,
            fileData: true,
            fileName: true,
            mimeType: true,
          },
        },
      })
      console.log('Documents fetched:', result)
      return result
    },
    staleTime: 30_000,
  })

  const updateDocumentStatus = useMutation({
    mutationFn: async ({ documentId, status }: { documentId: string; status: string }) => {
      return prismaQuery({
        model: 'driverDocument',
        operation: 'update',
        args: {
          where: { id: documentId },
          data: { reviewStatus: status },
        },
      })
    },
    onSuccess: () => {
      // Refetch documents to show updated status
      queryClient.invalidateQueries({ queryKey: ['driver', applicationId, 'documents'] })
      setPreviewDoc(null)
      setIsUpdating(false)
    },
    onError: (error) => {
      console.error('Failed to update document status:', error)
      setIsUpdating(false)
    },
  })

  const handleStatusChange = async (status: 'APPROVED' | 'REJECTED') => {
    if (!previewDoc) return
    setIsUpdating(true)
    updateDocumentStatus.mutate({ documentId: previewDoc.id, status })
  }

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
                      {doc.documentType ? doc.documentType.replace(/_/g, ' ') : 'Unknown Document'}
                    </p>
                    <p className="text-xs text-base-content/50">
                      {doc.fileName ?? 'Unnamed file'} •{' '}
                      {formatDate(doc.uploadedAt)}
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
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-primary">
                  {previewDoc.documentType ? previewDoc.documentType.replace(/_/g, ' ') : 'Unknown Document'}
                </h3>
                <p className="text-xs text-base-content/60 mt-1">
                  {previewDoc.fileName} • Uploaded {formatDate(previewDoc.uploadedAt)}
                </p>
              </div>
              <span className={`badge ${REVIEW_BADGE[previewDoc.reviewStatus] ?? 'badge-ghost'}`}>
                {previewDoc.reviewStatus}
              </span>
            </div>

            {previewDoc.mimeType?.startsWith('image/') ? (
              <img
                src={`data:${previewDoc.mimeType};base64,${previewDoc.fileData}`}
                alt={previewDoc.documentType ?? 'Document'}
                className="w-full rounded-lg border border-base-300 mb-4"
              />
            ) : previewDoc.mimeType === 'application/pdf' ? (
              <iframe
                src={`data:application/pdf;base64,${previewDoc.fileData}`}
                className="w-full h-96 rounded-lg border border-base-300 mb-4"
                title={previewDoc.documentType ?? 'Document'}
              />
            ) : (
              <p className="text-sm text-base-content/60 mb-4">
                Preview not available for this file type.
              </p>
            )}

            <div className="modal-action">
              <button 
                className="btn btn-sm" 
                onClick={() => setPreviewDoc(null)}
                disabled={isUpdating}
              >
                Close
              </button>
              
              {previewDoc.reviewStatus !== 'APPROVED' && (
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => handleStatusChange('APPROVED')}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Approve
                    </>
                  )}
                </button>
              )}
              
              {previewDoc.reviewStatus !== 'REJECTED' && (
                <button
                  className="btn btn-sm btn-error"
                  onClick={() => handleStatusChange('REJECTED')}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Reject
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !isUpdating && setPreviewDoc(null)} />
        </div>
      )}
    </>
  )
}
