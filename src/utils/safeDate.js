/**
 * Safely converts a date string to a Date object or returns null
 * @param {string|undefined|null} dateStr - Date string to parse
 * @returns {Date|null} - Parsed date or null if invalid
 */
export function safeDate(dateStr) {
  if (!dateStr || dateStr === "" || dateStr === "Not mentioned") {
    return null;
  }

  const date = new Date(dateStr);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * Normalizes a value: converts empty strings, "Not mentioned", undefined to null
 * @param {any} value - Value to normalize
 * @returns {any} - Normalized value
 */
export function normalizeValue(value) {
  if (value === "" || value === "Not mentioned" || value === undefined || value === null) {
    return null;
  }
  return value;
}

