/**
 * GeoJSON Point type
 */
interface Point {
  type: 'Point'
  coordinates: [number, number] // [lng, lat]
}

/**
 * GeoJSON Polygon type
 */
interface Polygon {
  type: 'Polygon'
  coordinates: [number, number][][] // Array of rings, first is exterior
}

/**
 * Check if a point is inside a polygon using ray-casting algorithm
 * @param point [lng, lat]
 * @param polygon GeoJSON Polygon coordinates
 * @returns true if point is inside polygon
 */
export function isPointInPolygon(
  point: [number, number],
  polygon: [number, number][][]
): boolean {
  const [lng, lat] = point
  const ring = polygon[0] // Use exterior ring only

  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]

    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi

    if (intersect) inside = !inside
  }

  return inside
}

/**
 * Validate if coordinates are within service area boundary
 */
export function isWithinServiceArea(
  lat: number,
  lng: number,
  serviceAreaBoundary: Polygon
): boolean {
  const point: [number, number] = [lng, lat]
  return isPointInPolygon(point, serviceAreaBoundary.coordinates)
}

/**
 * Validate both pickup and destination are within service area
 */
export function validateBookingLocations(
  pickupLat: number,
  pickupLng: number,
  destinationLat: number,
  destinationLng: number,
  serviceAreaBoundary: Polygon
): { valid: boolean; error?: string } {
  const pickupInArea = isWithinServiceArea(pickupLat, pickupLng, serviceAreaBoundary)
  const destinationInArea = isWithinServiceArea(
    destinationLat,
    destinationLng,
    serviceAreaBoundary
  )

  if (!pickupInArea && !destinationInArea) {
    return {
      valid: false,
      error: 'Both pickup and destination are outside the service area',
    }
  }

  if (!pickupInArea) {
    return {
      valid: false,
      error: 'Pickup location is outside the service area',
    }
  }

  if (!destinationInArea) {
    return {
      valid: false,
      error: 'Destination is outside the service area',
    }
  }

  return { valid: true }
}

/**
 * Calculate bounding box for a set of coordinates
 * Useful for optimizing driver queries
 */
export function calculateBoundingBox(
  lat: number,
  lng: number,
  radiusKm: number
): {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
} {
  const latDelta = radiusKm / 111.32 // 1 degree latitude ≈ 111.32 km
  const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  }
}
