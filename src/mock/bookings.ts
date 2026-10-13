export type BookingStatus = 
  | 'SEARCHING' 
  | 'DRIVER_ASSIGNED' 
  | 'DRIVER_ARRIVED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED'

export interface MockBooking {
  id: string
  riderId: string
  riderName: string
  driverId?: string
  driverName?: string
  pickupAddress: string
  dropoffAddress: string
  status: BookingStatus
  fare: number
  distance: number
  createdAt: string
  completedAt?: string
  rating?: number
}

export interface BookingEvent {
  id: string
  bookingId: string
  type: string
  description: string
  timestamp: string
}

export const mockBookings: MockBooking[] = [
  {
    id: 'PTL-2026100901',
    riderId: 'USR001',
    riderName: 'Sofia Mendoza',
    driverId: 'USR002',
    driverName: 'Pedro Gonzales',
    pickupAddress: 'SM City Naga, Naga City',
    dropoffAddress: 'Ateneo de Naga University',
    status: 'COMPLETED',
    fare: 85,
    distance: 3.2,
    createdAt: '2026-10-09 08:30:00',
    completedAt: '2026-10-09 08:45:00',
    rating: 5,
  },
  {
    id: 'PTL-2026100902',
    riderId: 'USR003',
    riderName: 'Maria Santos',
    driverId: 'USR002',
    driverName: 'Pedro Gonzales',
    pickupAddress: 'Naga City Hall',
    dropoffAddress: 'Robinsons Place Naga',
    status: 'IN_PROGRESS',
    fare: 65,
    distance: 2.1,
    createdAt: '2026-10-09 09:15:00',
  },
  {
    id: 'PTL-2026100903',
    riderId: 'USR005',
    riderName: 'Ana Reyes',
    status: 'SEARCHING',
    pickupAddress: 'Universidad de Sta. Isabel',
    dropoffAddress: 'LCC Mall Naga',
    fare: 75,
    distance: 2.8,
    createdAt: '2026-10-09 09:30:00',
  },
  {
    id: 'PTL-2026100904',
    riderId: 'USR001',
    riderName: 'Sofia Mendoza',
    driverId: 'USR004',
    driverName: 'Carlos Bautista',
    pickupAddress: 'Naga Metropolitan Cathedral',
    dropoffAddress: 'CamSur Capitol',
    status: 'COMPLETED',
    fare: 95,
    distance: 4.1,
    createdAt: '2026-10-08 14:20:00',
    completedAt: '2026-10-08 14:38:00',
    rating: 4,
  },
]

export const mockBookingEvents: BookingEvent[] = [
  {
    id: 'EVT001',
    bookingId: 'PTL-2026100901',
    type: 'CREATED',
    description: 'Booking created by rider',
    timestamp: '2026-10-09 08:30:00',
  },
  {
    id: 'EVT002',
    bookingId: 'PTL-2026100901',
    type: 'DRIVER_ASSIGNED',
    description: 'Driver Pedro Gonzales assigned',
    timestamp: '2026-10-09 08:31:30',
  },
  {
    id: 'EVT003',
    bookingId: 'PTL-2026100901',
    type: 'DRIVER_ARRIVED',
    description: 'Driver arrived at pickup location',
    timestamp: '2026-10-09 08:35:00',
  },
  {
    id: 'EVT004',
    bookingId: 'PTL-2026100901',
    type: 'TRIP_STARTED',
    description: 'Trip started',
    timestamp: '2026-10-09 08:37:00',
  },
  {
    id: 'EVT005',
    bookingId: 'PTL-2026100901',
    type: 'COMPLETED',
    description: 'Trip completed successfully',
    timestamp: '2026-10-09 08:45:00',
  },
]
