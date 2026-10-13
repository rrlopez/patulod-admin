import { createFileRoute, useNavigate } from '@tanstack/react-router'
import Layout from '../components/Layout'
import { mockSupportCases } from '../mock/support'

export const Route = createFileRoute('/support/')({
  component: SupportCases,
})

function SupportCases() {
  const navigate = useNavigate()

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">Support Cases</h1>
        <p className="text-xs text-base-content/60">
          Manage customer support requests
        </p>
      </div>

      <div className="card bg-base-200 border border-base-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-xs">
            <thead className="bg-base-300 text-primary">
              <tr>
                <th>Case ID</th>
                <th>User</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mockSupportCases.map((c) => (
                <tr key={c.id} className="hover:bg-base-100 transition-colors">
                  <td className="font-mono">{c.id}</td>
                  <td>{c.userName}</td>
                  <td className="font-medium">{c.subject}</td>
                  <td>
                    <span className="badge badge-sm badge-outline">
                      {c.category}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge badge-sm ${
                        c.priority === 'URGENT'
                          ? 'badge-error'
                          : c.priority === 'HIGH'
                            ? 'badge-warning'
                            : c.priority === 'MEDIUM'
                              ? 'badge-info'
                              : 'badge-ghost'
                      }`}
                    >
                      {c.priority}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge badge-sm ${
                        c.status === 'RESOLVED'
                          ? 'badge-success'
                          : c.status === 'CLOSED'
                            ? 'badge-ghost'
                            : 'badge-warning'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="text-base-content/60">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="btn btn-xs btn-primary btn-outline"
                      onClick={() => navigate({ to: `/support/${c.id}` })}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
