/**
 * Format a Date object into a readable Hungarian date string:
 * e.g. "2026. október 12., hétfő"
 */
export function formatOpenDayDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("hu-HU", {
    timeZone: "Europe/Budapest",
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
    timeZone: "Europe/Budapest",
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
 * Get the start time of an open day based on its earliest class
 */
export function getOpenDayStartTime(classes: { startTime: Date }[]): string {
  if (!classes || classes.length === 0) return "";
  const startTimes = classes.map((c) => new Date(c.startTime).getTime());
  const minStart = new Date(Math.min(...startTimes));
  return formatTime(minStart);
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
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Returns the calendar date in "YYYY-MM-DD" format in the "Europe/Budapest" time zone.
 */
export function getBudapestDateString(date: Date | string | number): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(d);
  let year = "";
  let month = "";
  let day = "";
  for (const part of parts) {
    if (part.type === "year") year = part.value;
    else if (part.type === "month") month = part.value;
    else if (part.type === "day") day = part.value;
  }
  return `${year}-${month}-${day}`;
}

/**
 * Check if an open day date is strictly in the future (after today in Europe/Budapest).
 * If the open day is today or in the past, returns false.
 */
export function isFutureOpenDay(date: Date | string | number): boolean {
  const openDayStr = getBudapestDateString(date);
  if (!openDayStr) return false;
  const todayStr = getBudapestDateString(new Date());
  return openDayStr > todayStr;
}
