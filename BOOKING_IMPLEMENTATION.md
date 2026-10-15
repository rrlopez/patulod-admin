# Passenger Booking Flow Implementation

This document describes the implementation of the passenger booking flow from start to finish, according to Phase 2 of the master plan.

## Overview

The booking flow consists of 10 screens and multiple backend services that handle:
1. Booking creation with fare calculation
2. Driver matching with configurable timeout
3. Real-time trip lifecycle management
4. Cancellation with stage-based fees
5. Payment and earnings tracking

## Backend Implementation

### 1. System Configuration

**Table**: `SystemConfig`
- Stores runtime configuration values
- All settings are configurable via admin panel

**Default Values**:
```
matching_timeout_seconds = 30
max_driver_pool_size = 20
cancellation_fee_passenger_before_assignment = 0
cancellation_fee_passenger_after_assignment = 20
cancellation_fee_driver_after_acceptance = 0
distance_calculation_method = HAVERSINE
```

**Seed Command**:
```bash
pnpm db:seed-config
```

### 2. Core Services

#### Fare Calculator (`src/lib/services/fare-calculator.ts`)
- **Distance Calculation**: Haversine formula for accurate distances
- **Fare Types**: 
  - Distance-based: `baseFare + (distanceKm * perKmRate)`, enforces `minimumFare`
  - Fixed fare: Returns predefined fare for specific routes (configured separately)
- **Commission Calculation**: Platform commission as percentage of passenger fare
- **Driver Earnings**: Passenger fare minus platform commission

#### Geofencing (`src/lib/services/geofencing.ts`)
- **Point-in-Polygon**: Ray-casting algorithm to validate locations
- **Service Area Validation**: Ensures pickup AND destination are within boundaries
- **Bounding Box**: Optimizes driver queries by calculating search radius

#### Cancellation Fees (`src/lib/services/cancellation-fees.ts`)
- **Stage-Based Logic**:
  - **Passenger**: ₱0 while SEARCHING, ₱20 after DRIVER_ASSIGNED
  - **Driver**: ₱0 (configurable) after accepting ride
- **Permission Validation**: 
  - Cannot cancel COMPLETED trips
  - Cannot cancel IN_PROGRESS trips (must complete or contact support)

#### Booking Reference (`src/lib/services/booking-reference.ts`)
- **Format**: `PTL-YYYYMMDDNN`
- **Example**: `PTL-2026101501` (15th booking on Oct 15, 2026)
- **Sequential**: Auto-increments per day

### 3. API Endpoints

#### Booking Endpoints

**POST `/api/mobile/bookings/create`**
- Creates booking with SEARCHING status
- Validates:
  - User exists, active, not suspended
  - Coordinates provided
  - Locations within service area
  - Idempotency key (prevents duplicates)
- Calculates fare using active FareConfig
- Generates unique booking reference
- Creates audit trail

**POST `/api/mobile/bookings/confirm`**
- Transitions booking to SEARCHING
- Starts matching engine
- Returns immediately (matching happens async)

**GET `/api/mobile/bookings/active`**
- Returns active booking for user
- Statuses: SEARCHING, DRIVER_ASSIGNED, DRIVER_ARRIVED, IN_PROGRESS

**POST `/api/mobile/bookings/cancel`**
- Validates cancellation is allowed at current stage
- Calculates and applies cancellation fee
- Records initiator and reason
- Creates booking event and audit log

**POST `/api/mobile/bookings/accept`** (Driver)
- **Atomic operation** using Prisma transaction
- Locks booking to prevent race conditions
- Only one driver can accept
- Validates:
  - Driver is approved and online
  - Driver has no active ride
  - Booking still in SEARCHING status
- Creates Trip record
- Updates booking to DRIVER_ASSIGNED

**POST `/api/mobile/bookings/decline`** (Driver)
- Records decline in audit log
- Returns booking to matching pool
- Driver remains available

#### Trip Lifecycle Endpoints

**POST `/api/mobile/trips/arrived`**
- Driver marks arrival at pickup
- Updates booking to DRIVER_ARRIVED
- Emits real-time event to passenger

**POST `/api/mobile/trips/start`**
- Requires DRIVER_ARRIVED status
- Sets Trip.startedAt timestamp
- Updates booking to IN_PROGRESS
- Emits event to both parties

**POST `/api/mobile/trips/complete`**
- Validates trip was started
- Calculates final fare (with adjustments if any)
- **Creates Earnings record**:
  - Passenger fare
  - Driver earnings (fare - commission)
  - Platform commission
- **Creates Payment record** (status: PENDING)
- Updates Trip.completedAt
- Emits completion event

### 4. Matching Engine (`src/lib/matching-engine.ts`)

**Flow**:
1. Find eligible drivers near pickup location
2. Query online, approved drivers in service area
3. Calculate distance from each driver to pickup
4. Sort by proximity, take top N (max_driver_pool_size)
5. Notify all eligible drivers via Socket.IO
6. Set timeout (default 30 seconds)
7. If no response → mark as NO_DRIVER_FOUND

**Driver Eligibility**:
- Role = DRIVER
- isActive = true
- isSuspended = false
- driverAvailability.isOnline = true
- No active ride
- Within service area

**Timeout Handling**:
- After timeout, check booking status
- If still SEARCHING → NO_DRIVER_FOUND
- Passenger can retry

### 5. State Machine

**Valid Transitions**:
```
SEARCHING → DRIVER_ASSIGNED, CANCELLED, NO_DRIVER_FOUND
DRIVER_ASSIGNED → DRIVER_ARRIVED, CANCELLED
DRIVER_ARRIVED → IN_PROGRESS, CANCELLED
IN_PROGRESS → COMPLETED, CANCELLED
COMPLETED → (terminal)
CANCELLED → (terminal)
NO_DRIVER_FOUND → SEARCHING (retry)
```

**Enforcement**:
- All state transitions validated in `trip-service.ts`
- Invalid transitions rejected with error
- Full audit trail via BookingEvent and TripEvent tables

### 6. Real-Time Events (Socket.IO)

**To Passenger**:
- `booking:searching` - Search started
- `booking:driver_assigned` - Driver matched (with driver info)
- `booking:no_driver_found` - Timeout reached
- `trip:driver_arrived` - Driver at pickup
- `trip:started` - Trip in progress
- `trip:location_update` - Driver GPS updates
- `trip:completed` - Trip finished

**To Driver**:
- `driver:ride_request` - Incoming booking request
- `driver:ride_cancelled` - Passenger cancelled

**Implementation Note**: Socket.IO events marked as TODO in code. Requires socket server setup.

## Database Schema

### New/Modified Tables

**SystemConfig** (new)
- Stores configurable runtime settings
- Key-value pairs with descriptions

**Booking** (existing, using)
- All fields already defined in schema
- Uses FareConfig for versioned fare tracking
- Idempotency key prevents duplicates

**Trip** (existing, using)
- Links to Booking (one-to-one)
- Tracks startedAt, completedAt, finalFare
- Records cancellation details

**Earnings** (existing, using)
- Created on trip completion
- Separates passenger fare, driver earnings, commission
- Tracks adjustments and settlement

**Payment** (existing, using)
- Created on trip completion
- Status: PENDING until driver confirms cash received

## Mobile App Implementation

### Screen Flow

1. **Home** → "Book a Ride" button
2. **Booking Form** → Pickup/destination input with map
3. **Service Selection** → Vehicle type + passenger count
4. **Fare Estimate** → Show fare breakdown
5. **Review & Confirm** → Final summary before booking
6. **Searching** → Animated indicator, Socket.IO listener
7. **Driver Assigned** → Driver info card, contact button
8. **Driver En Route** → Map with live location updates
9. **Trip In Progress** → Active trip tracking
10. **Trip Complete** → Final fare, navigate to summary

### API Client (`lib/api/bookings.ts`)

```typescript
// Create booking
POST /api/mobile/bookings/create
{
  userId, pickupAddress, destinationAddress,
  pickupLat, pickupLng, destinationLat, destinationLng,
  serviceType, passengerCount, paymentMethod, idempotencyKey
}

// Confirm and start matching
POST /api/mobile/bookings/confirm
{ bookingId, userId }

// Get active booking (for state recovery)
GET /api/mobile/bookings/active?userId={userId}

// Cancel booking
POST /api/mobile/bookings/cancel
{ bookingId, userId, initiator: 'PASSENGER', reason? }

// Driver accept
POST /api/mobile/bookings/accept
{ bookingId, driverId }

// Trip lifecycle
POST /api/mobile/trips/arrived
{ tripId, driverId }

POST /api/mobile/trips/start
{ tripId, driverId }

POST /api/mobile/trips/complete
{ tripId, driverId, finalFare?, fareAdjustmentReason? }
```

### State Management (`lib/stores/booking-store.ts`)

```typescript
interface BookingState {
  activeBooking: Booking | null
  currentScreen: 'home' | 'booking' | 'searching' | ...
  socketConnected: boolean
  driverLocation: { lat: number; lng: number } | null
}
```

### Socket.IO Client (`lib/socket-client.ts`)

- Connect with JWT token
- Auto-reconnect on disconnect
- Subscribe to booking-specific room
- Update store on events
- Handle offline gracefully

### Offline Mode

- Detect offline using `expo-network`
- Show banner: "You are offline. Booking requires an active connection."
- Block booking creation entirely (no queueing)
- Allow viewing existing trip summary/history

## Testing Checklist

### Unit Tests
- [ ] Fare calculation (distance-based and fixed)
- [ ] Geofencing (point-in-polygon)
- [ ] Cancellation fee logic
- [ ] Booking reference generation
- [ ] State transition validation

### Integration Tests
- [ ] Create booking flow
- [ ] Confirm and start matching
- [ ] Driver accept (atomic locking)
- [ ] Concurrent driver acceptance (only one succeeds)
- [ ] Cancel at various stages
- [ ] Complete trip → creates Earnings + Payment

### E2E Tests
- [ ] Full passenger flow: create → confirm → assigned → trip → complete
- [ ] Matching timeout → NO_DRIVER_FOUND
- [ ] Driver decline → continues matching
- [ ] Passenger cancels before assignment (₱0 fee)
- [ ] Passenger cancels after assignment (₱20 fee)
- [ ] Cannot cancel IN_PROGRESS trip

### Edge Cases
- [ ] Duplicate idempotency key returns existing booking
- [ ] Pickup outside service area rejected
- [ ] Destination outside service area rejected
- [ ] Suspended user cannot book
- [ ] Driver with active ride cannot accept new booking
- [ ] Invalid state transitions rejected

## Deployment Steps

### 1. Database Migration
```bash
# Generate Prisma client
pnpm db:generate

# Push schema changes
pnpm db:push

# Seed system config
pnpm db:seed-config
```

### 2. Environment Variables
```env
DATABASE_URL=postgresql://...
SOCKET_IO_PORT=3001
```

### 3. Start Services
```bash
# Start admin backend
pnpm dev

# Start Socket.IO server (separate process)
# TODO: Create socket server startup script
```

### 4. Verify
- [ ] Admin backend running on port 3000
- [ ] All API endpoints respond
- [ ] Database tables created
- [ ] System config seeded

## TODO / Next Steps

1. **Socket.IO Server Setup**
   - Create standalone Socket.IO server
   - Implement authentication middleware
   - Add room-based broadcasting
   - Handle reconnection

2. **Driver Location Tracking**
   - Add DriverLocation table for GPS history
   - Implement location update endpoint
   - Store last known location for matching

3. **Admin Panel Integration**
   - System config editor UI
   - Live booking monitoring dashboard
   - Manual intervention tools

4. **Mobile App Screens**
   - Wire all 10 screens to backend
   - Implement Socket.IO client
   - Add offline detection banner
   - Test on iOS and Android

5. **Testing**
   - Write unit tests for all services
   - Integration tests for API endpoints
   - E2E tests for full booking flow

6. **Performance Optimization**
   - Add database indexes
   - Implement caching for fare configs
   - Optimize driver query with spatial indexes

7. **Error Handling**
   - User-friendly error messages
   - Retry logic for network failures
   - Graceful degradation

## Architecture Decisions

### Why Atomic Locking for Driver Acceptance?
- Prevents race condition where multiple drivers accept same booking
- Uses Prisma transaction to ensure only one succeeds
- Losing drivers get clear error message

### Why Separate Booking and Trip Tables?
- Booking = passenger intent and matching state
- Trip = actual ride execution with driver
- Allows querying bookings without trips (cancelled, no driver found)

### Why Stage-Based Cancellation Fees?
- Incentivizes commitment after driver assignment
- Fair to drivers who changed their route
- Configurable via system config

### Why Idempotency Keys?
- Network retries common on mobile
- Prevents duplicate bookings
- Returns existing booking if key matches

### Why Versioned Fare Configs?
- Fare can change over time
- Each booking records which config was active
- Ensures final fare basis is always traceable

## Support

For questions or issues, refer to:
- Master Plan: `docs/master-plan.md`
- Prisma Schema: `prisma/schema.prisma`
- API Endpoints: `src/routes/api/mobile/`
- Services: `src/lib/services/`
