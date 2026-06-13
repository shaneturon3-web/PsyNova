export type ParsedJaneEvent = {
  uid: string;
  summary: string;
  startAt: string;
  endAt?: string;
};

/** Minimal iCal VEVENT parser (Jane WebCal feed). */
export function parseIcalEvents(icalText: string): ParsedJaneEvent[] {
  const blocks = icalText.split(/BEGIN:VEVENT/i).slice(1);
  const events: ParsedJaneEvent[] = [];

  for (const block of blocks) {
    const uid = extractField(block, 'UID') ?? `evt-${events.length + 1}`;
    const summary = extractField(block, 'SUMMARY') ?? 'Patient';
    const dtStart = parseIcalDate(extractField(block, 'DTSTART'));
    const dtEnd = parseIcalDate(extractField(block, 'DTEND'));
    if (!dtStart) continue;
    events.push({
      uid,
      summary: summary.replace(/\\n/g, ' ').trim(),
      startAt: dtStart,
      endAt: dtEnd,
    });
  }
  return events;
}

function extractField(block: string, key: string): string | undefined {
  const re = new RegExp(`^${key}[^:]*:(.+)$`, 'im');
  const m = block.match(re);
  return m?.[1]?.trim();
}

function parseIcalDate(raw?: string): string | undefined {
  if (!raw) return undefined;
  const v = raw.replace(/;.*$/, '').trim();
  if (/^\d{8}T\d{6}Z?$/i.test(v)) {
    const y = v.slice(0, 4);
    const mo = v.slice(4, 6);
    const d = v.slice(6, 8);
    const h = v.slice(9, 11);
    const mi = v.slice(11, 13);
    const s = v.slice(13, 15);
    const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
    return new Date(iso).toISOString();
  }
  if (/^\d{8}$/.test(v)) {
    return new Date(`${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}T12:00:00Z`).toISOString();
  }
  const parsed = Date.parse(v);
  return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString();
}
