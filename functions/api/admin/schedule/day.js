import { parseBody, json } from '../../_middleware.js';
import {
  getChamber, getOverride, resolveDate, localNow, getTimezone,
  isValidDate, isValidTime, OVERRIDE_STATUSES,
} from '../../_lib/schedule.js';

async function loadDay(db, chamber, date, now) {
  const [day, override, apptRes] = await Promise.all([
    resolveDate(db, chamber, date, now),
    getOverride(db, chamber.id, date),
    db.prepare(
      `SELECT a.id, a.reference, a.serial_number, a.status, a.message, a.admin_note, a.created_at,
              a.start_time, a.end_time,
              p.name AS patient_name, p.phone AS patient_phone, p.email AS patient_email
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       WHERE a.chamber_id = ? AND a.appointment_date = ?
       ORDER BY (a.serial_number IS NULL), a.serial_number ASC, a.created_at ASC`
    ).bind(chamber.id, date).all(),
  ]);

  return {
    chamber,
    date,
    today: now.date,
    day,
    override: override || null,
    appointments: apptRes.results,
  };
}

// GET /api/admin/schedule/day?chamber_id=1&date=YYYY-MM-DD
// Resolved day + raw override (if any) + the appointments booked for that date.
export async function onRequestGet(context) {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const chamberId = url.searchParams.get('chamber_id');
  const date = url.searchParams.get('date');

  if (!chamberId || !date) return json({ error: 'chamber_id and date are required' }, 400);
  if (!isValidDate(date)) return json({ error: 'Invalid date' }, 400);

  const chamber = await getChamber(db, chamberId);
  if (!chamber) return json({ error: 'Chamber not found' }, 404);

  const now = localNow(getTimezone(context.env));
  return json(await loadDay(db, chamber, date, now));
}

// PUT /api/admin/schedule/day
// body: { chamber_id, date, status?, start_time?, end_time?, appointment_limit?, note? }
//
// Creates/updates a date-specific override affecting ONLY that date.
// Send null for a field to make it inherit the chamber default again.
// Sending everything as null removes the override row entirely.
export async function onRequestPut(context) {
  const db = context.env.DB;
  const body = await parseBody(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const { chamber_id, date } = body;
  if (!chamber_id || !date) return json({ error: 'chamber_id and date are required' }, 400);
  if (!isValidDate(date)) return json({ error: 'Invalid date' }, 400);

  const chamber = await getChamber(db, chamber_id);
  if (!chamber) return json({ error: 'Chamber not found' }, 404);

  const now = localNow(getTimezone(context.env));
  if (date < now.date) return json({ error: 'Past dates cannot be modified' }, 400);

  const existing = await getOverride(db, chamber.id, date);

  // Start from the current override so partial updates work, then apply body.
  const next = {
    status: existing?.status ?? null,
    start_time: existing?.start_time ?? null,
    end_time: existing?.end_time ?? null,
    appointment_limit: existing?.appointment_limit ?? null,
    note: existing?.note ?? null,
  };

  if (body.status !== undefined) {
    if (body.status !== null && body.status !== '' && !OVERRIDE_STATUSES.includes(body.status)) {
      return json({ error: 'Status must be available, off or closed' }, 400);
    }
    next.status = body.status || null;
  }
  if (body.start_time !== undefined) {
    if (body.start_time && !isValidTime(body.start_time)) return json({ error: 'Start time must be HH:MM' }, 400);
    next.start_time = body.start_time || null;
  }
  if (body.end_time !== undefined) {
    if (body.end_time && !isValidTime(body.end_time)) return json({ error: 'End time must be HH:MM' }, 400);
    next.end_time = body.end_time || null;
  }
  if (body.appointment_limit !== undefined) {
    if (body.appointment_limit === null || body.appointment_limit === '') {
      next.appointment_limit = null;
    } else {
      const n = Number(body.appointment_limit);
      if (!Number.isInteger(n) || n < 0 || n > 500) return json({ error: 'Limit must be between 0 and 500' }, 400);
      next.appointment_limit = n;
    }
  }
  if (body.note !== undefined) next.note = String(body.note || '').trim() || null;

  // Effective window must still be valid after merging with chamber defaults
  const effStart = next.start_time || chamber.start_time;
  const effEnd = next.end_time || chamber.end_time;
  if (effStart >= effEnd) return json({ error: 'End time must be after start time' }, 400);

  // Values identical to the chamber default are stored as NULL (inherit) so the
  // override table stays minimal.
  if (next.start_time === chamber.start_time) next.start_time = null;
  if (next.end_time === chamber.end_time) next.end_time = null;
  if (next.appointment_limit === chamber.daily_limit) next.appointment_limit = null;

  const isEmpty = next.status === null && next.start_time === null && next.end_time === null
    && next.appointment_limit === null && next.note === null;

  if (isEmpty) {
    if (existing) await db.prepare('DELETE FROM schedule_overrides WHERE id = ?').bind(existing.id).run();
  } else if (existing) {
    await db.prepare(
      `UPDATE schedule_overrides
       SET status = ?, start_time = ?, end_time = ?, appointment_limit = ?, note = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).bind(next.status, next.start_time, next.end_time, next.appointment_limit, next.note, existing.id).run();
  } else {
    await db.prepare(
      `INSERT INTO schedule_overrides (chamber_id, date, status, start_time, end_time, appointment_limit, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(chamber.id, date, next.status, next.start_time, next.end_time, next.appointment_limit, next.note).run();
  }

  const result = await loadDay(db, chamber, date, now);

  // Warn (but allow) when the new limit is below the already booked count
  const warnings = [];
  if (result.day.booked > result.day.limit) {
    warnings.push(`${result.day.booked} patients are already booked but the limit is now ${result.day.limit}.`);
  }
  return json({ ...result, warnings });
}

// DELETE /api/admin/schedule/day?chamber_id=1&date=YYYY-MM-DD
// Removes the override so the date falls back to the chamber default.
export async function onRequestDelete(context) {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const chamberId = url.searchParams.get('chamber_id');
  const date = url.searchParams.get('date');
  if (!chamberId || !date) return json({ error: 'chamber_id and date are required' }, 400);
  if (!isValidDate(date)) return json({ error: 'Invalid date' }, 400);

  const chamber = await getChamber(db, chamberId);
  if (!chamber) return json({ error: 'Chamber not found' }, 404);

  await db.prepare('DELETE FROM schedule_overrides WHERE chamber_id = ? AND date = ?').bind(chamber.id, date).run();

  const now = localNow(getTimezone(context.env));
  return json(await loadDay(db, chamber, date, now));
}
