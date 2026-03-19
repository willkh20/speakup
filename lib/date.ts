const KST_OFFSET = 9 * 60; // minutes

/** Returns current date string in KST: "YYYY-MM-DD" */
export function todayKST(): string {
  return toKSTDateStr(new Date());
}

/** Converts any Date to "YYYY-MM-DD" in KST */
export function toKSTDateStr(d: Date): string {
  const kst = new Date(d.getTime() + KST_OFFSET * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

/** Returns the Monday of the current week in KST as "YYYY-MM-DD" */
export function weekStartKST(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + KST_OFFSET * 60 * 1000);
  const dow = kst.getUTCDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  kst.setUTCDate(kst.getUTCDate() + diff);
  return kst.toISOString().slice(0, 10);
}

/** Returns the 7 days of current week (Mon–Sun) as Date objects in KST */
export function weekDaysKST(): Date[] {
  const now = new Date();
  const kst = new Date(now.getTime() + KST_OFFSET * 60 * 1000);
  const dow = kst.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  const start = new Date(kst);
  start.setUTCDate(kst.getUTCDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return d;
  });
}
