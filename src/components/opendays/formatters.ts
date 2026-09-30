/**
 * Format a Date object into a readable Hungarian date string:
 * e.g. "2026. október 12., hétfő"
 */
export function formatOpenDayDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

/**
 * Format a Date object into "HH:mm":
 * e.g. "09:00"
 */
export function formatTime(date: Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString("hu-HU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Format a time range from two Date objects:
 * e.g. "09:00 - 09:45"
 */
export function formatTimeRange(start: Date, end: Date): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Get the overall time span of an open day based on its classes
 */
export function getOpenDayTimeRange(
  classes: { startTime: Date; endTime: Date }[],
): string {
  if (!classes || classes.length === 0) return "";
  const startTimes = classes.map((c) => new Date(c.startTime).getTime());
  const endTimes = classes.map((c) => new Date(c.endTime).getTime());
  const minStart = new Date(Math.min(...startTimes));
  const maxEnd = new Date(Math.max(...endTimes));
  return `${formatTime(minStart)} - ${formatTime(maxEnd)}`;
}

/**
 * Format Date to "YYYY-MM-DD" for HTML date input
 */
export function toDateInputValue(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format Date to "HH:mm" for HTML time input
 */
export function toTimeInputValue(date: Date): string {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Combine a base Date and a "HH:mm" time string into a Date object
 */
export function combineDateAndTime(baseDate: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const result = new Date(baseDate);
  result.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return result;
}

/**
 * Format a Date object into "YYYY.MM.DD HH:mm"
 */
export function formatDateTime(date: Date): string {
  const d = new Date(date);
  return d.toLocaleString("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
