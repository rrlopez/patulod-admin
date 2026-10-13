export type DriverStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'

export interface MockDriverApplication {
  id: string
  applicantName: string
  email: string
  phone: string
  licenseNumber: string
  vehicleType: string
  vehiclePlate: string
  status: DriverStatus
  appliedAt: string
  reviewedAt?: string
  notes?: string
}

export interface MockDriverProfile {
  id: string
  name: string
  email: string
  phone: string
  licenseNumber: string
  vehicleType: string
  vehiclePlate: string
  rating: number
  totalTrips: number
  isOnline: boolean
  status: DriverStatus
  joinedAt: string
}

export const mockDriverApplications: MockDriverApplication[] = [
  {
    id: 'APP001',
    applicantName: 'Carlos Bautista',
    email: 'carlos.b@email.com',
    phone: '+63 945 678 9012',
    licenseNumber: 'N01-23-456789',
    vehicleType: 'Motorcycle',
    vehiclePlate: 'ABC 1234',
    status: 'PENDING',
    appliedAt: '2026-10-08 10:30:00',
  },
  {
    id: 'APP002',
    applicantName: 'Juan Dela Cruz',
    email: 'juan.dc@email.com',
    phone: '+63 967 890 1234',
    licenseNumber: 'N01-23-567890',
    vehicleType: 'Motorcycle',
    vehiclePlate: 'XYZ 5678',
    status: 'APPROVED',
    appliedAt: '2026-10-05 14:15:00',
    reviewedAt: '2026-10-06 09:20:00',
    notes: 'All documents verified. Good to go.',
  },
  {
    id: 'APP003',
    applicantName: 'Rosa Martinez',
    email: 'rosa.m@email.com',
    phone: '+63 978 901 2345',
    licenseNumber: 'N01-23-678901',
    vehicleType: 'Tricycle',
    vehiclePlate: 'DEF 9012',
    status: 'REJECTED',
    appliedAt: '2026-10-07 16:45:00',
    reviewedAt: '2026-10-08 11:00:00',
    notes: 'License expired. Please reapply with valid license.',
  },
]

export const mockDriverProfiles: MockDriverProfile[] = [
  {
    id: 'USR002',
    name: 'Pedro Gonzales',
    email: 'pedro.g@email.com',
    phone: '+63 923 456 7890',
    licenseNumber: 'N01-22-345678',
    vehicleType: 'Motorcycle',
    vehiclePlate: 'NAG 1122',
    rating: 4.9,
    totalTrips: 156,
    isOnline: true,
    status: 'APPROVED',
    joinedAt: '2024-01-10',
  },
  {
    id: 'USR004',
    name: 'Carlos Bautista',
    email: 'carlos.b@email.com',
    phone: '+63 945 678 9012',
    licenseNumber: 'N01-23-456789',
    vehicleType: 'Motorcycle',
    vehiclePlate: 'ABC 1234',
    rating: 4.2,
    totalTrips: 89,
    isOnline: false,
    status: 'SUSPENDED',
    joinedAt: '2024-01-20',
  },
  {
    id: 'DRV003',
    name: 'Miguel Torres',
    email: 'miguel.t@email.com',
    phone: '+63 989 012 3456',
    licenseNumber: 'N01-22-234567',
    vehicleType: 'Tricycle',
    vehiclePlate: 'NAG 2233',
    rating: 4.7,
    totalTrips: 203,
    isOnline: true,
    status: 'APPROVED',
    joinedAt: '2023-12-05',
  },
]
