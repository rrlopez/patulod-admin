import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../lib/auth-middleware'
import { mockDriverApplications, mockDriverProfiles, type DriverStatus } from '../mock/drivers'

export const Route = createFileRoute('/drivers/$applicationId')({
  component: DriverApplicationDetail,
})

const statusBadge: Record<DriverStatus, string> = {
  PENDING: 'badge-warning',
  APPROVED: 'badge-success',
  REJECTED: 'badge-error',
  SUSPENDED: 'badge-warning',
}

function DriverApplicationDetail() {
  return (
    <ProtectedRoute>
      <DriverApplicationDetailContent />
    </ProtectedRoute>
  )
}

function DriverApplicationDetailContent() {
  const { applicationId } = Route.useParams()
  const navigate = useNavigate()
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const app = mockDriverApplications.find((a) => a.id === applicationId)

  if (!app)
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-xl font-bold text-primary">Application Not Found</p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate({ to: '/drivers' })}
          >
            Back to Applications
          </button>
        </div>
      </Layout>
    )

  return (
    <Layout>
      <div className="mb-4">
        <button
          className="btn btn-ghost btn-xs text-primary mb-3 gap-1"
          onClick={() => navigate({ to: '/drivers' })}
        >
          ← Back to Applications
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary mb-0.5">
              {app.applicantName}
            </h1>
            <p className="text-xs text-base-content/60">{app.email}</p>
          </div>
          <span className={`badge ${statusBadge[app.status]}`}>{app.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left */}
        <div className="lg:col-span-2 space-y-4">
          {/* Personal info */}
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body p-3">
              <h2 className="font-bold text-primary mb-3">Personal Information</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-base-content/50 uppercase mb-0.5">
                    Full Name
                  </p>
                  <p className="text-xs font-medium text-base-content">
                    {app.applicantName}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-base-content/50 uppercase mb-0.5">
                    Phone
                  </p>
                  <p className="text-xs font-medium text-base-content font-mono">
                    {app.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-base-content/50 uppercase mb-0.5">
                    Email
                  </p>
                  <p className="text-xs font-medium text-base-content">{app.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-base-content/50 uppercase mb-0.5">
                    Submitted
                  </p>
                  <p className="text-xs font-medium text-base-content">
                    {new Date(app.appliedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                {app.reviewedAt && (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-base-content/50 uppercase mb-0.5">
                        Reviewed On
                      </p>
                      <p className="text-xs font-medium text-base-content">
                        {new Date(app.reviewedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-base-content/50 uppercase mb-0.5">
                        Reviewed By
                      </p>
                      <p className="text-xs font-medium text-base-content">
                        {app.reviewedBy || '—'}
                      </p>
                    </div>
                  </>
                )}
              </div>
              {app.rejectionReason && (
                <div className="mt-3 pt-3 border-t border-base-300">
                  <p className="text-xs font-semibold text-base-content/50 uppercase mb-1">
                    Rejection Reason
                  </p>
                  <div className="alert alert-error text-xs py-2">
                    {app.rejectionReason}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle */}
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body p-3">
              <h2 className="font-bold text-primary mb-3">Vehicle Information</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-base-content/50 uppercase mb-0.5">
                    Type
                  </p>
                  <span
                    className={`badge badge-sm ${
                      app.vehicleType === 'TRICYCLE'
                        ? 'badge-primary'
                        : 'badge-secondary'
                    }`}
                  >
                    {app.vehicleType}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-base-content/50 uppercase mb-0.5">
                    Plate Number
                  </p>
                  <p className="text-xs font-bold font-mono text-base-content">
                    {app.vehiclePlate}
                  </p>
                </div>
                {app.vehicleModel && (
                  <div>
                    <p className="text-xs font-semibold text-base-content/50 uppercase mb-0.5">
                      Model
                    </p>
                    <p className="text-xs font-medium text-base-content">
                      {app.vehicleModel}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-base-content/50 uppercase mb-0.5">
                    License Number
                  </p>
                  <p className="text-xs font-bold font-mono text-base-content">
                    {app.licenseNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body p-3">
              <h2 className="font-bold text-primary mb-3">Submitted Documents</h2>
              <div className="space-y-2">
                {[
                  { label: "Driver's License", path: app.documents.driversLicense },
                  {
                    label: 'Vehicle Registration (OR/CR)',
                    path: app.documents.vehicleRegistration,
                  },
                  {
                    label: 'Barangay Clearance',
                    path: app.documents.baranayClearance,
                  },
                  { label: 'Valid Government ID', path: app.documents.validId },
                ].map((doc) => (
                  <div
                    key={doc.label}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-base-100 border border-base-300"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-base-content">
                        {doc.label}
                      </p>
                      <p className="text-xs text-base-content/50 truncate">
                        {doc.path.split('/').pop()}
                      </p>
                    </div>
                    <button
                      className="btn btn-xs btn-primary btn-outline"
                      onClick={() => alert('Document preview (mock action)')}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4">
          {/* Actions */}
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body p-3">
              <h2 className="font-bold text-primary mb-3">Actions</h2>
              <div className="space-y-2">
                {app.status === 'PENDING' && (
                  <>
                    <button
                      className="btn btn-success btn-sm w-full"
                      onClick={() => alert('Application approved (mock action)')}
                    >
                      ✓ Approve Application
                    </button>
                    <button
                      className="btn btn-error btn-sm btn-outline w-full"
                      onClick={() => setShowRejectModal(true)}
                    >
                      ✕ Reject Application
                    </button>
                  </>
                )}
                {app.status === 'APPROVED' && (
                  <button
                    className="btn btn-warning btn-sm btn-outline w-full"
                    onClick={() => alert('Driver suspended (mock action)')}
                  >
                    ⚠ Suspend Driver
                  </button>
                )}
                {app.status === 'REJECTED' && (
                  <button
                    className="btn btn-success btn-sm btn-outline w-full"
                    onClick={() => alert('Application approved (mock action)')}
                  >
                    ↺ Reconsider & Approve
                  </button>
                )}
                {app.status === 'SUSPENDED' && (
                  <button
                    className="btn btn-success btn-sm btn-outline w-full"
                    onClick={() => alert('Driver reinstated (mock action)')}
                  >
                    ✓ Reinstate Driver
                  </button>
                )}
                <button
                  className="btn btn-ghost btn-sm w-full border border-base-300"
                  onClick={() => alert('View full user profile (mock action)')}
                >
                  View Full Profile
                </button>
              </div>
            </div>
          </div>

          {/* Application Info */}
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body p-3">
              <h2 className="font-bold text-primary mb-3">Application Info</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-base-content/60">Application ID</span>
                  <span className="text-xs font-mono font-bold text-primary">
                    {app.id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-base-content/60">Status</span>
                  <span className={`badge badge-sm ${statusBadge[app.status]}`}>
                    {app.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-base-content/60">Submitted</span>
                  <span className="text-xs font-medium">
                    {new Date(app.appliedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {app.reviewedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-base-content/60">Reviewed</span>
                    <span className="text-xs font-medium">
                      {new Date(app.reviewedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg text-primary mb-2">
              Reject Application
            </h3>
            <p className="text-sm text-base-content/60 mb-3">
              Provide a reason for rejecting <strong>{app.applicantName}</strong>'s
              application. This will be visible to the applicant.
            </p>
            <textarea
              className="textarea textarea-bordered w-full text-sm mb-3"
              rows={3}
              placeholder="e.g. Vehicle registration document is expired…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="modal-action">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-error btn-sm"
                disabled={!rejectReason.trim()}
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                  alert('Application rejected (mock action)')
                }}
              >
                Reject Application
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setShowRejectModal(false)}
          />
        </div>
      )}
    </Layout>
  )
}
