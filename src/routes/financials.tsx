import { createFileRoute } from '@tanstack/react-router'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../lib/auth-middleware'
import { FinancialSummary } from './financials/-FinancialSummary'
import { EarningsTable } from './financials/-EarningsTable'

export const Route = createFileRoute('/financials')({
  component: FinancialReports,
})

function FinancialReports() {
  return (
    <ProtectedRoute>
      <FinancialReportsContent />
    </ProtectedRoute>
  )
}

function FinancialReportsContent() {
  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">Financial Reports</h1>
        <p className="text-xs text-base-content/60">
          View earnings, payouts, and financial metrics
        </p>
      </div>

      <FinancialSummary />

      <div className="mb-2">
        <h2 className="font-bold text-primary">Earnings Records</h2>
      </div>
      <EarningsTable />
    </Layout>
  )
}
