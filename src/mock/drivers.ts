export type DriverStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'

export interface MockDriverApplication {
  id: string
  applicantName: string
  email: string
  phone: string
  licenseNumber: string
  vehicleType: 'MOTORCYCLE' | 'TRICYCLE'
  vehiclePlate: string
  vehicleModel?: string
  status: DriverStatus
  appliedAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
  notes?: string
  documents: {
    driversLicense: string
    vehicleRegistration: string
    baranayClearance: string
    validId: string
  }
}

export interface MockDriverProfile {
  id: string
  name: string
  email: string
  phone: string
  licenseNumber: string
  vehicleType: 'MOTORCYCLE' | 'TRICYCLE'
  vehiclePlate: string
  rating: number
  totalTrips: number
  totalEarnings: number
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
    vehicleType: 'MOTORCYCLE',
    vehiclePlate: 'ABC 1234',
    vehicleModel: 'Honda TMX 155',
    status: 'PENDING',
    appliedAt: '2026-10-08 10:30:00',
    documents: {
      driversLicense: '/uploads/APP001/drivers-license.pdf',
      vehicleRegistration: '/uploads/APP001/vehicle-or-cr.pdf',
      baranayClearance: '/uploads/APP001/brgy-clearance.pdf',
      validId: '/uploads/APP001/valid-id.pdf',
    },
  },
  {
    id: 'APP002',
    applicantName: 'Juan Dela Cruz',
    email: 'juan.dc@email.com',
    phone: '+63 967 890 1234',
    licenseNumber: 'N01-23-567890',
    vehicleType: 'MOTORCYCLE',
    vehiclePlate: 'XYZ 5678',
    vehicleModel: 'Yamaha Mio',
    status: 'APPROVED',
    appliedAt: '2026-10-05 14:15:00',
    reviewedAt: '2026-10-06 09:20:00',
    reviewedBy: 'Admin Staff',
    notes: 'All documents verified. Good to go.',
    documents: {
      driversLicense: '/uploads/APP002/drivers-license.pdf',
      vehicleRegistration: '/uploads/APP002/vehicle-or-cr.pdf',
      baranayClearance: '/uploads/APP002/brgy-clearance.pdf',
      validId: '/uploads/APP002/valid-id.pdf',
    },
  },
  {
    id: 'APP003',
    applicantName: 'Rosa Martinez',
    email: 'rosa.m@email.com',
    phone: '+63 978 901 2345',
    licenseNumber: 'N01-23-678901',
    vehicleType: 'TRICYCLE',
    vehiclePlate: 'DEF 9012',
    vehicleModel: 'Kawasaki Tricycle',
    status: 'REJECTED',
    appliedAt: '2026-10-07 16:45:00',
    reviewedAt: '2026-10-08 11:00:00',
    reviewedBy: 'Admin Staff',
    rejectionReason: 'License expired. Please reapply with valid license.',
    notes: 'License expired. Please reapply with valid license.',
    documents: {
      driversLicense: '/uploads/APP003/drivers-license.pdf',
      vehicleRegistration: '/uploads/APP003/vehicle-or-cr.pdf',
      baranayClearance: '/uploads/APP003/brgy-clearance.pdf',
      validId: '/uploads/APP003/valid-id.pdf',
    },
  },
]

export const mockDriverProfiles: MockDriverProfile[] = [
  {
    id: 'USR002',
    name: 'Pedro Gonzales',
    email: 'pedro.g@email.com',
    phone: '+63 923 456 7890',
    licenseNumber: 'N01-22-345678',
    vehicleType: 'MOTORCYCLE',
    vehiclePlate: 'NAG 1122',
    rating: 4.9,
    totalTrips: 156,
    totalEarnings: 45670.5,
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
    vehicleType: 'MOTORCYCLE',
    vehiclePlate: 'ABC 1234',
    rating: 4.2,
    totalTrips: 89,
    totalEarnings: 28340.0,
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
    vehicleType: 'TRICYCLE',
    vehiclePlate: 'NAG 2233',
    rating: 4.7,
    totalTrips: 203,
    totalEarnings: 67890.25,
    isOnline: true,
    status: 'APPROVED',
    joinedAt: '2023-12-05',
  },
]
