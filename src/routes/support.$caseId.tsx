import { createFileRoute, useNavigate } from '@tanstack/react-router'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../lib/auth-middleware'
import { mockSupportCases, mockSupportNotes } from '../mock/support'

export const Route = createFileRoute('/support/$caseId')({
  component: SupportCaseDetail,
})

function SupportCaseDetail() {
  return (
    <ProtectedRoute>
      <SupportCaseDetailContent />
    </ProtectedRoute>
  )
}

function SupportCaseDetailContent() {
  const { caseId } = Route.useParams()
  const navigate = useNavigate()
  const supportCase = mockSupportCases.find((c) => c.id === caseId)
  const notes = mockSupportNotes.filter((n) => n.caseId === caseId)

  if (!supportCase) {
    return (
      <Layout>
        <div className="alert alert-error">
          <span>Support case not found</span>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-4">
        <button
          className="btn btn-ghost btn-sm mb-2"
          onClick={() => navigate({ to: '/support' })}
        >
          ← Back to Support Cases
        </button>
        <h1 className="text-2xl font-bold text-primary mb-1">
          {supportCase.subject}
        </h1>
        <p className="text-xs text-base-content/60 font-mono">{supportCase.id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-primary">Case Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-base-content/60 mb-1">User</p>
                  <p className="font-medium">{supportCase.userName}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/60 mb-1">Role</p>
                  <span className="badge badge-primary">
                    {supportCase.userRole}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-base-content/60 mb-1">Category</p>
                  <span className="badge badge-outline">{supportCase.category}</span>
                </div>
                <div>
                  <p className="text-xs text-base-content/60 mb-1">Priority</p>
                  <span
                    className={`badge ${
                      supportCase.priority === 'URGENT'
                        ? 'badge-error'
                        : supportCase.priority === 'HIGH'
                          ? 'badge-warning'
                          : 'badge-info'
                    }`}
                  >
                    {supportCase.priority}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-base-content/60 mb-1">Description</p>
                  <p className="text-sm">{supportCase.description}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-primary">Notes & Updates</h2>
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-3 rounded-lg ${
                      note.isInternal ? 'bg-warning/10' : 'bg-base-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">{note.author}</span>
                      {note.isInternal && (
                        <span className="badge badge-xs badge-warning">Internal</span>
                      )}
                    </div>
                    <p className="text-sm">{note.content}</p>
                    <p className="text-xs text-base-content/40 mt-1">
                      {note.timestamp}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Add a note..."
                  rows={3}
                />
                <button className="btn btn-primary btn-sm mt-2">Add Note</button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-primary mb-4">Actions</h2>
              <div className="space-y-2">
                <button className="btn btn-primary btn-block btn-sm">
                  Assign to Me
                </button>
                <button className="btn btn-success btn-block btn-sm">
                  Mark Resolved
                </button>
                <button className="btn btn-ghost btn-block btn-sm">
                  Close Case
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
