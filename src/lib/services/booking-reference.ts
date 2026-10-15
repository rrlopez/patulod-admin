/**
 * Generate a unique booking reference in format: PTL-YYYYMMDDNN
 * Example: PTL-2026101501
 * 
 * YYYYMMDD = Date
 * NN = Sequential number for that day (01-99)
 */
export function generateBookingReference(date: Date, sequenceNumber: number): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const sequence = String(sequenceNumber).padStart(2, '0')

  return `PTL-${year}${month}${day}${sequence}`
}

/**
 * Extract date from booking reference
 */
export function parseBookingReference(reference: string): {
  date: Date | null
  sequence: number | null
} {
  const match = reference.match(/^PTL-(\d{4})(\d{2})(\d{2})(\d{2})$/)

  if (!match) {
    return { date: null, sequence: null }
  }

  const [, year, month, day, sequence] = match

  return {
    date: new Date(Number(year), Number(month) - 1, Number(day)),
    sequence: Number(sequence),
  }
}

/**
 * Get today's booking reference prefix (PTL-YYYYMMDD)
 */
export function getTodayReferencePrefix(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `PTL-${year}${month}${day}`
}
