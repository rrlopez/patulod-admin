import { createFileRoute } from '@tanstack/react-router'
import Layout from '../components/Layout'
import { mockDriverApplications } from '../mock/drivers'

export const Route = createFileRoute('/drivers/')({
  component: DriverApplications,
})

function DriverApplications() {
  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">Driver Applications</h1>
        <p className="text-xs text-base-content/60">
          Review and manage driver applications
        </p>
      </div>

      <div className="card bg-base-200 border border-base-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-xs">
            <thead className="bg-base-300 text-primary">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Vehicle</th>
                <th>Plate</th>
                <th>Status</th>
                <th>Applied</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mockDriverApplications.map((app) => (
                <tr key={app.id} className="hover:bg-base-100 transition-colors">
                  <td className="font-mono">{app.id}</td>
                  <td>{app.applicantName}</td>
                  <td className="text-base-content/60">{app.email}</td>
                  <td>{app.vehicleType}</td>
                  <td className="font-mono">{app.vehiclePlate}</td>
                  <td>
                    <span
                      className={`badge badge-sm ${
                        app.status === 'APPROVED'
                          ? 'badge-success'
                          : app.status === 'REJECTED'
                            ? 'badge-error'
                            : 'badge-warning'
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="text-base-content/60">
                    {new Date(app.appliedAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button className="btn btn-xs btn-primary btn-outline">
                      Review
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
