/**
 * Formatting utilities.
 */

/** Format minutes to human-readable string (e.g., "2h 30m", "45m") */
export function formatMins(m) {
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${m}m`;
  if (rem === 0) return `${h}h 00m`;
  return `${h}h ${String(rem).padStart(2, '0')}m`;
}

/** Format a number with commas */
export function formatNumber(n) {
  return n.toLocaleString();
}

/** Pluralize a word */
export function pluralize(count, singular, plural) {
  return count === 1 ? singular : (plural || singular + 's');
}
