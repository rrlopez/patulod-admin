export interface MockEarnings {
  id: string
  driverId: string
  driverName: string
  tripId: string
  fare: number
  commission: number
  netEarning: number
  date: string
  status: 'PENDING' | 'PAID' | 'HELD'
}

export interface MockEarningsAdjustment {
  id: string
  driverId: string
  driverName: string
  amount: number
  reason: string
  type: 'BONUS' | 'DEDUCTION' | 'REFUND'
  date: string
  processedBy: string
}

export interface MockFinancialSummary {
  totalRevenue: number
  totalCommission: number
  totalDriverEarnings: number
  pendingPayouts: number
  completedTrips: number
  period: string
}

export const mockEarnings: MockEarnings[] = [
  {
    id: 'ERN001',
    driverId: 'USR002',
    driverName: 'Pedro Gonzales',
    tripId: 'PTL-2026100901',
    fare: 85,
    commission: 17,
    netEarning: 68,
    date: '2026-10-09',
    status: 'PAID',
  },
  {
    id: 'ERN002',
    driverId: 'USR002',
    driverName: 'Pedro Gonzales',
    tripId: 'PTL-2026100902',
    fare: 65,
    commission: 13,
    netEarning: 52,
    date: '2026-10-09',
    status: 'PENDING',
  },
  {
    id: 'ERN003',
    driverId: 'USR004',
    driverName: 'Carlos Bautista',
    tripId: 'PTL-2026100904',
    fare: 95,
    commission: 19,
    netEarning: 76,
    date: '2026-10-08',
    status: 'HELD',
  },
  {
    id: 'ERN004',
    driverId: 'DRV003',
    driverName: 'Miguel Torres',
    tripId: 'PTL-2026100807',
    fare: 120,
    commission: 24,
    netEarning: 96,
    date: '2026-10-08',
    status: 'PAID',
  },
]

export const mockEarningsAdjustments: MockEarningsAdjustment[] = [
  {
    id: 'ADJ001',
    driverId: 'USR002',
    driverName: 'Pedro Gonzales',
    amount: 500,
    reason: 'Monthly performance bonus',
    type: 'BONUS',
    date: '2026-10-01',
    processedBy: 'Admin',
  },
  {
    id: 'ADJ002',
    driverId: 'USR004',
    driverName: 'Carlos Bautista',
    amount: -200,
    reason: 'Customer complaint refund',
    type: 'DEDUCTION',
    date: '2026-10-08',
    processedBy: 'Admin',
  },
]

export const mockFinancialSummary: MockFinancialSummary = {
  totalRevenue: 8934,
  totalCommission: 1787,
  totalDriverEarnings: 7147,
  pendingPayouts: 1250,
  completedTrips: 87,
  period: 'This Week',
}
