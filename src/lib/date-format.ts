/**
 * Safe date formatting utilities
 * Handles various date input formats (Date objects, ISO strings, timestamps)
 */

export function formatDate(
  date: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  },
): string {
  if (!date) return '—'
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date
    
    if (isNaN(dateObj.getTime())) {
      return '—'
    }
    
    return dateObj.toLocaleDateString('en-US', options)
  } catch (error) {
    console.error('Date formatting error:', error, date)
    return '—'
  }
}

export function formatDateTime(
  date: Date | string | number | null | undefined,
): string {
  return formatDate(date, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
