// Deterministic US equity (NYSE/Nasdaq) session calendar. No network, no LLM.
// Regular session 09:30-16:00 America/New_York, Monday-Friday, minus exchange holidays; early closes at 13:00.
// Daylight saving is handled by the IANA timezone database (Intl), never by fixed offsets.
// Source: NYSE published holidays and early closes for 2026-2027 (nyse.com/markets/hours-calendars),
// cross-checked against MAXXAGENT src/lib/marketHours.ts (MIT, 0xAxelow.eth). Outside COVERAGE the
// calendar FAILS CLOSED: isTradingDay() returns null and callers must report "calendar_not_covered".

export const CALENDAR_VERSION = "nyse-2026-2027.1";
export const COVERAGE = { from: "2026-01-01", to: "2027-12-31" } as const;
export const HOLIDAYS: ReadonlySet<string> = new Set([
  "2026-01-01", "2026-01-19", "2026-02-16", "2026-04-03", "2026-05-25", "2026-06-19", "2026-07-03", "2026-09-07", "2026-11-26", "2026-12-25",
  "2027-01-01", "2027-01-18", "2027-02-15", "2027-03-26", "2027-05-31", "2027-06-18", "2027-07-05", "2027-09-06", "2027-11-25", "2027-12-24",
]);
export const EARLY_CLOSES: ReadonlySet<string> = new Set(["2026-11-27", "2026-12-24", "2027-11-26"]);

const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });

/** New York calendar date, weekday and minutes after midnight for a unix time in seconds. */
export function nyParts(unixSec: number): { date: string; weekday: string; minutes: number } {
  const p = Object.fromEntries(fmt.formatToParts(new Date(unixSec * 1000)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, weekday: p.weekday, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

export const covered = (date: string) => date >= COVERAGE.from && date <= COVERAGE.to;

/** true / false for a covered NY date; null when the date is outside the maintained calendar. */
export function isTradingDay(date: string): boolean | null {
  if (!covered(date)) return null;
  const wd = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (wd === 0 || wd === 6) return false;
  return !HOLIDAYS.has(date);
}

/** Unix seconds of a New York wall-clock time on a NY date (DST-correct). */
export function nyTime(date: string, hh: number, mm: number): number {
  const target = hh * 60 + mm;
  for (const offsetH of [4, 5]) {
    const t = Date.parse(`${date}T00:00:00Z`) / 1000 + (target + offsetH * 60) * 60;
    const p = nyParts(t);
    if (p.date === date && p.minutes === target) return t;
  }
  throw new Error(`cannot place ${date} ${hh}:${mm} in New York time`);
}

export const sessionOpen = (date: string) => nyTime(date, 9, 30);
export const sessionClose = (date: string) => (EARLY_CLOSES.has(date) ? nyTime(date, 13, 0) : nyTime(date, 16, 0));

/** Every NY date from `from` to `to` inclusive (YYYY-MM-DD). */
export function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = Date.parse(`${from}T12:00:00Z`); d <= Date.parse(`${to}T12:00:00Z`); d += 86_400_000) out.push(new Date(d).toISOString().slice(0, 10));
  return out;
}
