// ============================================================================
// Central Schedule Resolution Engine
// ----------------------------------------------------------------------------
// EVERY schedule-related feature (admin schedule page, patient booking page,
// availability API, booking API, appointment management) must go through this
// module so the whole application shares one scheduling logic.
//
// Nothing here depends on the admin ever opening the Schedule page: a date is
// always computed on the fly from
//
//     Chamber Default Schedule  +  Date-Specific Override  +  Real-time Count
//
// Resolution order for any (chamber, date):
//   1. Load chamber default configuration (visiting_days / start / end / limit)
//   2. Look for a date-specific override row (exists only if an admin edited it)
//   3. Apply override fields that are set (each field may inherit the default)
//   4. Determine status: available | off | closed
//   5. Count booked (non-cancelled) appointments for chamber + date
//   6. Calculate remaining capacity -> "full" when booked >= limit
//   7. Return the final resolved day
//
// Priority: Date Override -> Chamber Default Schedule -> Appointment Capacity
// ============================================================================

export const BOOKING_WINDOW_DAYS = 30;

export const STATUS = Object.freeze({
  AVAILABLE: 'available',
  OFF: 'off',
  CLOSED: 'closed',
  FULL: 'full',
});

// Statuses an admin may force on a specific date ("full" is always computed).
export const OVERRIDE_STATUSES = ['available', 'off', 'closed'];

// Appointment statuses that occupy capacity.
export const COUNTED_SQL = "status NOT IN ('cancelled', 'rejected')";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// ----------------------------------------------------------------------------
// Date / time helpers (all timezone-safe, based on plain YYYY-MM-DD strings)
// ----------------------------------------------------------------------------
export function isValidDate(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isValidTime(s) {
  return typeof s === 'string' && TIME_RE.test(s);
}

export function dayOfWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function getTimezone(env) {
  return (env && env.TIMEZONE) || 'Asia/Dhaka';
}

// Current local date/time in the clinic's timezone (Workers run in UTC).
export function localNow(tz, now = new Date()) {
  let parts = {};
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    });
    for (const p of fmt.formatToParts(now)) parts[p.type] = p.value;
  } catch {
    // Unknown timezone -> fall back to UTC
    const iso = now.toISOString();
    parts = { year: iso.slice(0, 4), month: iso.slice(5, 7), day: iso.slice(8, 10), hour: iso.slice(11, 13), minute: iso.slice(14, 16) };
  }
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const time = `${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}`;
  return { date, time, dow: dayOfWeek(date), timezone: tz };
}

// ----------------------------------------------------------------------------
// Chamber helpers
// ----------------------------------------------------------------------------
export function parseVisitingDays(raw) {
  let arr = raw;
  if (typeof raw === 'string') {
    try { arr = JSON.parse(raw); } catch { arr = []; }
  }
  if (!Array.isArray(arr)) return [];
  const set = new Set();
  for (const v of arr) {
    const n = Number(v);
    if (Number.isInteger(n) && n >= 0 && n <= 6) set.add(n);
  }
  return [...set].sort((a, b) => a - b);
}

export function normalizeChamber(row) {
  if (!row) return null;
  return {
    ...row,
    visiting_days: parseVisitingDays(row.visiting_days),
    daily_limit: Math.max(0, Number(row.daily_limit) || 0),
    is_active: Number(row.is_active) ? 1 : 0,
  };
}

export async function getChamber(db, id) {
  const cid = Number(id);
  if (!Number.isInteger(cid) || cid <= 0) return null;
  const row = await db.prepare('SELECT * FROM chambers WHERE id = ?').bind(cid).first();
  return normalizeChamber(row);
}

export async function listChambers(db, { activeOnly = false } = {}) {
  const sql = `SELECT * FROM chambers ${activeOnly ? 'WHERE is_active = 1' : ''} ORDER BY display_order ASC, id ASC`;
  const { results } = await db.prepare(sql).all();
  return results.map(normalizeChamber);
}

// Validates chamber payload coming from the admin UI. Returns { ok, error, data }.
export function validateChamberInput(body, { partial = false } = {}) {
  const data = {};
  const has = (k) => body[k] !== undefined;

  if (has('name') || !partial) {
    const name = String(body.name || '').trim();
    if (!name) return { ok: false, error: 'Chamber name is required' };
    if (name.length > 120) return { ok: false, error: 'Chamber name is too long' };
    data.name = name;
  }
  if (has('address')) data.address = String(body.address || '').trim() || null;
  if (has('phone')) data.phone = String(body.phone || '').trim() || null;

  if (has('visiting_days') || !partial) {
    data.visiting_days = JSON.stringify(parseVisitingDays(body.visiting_days ?? []));
  }

  if (has('start_time') || !partial) {
    if (!isValidTime(body.start_time)) return { ok: false, error: 'Start time must be HH:MM (24h)' };
    data.start_time = body.start_time;
  }
  if (has('end_time') || !partial) {
    if (!isValidTime(body.end_time)) return { ok: false, error: 'End time must be HH:MM (24h)' };
    data.end_time = body.end_time;
  }
  if (has('daily_limit') || !partial) {
    const n = Number(body.daily_limit);
    if (!Number.isInteger(n) || n < 1 || n > 500) return { ok: false, error: 'Daily limit must be between 1 and 500' };
    data.daily_limit = n;
  }
  if (has('is_active')) data.is_active = body.is_active ? 1 : 0;
  if (has('display_order')) data.display_order = Number(body.display_order) || 0;

  return { ok: true, data };
}

// ----------------------------------------------------------------------------
// Data loaders (sparse: overrides & counts only exist where data exists)
// ----------------------------------------------------------------------------
export async function getOverride(db, chamberId, date) {
  return db.prepare('SELECT * FROM schedule_overrides WHERE chamber_id = ? AND date = ?')
    .bind(chamberId, date).first();
}

export async function getOverridesInRange(db, chamberId, fromDate, toDate) {
  const { results } = await db.prepare(
    'SELECT * FROM schedule_overrides WHERE chamber_id = ? AND date >= ? AND date <= ?'
  ).bind(chamberId, fromDate, toDate).all();
  const map = new Map();
  for (const r of results) map.set(r.date, r);
  return map;
}

export async function getBookedCount(db, chamberId, date) {
  const row = await db.prepare(
    `SELECT COUNT(*) AS c FROM appointments WHERE chamber_id = ? AND appointment_date = ? AND ${COUNTED_SQL}`
  ).bind(chamberId, date).first();
  return Number(row?.c || 0);
}

export async function getBookedCountsInRange(db, chamberId, fromDate, toDate) {
  const { results } = await db.prepare(
    `SELECT appointment_date AS date, COUNT(*) AS c FROM appointments
     WHERE chamber_id = ? AND appointment_date >= ? AND appointment_date <= ? AND ${COUNTED_SQL}
     GROUP BY appointment_date`
  ).bind(chamberId, fromDate, toDate).all();
  const map = new Map();
  for (const r of results) map.set(r.date, Number(r.c));
  return map;
}

// ----------------------------------------------------------------------------
// Pure resolution (no I/O) - the heart of the engine
// ----------------------------------------------------------------------------
export function resolveDay({ chamber, date, override = null, booked = 0, now }) {
  const dow = dayOfWeek(date);

  // 1. chamber default
  const inDefaultSchedule = chamber.is_active === 1 && chamber.visiting_days.includes(dow);
  const baseStatus = inDefaultSchedule ? STATUS.AVAILABLE : STATUS.OFF;

  // 2-3. date-specific override (each field optional)
  const overrideStatus = override && OVERRIDE_STATUSES.includes(override.status) ? override.status : null;
  const start_time = (override && isValidTime(override.start_time)) ? override.start_time : chamber.start_time;
  const end_time = (override && isValidTime(override.end_time)) ? override.end_time : chamber.end_time;
  const limit = (override && override.appointment_limit != null && override.appointment_limit !== '')
    ? Math.max(0, Number(override.appointment_limit) || 0)
    : chamber.daily_limit;

  // 4. available / off / closed
  const scheduledStatus = overrideStatus || baseStatus;

  // 5-6. capacity
  const remaining = Math.max(0, limit - booked);
  const status = scheduledStatus === STATUS.AVAILABLE && booked >= limit ? STATUS.FULL : scheduledStatus;

  const is_past = date < now.date;
  const is_today = date === now.date;
  const ended = is_today && now.time >= end_time;
  const bookable = status === STATUS.AVAILABLE && !is_past && !ended;

  // 7. final resolved schedule
  return {
    date,
    day_of_week: dow,
    status,                 // available | full | off | closed
    scheduled_status: scheduledStatus, // status before capacity is applied
    base_status: baseStatus,           // what the chamber default alone would give
    is_override: !!override,
    override_status: overrideStatus,   // null when inheriting default
    start_time,
    end_time,
    limit,
    booked,
    remaining,
    is_past,
    is_today,
    ended,
    bookable,
  };
}

export function summarize(days) {
  const s = { available: 0, full: 0, off: 0, closed: 0, booked: 0, capacity: 0, overrides: 0 };
  for (const d of days) {
    s[d.status] = (s[d.status] || 0) + 1;
    s.booked += d.booked;
    if (d.status === STATUS.AVAILABLE || d.status === STATUS.FULL) s.capacity += d.limit;
    if (d.is_override) s.overrides += 1;
  }
  return s;
}

// ----------------------------------------------------------------------------
// I/O resolvers
// ----------------------------------------------------------------------------
export async function resolveDate(db, chamber, date, now) {
  const [override, booked] = await Promise.all([
    getOverride(db, chamber.id, date),
    getBookedCount(db, chamber.id, date),
  ]);
  return resolveDay({ chamber, date, override, booked, now });
}

export async function resolveRange(db, chamber, fromDate, days, now) {
  const count = Math.max(1, Math.min(Number(days) || BOOKING_WINDOW_DAYS, 90));
  const toDate = addDays(fromDate, count - 1);
  const [overrides, counts] = await Promise.all([
    getOverridesInRange(db, chamber.id, fromDate, toDate),
    getBookedCountsInRange(db, chamber.id, fromDate, toDate),
  ]);
  const out = [];
  for (let i = 0; i < count; i++) {
    const date = addDays(fromDate, i);
    out.push(resolveDay({
      chamber, date, now,
      override: overrides.get(date) || null,
      booked: counts.get(date) || 0,
    }));
  }
  return out;
}

// Human readable reason why a resolved day cannot be booked.
export function unavailableReason(day) {
  if (day.is_past) return 'This date has already passed';
  if (day.status === STATUS.OFF) return 'The chamber does not sit on this day';
  if (day.status === STATUS.CLOSED) return 'Booking is closed for this date';
  if (day.status === STATUS.FULL) return 'This date is fully booked. Please choose another date';
  if (day.ended) return "Today's visiting hours have already ended";
  return 'This date is not available for booking';
}
