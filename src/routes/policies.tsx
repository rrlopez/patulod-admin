import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../lib/auth-middleware'
import { mockPolicies } from '../mock/policies'

export const Route = createFileRoute('/policies')({
  component: PolicyEditor,
})

function PolicyEditor() {
  return (
    <ProtectedRoute>
      <PolicyEditorContent />
    </ProtectedRoute>
  )
}

function PolicyEditorContent() {
  const [selectedPolicy, setSelectedPolicy] = useState(mockPolicies[0])

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">Policy Editor</h1>
        <p className="text-xs text-base-content/60">
          Manage platform policies and terms
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Policy List */}
        <div className="lg:col-span-1">
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body p-3">
              <h2 className="font-bold text-primary mb-2">Policies</h2>
              <div className="space-y-1">
                {mockPolicies.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPolicy(p)}
                    className={`btn btn-sm w-full justify-start ${
                      selectedPolicy.id === p.id ? 'btn-primary' : 'btn-ghost'
                    }`}
                  >
                    <span className="truncate">{p.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Policy Editor */}
        <div className="lg:col-span-3">
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-primary">
                    {selectedPolicy.title}
                  </h2>
                  <div className="flex gap-2 mt-2 text-xs text-base-content/60">
                    <span>Version {selectedPolicy.version}</span>
                    <span>•</span>
                    <span>Last updated: {selectedPolicy.lastUpdated}</span>
                    <span>•</span>
                    <span>By {selectedPolicy.updatedBy}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`badge ${
                      selectedPolicy.isActive ? 'badge-success' : 'badge-ghost'
                    }`}
                  >
                    {selectedPolicy.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Policy Type</span>
                </label>
                <input
                  type="text"
                  value={selectedPolicy.type}
                  className="input input-bordered input-sm"
                  disabled
                />
              </div>

              <div className="form-control mt-3">
                <label className="label">
                  <span className="label-text">Content</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-96 font-mono text-sm"
                  value={selectedPolicy.content}
                  readOnly
                />
              </div>

              <div className="flex gap-2 mt-4">
                <button className="btn btn-primary btn-sm">Save Changes</button>
                <button className="btn btn-ghost btn-sm">New Version</button>
                <button className="btn btn-ghost btn-sm">Preview</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
