export type SupportCaseStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type SupportCasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface MockSupportCase {
  id: string
  userId: string
  userName: string
  userRole: 'RIDER' | 'DRIVER'
  subject: string
  category: string
  priority: SupportCasePriority
  status: SupportCaseStatus
  description: string
  createdAt: string
  updatedAt: string
  assignedTo?: string
}

export interface SupportNote {
  id: string
  caseId: string
  author: string
  content: string
  timestamp: string
  isInternal: boolean
}

export const mockSupportCases: MockSupportCase[] = [
  {
    id: 'SUP001',
    userId: 'USR001',
    userName: 'Sofia Mendoza',
    userRole: 'RIDER',
    subject: 'Payment dispute',
    category: 'Payment',
    priority: 'HIGH',
    status: 'OPEN',
    description: 'I was charged twice for the same trip PTL-2026100901.',
    createdAt: '2026-10-09 09:00:00',
    updatedAt: '2026-10-09 09:00:00',
  },
  {
    id: 'SUP002',
    userId: 'USR002',
    userName: 'Pedro Gonzales',
    userRole: 'DRIVER',
    subject: 'App crashing on route',
    category: 'Technical',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    description: 'The app keeps crashing when I accept a booking.',
    createdAt: '2026-10-08 16:30:00',
    updatedAt: '2026-10-09 08:15:00',
    assignedTo: 'Tech Support Team',
  },
  {
    id: 'SUP003',
    userId: 'USR003',
    userName: 'Maria Santos',
    userRole: 'RIDER',
    subject: 'Driver was rude',
    category: 'Complaint',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    description: 'Driver Carlos was very rude during my trip yesterday.',
    createdAt: '2026-10-07 10:20:00',
    updatedAt: '2026-10-08 14:00:00',
    assignedTo: 'Customer Relations',
  },
  {
    id: 'SUP004',
    userId: 'USR005',
    userName: 'Ana Reyes',
    userRole: 'RIDER',
    subject: 'How to update payment method?',
    category: 'General Inquiry',
    priority: 'LOW',
    status: 'CLOSED',
    description: 'I want to change my payment method from cash to e-wallet.',
    createdAt: '2026-10-05 11:45:00',
    updatedAt: '2026-10-05 13:30:00',
  },
]

export const mockSupportNotes: SupportNote[] = [
  {
    id: 'NOTE001',
    caseId: 'SUP001',
    author: 'Admin',
    content: 'Reviewing transaction logs for trip PTL-2026100901.',
    timestamp: '2026-10-09 09:15:00',
    isInternal: true,
  },
  {
    id: 'NOTE002',
    caseId: 'SUP002',
    author: 'Tech Support',
    content: 'Identified the issue. Working on a fix.',
    timestamp: '2026-10-09 08:15:00',
    isInternal: true,
  },
  {
    id: 'NOTE003',
    caseId: 'SUP003',
    author: 'Admin',
    content: 'Contacted driver. Issue has been addressed.',
    timestamp: '2026-10-08 14:00:00',
    isInternal: false,
  },
]
