export type UserRole = 'RIDER' | 'DRIVER' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED'

export interface MockUser {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  status: UserStatus
  createdAt: string
  lastActive: string
  totalTrips?: number
  totalSpent?: number
  rating?: number
}

export const mockUsers: MockUser[] = [
  {
    id: 'USR001',
    name: 'Sofia Mendoza',
    email: 'sofia.mendoza@email.com',
    phone: '+63 912 345 6789',
    role: 'RIDER',
    status: 'ACTIVE',
    createdAt: '2024-01-15',
    lastActive: '2 hours ago',
    totalTrips: 42,
    totalSpent: 3250,
    rating: 4.8,
  },
  {
    id: 'USR002',
    name: 'Pedro Gonzales',
    email: 'pedro.g@email.com',
    phone: '+63 923 456 7890',
    role: 'DRIVER',
    status: 'ACTIVE',
    createdAt: '2024-01-10',
    lastActive: '15 minutes ago',
    totalTrips: 156,
    rating: 4.9,
  },
  {
    id: 'USR003',
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '+63 934 567 8901',
    role: 'RIDER',
    status: 'ACTIVE',
    createdAt: '2024-02-01',
    lastActive: '1 day ago',
    totalTrips: 18,
    totalSpent: 1420,
    rating: 4.7,
  },
  {
    id: 'USR004',
    name: 'Carlos Bautista',
    email: 'carlos.b@email.com',
    phone: '+63 945 678 9012',
    role: 'DRIVER',
    status: 'SUSPENDED',
    createdAt: '2024-01-20',
    lastActive: '3 days ago',
    totalTrips: 89,
    rating: 4.2,
  },
  {
    id: 'USR005',
    name: 'Ana Reyes',
    email: 'ana.reyes@email.com',
    phone: '+63 956 789 0123',
    role: 'RIDER',
    status: 'ACTIVE',
    createdAt: '2024-02-10',
    lastActive: '5 hours ago',
    totalTrips: 27,
    totalSpent: 2100,
    rating: 4.9,
  },
]
