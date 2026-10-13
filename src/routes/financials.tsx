import { createFileRoute } from '@tanstack/react-router'
import Layout from '../components/Layout'
import { mockEarnings, mockFinancialSummary } from '../mock/financials'

export const Route = createFileRoute('/financials')({
  component: FinancialReports,
})

function FinancialReports() {
  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">Financial Reports</h1>
        <p className="text-xs text-base-content/60">
          View earnings, payouts, and financial metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          {
            title: 'Total Revenue',
            value: `₱${mockFinancialSummary.totalRevenue.toLocaleString()}`,
            icon: '💰',
          },
          {
            title: 'Commission',
            value: `₱${mockFinancialSummary.totalCommission.toLocaleString()}`,
            icon: '📊',
          },
          {
            title: 'Driver Earnings',
            value: `₱${mockFinancialSummary.totalDriverEarnings.toLocaleString()}`,
            icon: '🚗',
          },
          {
            title: 'Pending Payouts',
            value: `₱${mockFinancialSummary.pendingPayouts.toLocaleString()}`,
            icon: '⏳',
          },
        ].map((m) => (
          <div
            key={m.title}
            className="card bg-base-200 border border-base-300 shadow-sm"
          >
            <div className="card-body p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-base-content/60 mb-1">{m.title}</p>
                  <p className="text-xl font-bold text-primary">{m.value}</p>
                </div>
                <span className="text-2xl">{m.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Earnings Table */}
      <div className="card bg-base-200 border border-base-300 shadow-sm overflow-hidden">
        <div className="card-body p-4">
          <h2 className="font-bold text-primary mb-3">Recent Earnings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table table-xs">
            <thead className="bg-base-300 text-primary">
              <tr>
                <th>ID</th>
                <th>Driver</th>
                <th>Trip ID</th>
                <th>Fare</th>
                <th>Commission</th>
                <th>Net Earning</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mockEarnings.map((e) => (
                <tr key={e.id} className="hover:bg-base-100 transition-colors">
                  <td className="font-mono">{e.id}</td>
                  <td>{e.driverName}</td>
                  <td className="font-mono">{e.tripId}</td>
                  <td>₱{e.fare}</td>
                  <td>₱{e.commission}</td>
                  <td className="font-medium">₱{e.netEarning}</td>
                  <td className="text-base-content/60">{e.date}</td>
                  <td>
                    <span
                      className={`badge badge-sm ${
                        e.status === 'PAID'
                          ? 'badge-success'
                          : e.status === 'HELD'
                            ? 'badge-error'
                            : 'badge-warning'
                      }`}
                    >
                      {e.status}
                    </span>
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
