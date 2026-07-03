// Small date helpers for the member app, in French locale.

export function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export interface CalendarCell {
  date: Date;
  day: number;
  inMonth: boolean;
  key: string;
}

/** Local calendar day key (YYYY-MM-DD) for a date, used to bucket events. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Build a 6-week (42 cells) grid for the given year/month, starting on Monday,
 * so the calendar layout is always stable regardless of the month length.
 */
export function monthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1);
  // getDay: 0=Sunday..6=Saturday; shift so Monday is the first column.
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    cells.push({ date, day: date.getDate(), inMonth: date.getMonth() === month, key: dayKey(date) });
  }
  return cells;
}

const MONTH_NAMES_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function monthLabel(year: number, month: number, lang: "fr" | "en"): string {
  const names = lang === "en" ? MONTH_NAMES_EN : MONTH_NAMES_FR;
  return `${names[month]} ${year}`;
}
