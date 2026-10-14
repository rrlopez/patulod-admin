import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../lib/auth-middleware'
import { PolicyList, type PolicyItem } from './policies/-PolicyList'
import { PolicyEditor } from './policies/-PolicyEditor'

export const Route = createFileRoute('/policies')({
  component: PolicyEditorPage,
})

function PolicyEditorPage() {
  return (
    <ProtectedRoute>
      <PolicyEditorContent />
    </ProtectedRoute>
  )
}

function PolicyEditorContent() {
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyItem | null>(null)

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">Policy Editor</h1>
        <p className="text-xs text-base-content/60">
          Manage platform policies and terms
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <PolicyList
            selectedId={selectedPolicy?.id ?? null}
            onSelect={(p) => setSelectedPolicy(p)}
          />
        </div>

        <div className="lg:col-span-3">
          {selectedPolicy ? (
            <PolicyEditor policyId={selectedPolicy.id} />
          ) : (
            <div className="card bg-base-200 border border-base-300 shadow-sm">
              <div className="card-body flex items-center justify-center py-16">
                <p className="text-base-content/40 text-sm">
                  Select a policy from the list to view or edit it.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
