/**
 * Timezone-safe Date and Time formatting utilities for Pranata Gatra.
 * Prevents date shifting across timezones (e.g. Asia/Jakarta UTC+7).
 */

/**
 * Parses a "YYYY-MM-DD" or ISO string into a local Date object without timezone drift.
 */
export function parseLocalDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }

  // Handle "YYYY-MM-DD" format
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [year, month, day] = input.split('-').map(Number);
    // Use noon to avoid any edge-of-day DST or offset adjustments
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  // Handle ISO or standard strings
  const parsed = new Date(input);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Parses "HH:mm" or "HH.mm" string into a Date object on the given date (default today).
 */
export function parseLocalTime(
  timeStr: string | Date | null | undefined,
  baseDate?: Date
): Date {
  const base = baseDate ? new Date(baseDate) : new Date();

  if (!timeStr) {
    base.setSeconds(0, 0);
    return base;
  }

  if (timeStr instanceof Date) {
    return isNaN(timeStr.getTime()) ? base : timeStr;
  }

  const clean = timeStr.replace('.', ':');
  const parts = clean.split(':').map(Number);
  const hours = parts[0] ?? 8;
  const minutes = parts[1] ?? 0;

  base.setHours(hours, minutes, 0, 0);
  return base;
}

/**
 * Converts a Date to "YYYY-MM-DD" string using local timezone (NOT UTC).
 */
export function formatDateToYMD(date: Date | null | undefined): string {
  if (!date || isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a Date or "HH:mm" to "HH:mm" 24-hour time string.
 */
export function formatTimeToHHMM(time: Date | string | null | undefined): string {
  if (!time) return '';
  if (typeof time === 'string') {
    const clean = time.replace('.', ':').trim();
    const [h, m] = clean.split(':');
    if (h !== undefined && m !== undefined) {
      return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    }
    return clean;
  }
  if (isNaN(time.getTime())) return '';
  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Formats date into readable Indonesian display: "14 September 2026".
 */
export function formatDisplayDate(
  date: Date | string | null | undefined,
  options?: { shortMonth?: boolean; includeWeekday?: boolean }
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  if (!d || isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('id-ID', {
    weekday: options?.includeWeekday ? 'long' : undefined,
    day: 'numeric',
    month: options?.shortMonth ? 'short' : 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Formats time into readable display: "08:30".
 */
export function formatDisplayTime(time: Date | string | null | undefined): string {
  return formatTimeToHHMM(time);
}

/**
 * Formats full datetime: "14 September 2026, 08:30".
 */
export function formatDisplayDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return '';

  const datePart = formatDisplayDate(d);
  const timePart = formatTimeToHHMM(d);
  return `${datePart}, ${timePart}`;
}

/**
 * Day of week constants and helpers (1 = Senin, ..., 7 = Minggu).
 */
export interface DayOfWeekItem {
  id: number; // 1 to 7
  shortName: string; // Sen, Sel, Rab, ...
  fullName: string; // Senin, Selasa, Rabu, ...
}

export const DAYS_OF_WEEK: DayOfWeekItem[] = [
  { id: 1, shortName: 'Sen', fullName: 'Senin' },
  { id: 2, shortName: 'Sel', fullName: 'Selasa' },
  { id: 3, shortName: 'Rab', fullName: 'Rabu' },
  { id: 4, shortName: 'Kam', fullName: 'Kamis' },
  { id: 5, shortName: 'Jum', fullName: 'Jumat' },
  { id: 6, shortName: 'Sab', fullName: 'Sabtu' },
  { id: 7, shortName: 'Min', fullName: 'Minggu' },
];

/**
 * Gets day of week name from date (e.g. "Senin").
 */
export function getDayName(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  if (!d || isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(d);
}

/**
 * Combines a date (Date or "YYYY-MM-DD") and a time (Date or "HH:mm") into a single Date.
 * If timeInput is not provided, defaults to 23:59 for deadlines or preserves existing time.
 */
export function combineDateAndTime(
  dateInput: Date | string,
  timeInput?: Date | string | null,
  defaultToEndOfDay = false
): Date {
  const d = typeof dateInput === 'string' ? parseLocalDate(dateInput) ?? new Date() : new Date(dateInput);

  if (timeInput) {
    if (typeof timeInput === 'string') {
      const clean = timeInput.replace('.', ':');
      const [h, m] = clean.split(':').map(Number);
      d.setHours(h ?? 0, m ?? 0, 0, 0);
    } else if (timeInput instanceof Date && !isNaN(timeInput.getTime())) {
      d.setHours(timeInput.getHours(), timeInput.getMinutes(), 0, 0);
    }
  } else if (defaultToEndOfDay) {
    d.setHours(23, 59, 0, 0);
  }

  return d;
}

