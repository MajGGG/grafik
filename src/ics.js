// Zamiana zmian z Kadromierza na plik iCalendar (.ics)
const VTIMEZONE = [
  'BEGIN:VTIMEZONE', 'TZID:Europe/Warsaw',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST',
  'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET',
  'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
  'END:VTIMEZONE',
];

const esc = (s = '') => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

// Akceptuje "2026-10-27 08:00:00", "2026-10-27T08:00:00" lub ISO ze strefą
function toIcsTime(value) {
  const str = String(value);
  if (/[zZ]|[+-]\d\d:?\d\d$/.test(str)) {
    const d = new Date(str);
    const local = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Warsaw' }));
    return fmt(local);
  }
  const m = str.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) throw new Error(`Nieznany format daty: ${str}`);
  return `${m[1]}${m[2]}${m[3]}T${m[4]}${m[5]}${m[6] || '00'}`;
}
function fmt(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// Zawijanie linii do 75 znaków (wymóg RFC 5545)
const fold = (line) => line.match(/.{1,74}/g).join('\r\n ');

export function buildIcs(shifts) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kadromierz addon//PL', 'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH', 'X-WR-CALNAME:Grafik Kadromierz', 'X-WR-TIMEZONE:Europe/Warsaw',
    'REFRESH-INTERVAL;VALUE=DURATION:PT3H', 'X-PUBLISHED-TTL:PT3H', ...VTIMEZONE,
  ];
  for (const s of shifts) {
    if (s.draft) continue; // tylko opublikowane zmiany
    const location = s.location?.name || '';
    const job = s.job_title?.title || '';
    lines.push(
      'BEGIN:VEVENT',
      `UID:kadromierz-${s.id}@kadromierz-addon`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Europe/Warsaw:${toIcsTime(s.start_timestamp)}`,
      `DTEND;TZID=Europe/Warsaw:${toIcsTime(s.end_timestamp)}`,
      `SUMMARY:${esc(`Zmiana${location ? ' – ' + location : ''}`)}`,
      `LOCATION:${esc(location)}`,
      `DESCRIPTION:${esc([job && `Stanowisko: ${job}`, s.comment].filter(Boolean).join('\n'))}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc('Jutro zmiana' + (location ? ' – ' + location : ''))}`,
      'TRIGGER:-P1D', 'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
