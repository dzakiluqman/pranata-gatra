import type { RecurrenceUnit, Schedule } from "../types/schedule.types";

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function differenceInDays(from: Date, to: Date): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.floor(
    (normalizeDate(to).getTime() - normalizeDate(from).getTime()) /
      millisecondsPerDay,
  );
}

function differenceInMonths(from: Date, to: Date): number {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth())
  );
}

export function isScheduleOnDate(
  schedule: Schedule,
  targetDate: Date,
): boolean {
  const startDate = parseDateOnly(schedule.startDate);
  const date = normalizeDate(targetDate);

  // Check if target date is before start date
  if (date < startDate) {
    return false;
  }

  // Check if target date is after end date (if recurrence end date is set)
  if (schedule.recurrenceEndDate) {
    const endDate = parseDateOnly(schedule.recurrenceEndDate);
    if (date > endDate) {
      return false;
    }
  }

  // If recurrence is not enabled, only match the start date
  if (!schedule.recurrenceEnabled) {
    return date.getTime() === startDate.getTime();
  }

  // Recurrence is enabled - check based on recurrence unit
  const interval = Math.max(1, schedule.recurrenceInterval);
  const unit: RecurrenceUnit = schedule.recurrenceUnit;

  switch (unit) {
    case "day": {
      const days = differenceInDays(startDate, date);
      return days % interval === 0;
    }

    case "week": {
      const days = differenceInDays(startDate, date);
      const weeks = Math.floor(days / 7);
      return days % 7 === 0 && weeks % interval === 0;
    }

    case "month": {
      const months = differenceInMonths(startDate, date);

      // Check if the interval matches
      if (months % interval !== 0) {
        return false;
      }

      // Check if the day of month matches
      return date.getDate() === startDate.getDate();
    }

    default:
      return false;
  }
}

export function getOccurrenceDate(
  schedule: Schedule,
  targetDate: Date,
): string | null {
  if (!isScheduleOnDate(schedule, targetDate)) {
    return null;
  }

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatRecurrence(schedule: Schedule): string {
  if (!schedule.recurrenceEnabled) {
    return "Sekali";
  }

  const interval = schedule.recurrenceInterval;
  const unit = schedule.recurrenceUnit;

  // Label for each unit in singular form
  const singularLabels: Record<RecurrenceUnit, string> = {
    day: "hari",
    week: "minggu",
    month: "bulan",
  };

  // Prefix for display
  const prefixLabels: Record<RecurrenceUnit, string> = {
    day: "Setiap",
    week: "Setiap",
    month: "Setiap",
  };

  if (interval === 1) {
    // For single interval, use specific phrases
    const singlePhrases: Record<RecurrenceUnit, string> = {
      day: "Setiap hari",
      week: "Setiap minggu",
      month: "Setiap bulan",
    };
    return singlePhrases[unit];
  }

  // For multiple intervals, use plural form
  return `${prefixLabels[unit]} ${interval} ${singularLabels[unit]}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
