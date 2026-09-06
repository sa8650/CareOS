import { parseBody, json } from '../_middleware.js';
import {
  getChamber, resolveDate, localNow, getTimezone, isValidDate, addDays,
  unavailableReason, COUNTED_SQL, BOOKING_WINDOW_DAYS,
} from '../_lib/schedule.js';

// POST /api/appointments
// body: { chamber_id, date, name, phone, email?, message? }
//
// Booking goes through the SAME schedule engine as the calendar, so the
// server always applies the correct chamber days, override, visiting hours
// and capacity – even if the patient's page is stale.
export async function onRequestPost(context) {
  const body = await parseBody(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const chamber_id = Number(body.chamber_id);
  const date = String(body.date || '').trim();
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const email = String(body.email || '').trim() || null;
  const message = String(body.message || '').trim() || null;

  if (!chamber_id || !date || !name || !phone) {
    return json({ error: 'Chamber, date, name and phone are required' }, 400);
  }
  if (!isValidDate(date)) return json({ error: 'Invalid date' }, 400);
  if (name.length > 100) return json({ error: 'Name is too long' }, 400);
  if (!/^[+\d][\d\s\-()]{5,19}$/.test(phone)) return json({ error: 'Please enter a valid phone number' }, 400);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Please enter a valid email' }, 400);

  const db = context.env.DB;
  const now = localNow(getTimezone(context.env));

  // 1. Chamber
  const chamber = await getChamber(db, chamber_id);
  if (!chamber || !chamber.is_active) return json({ error: 'Chamber not found' }, 400);

  // 2. Booking window
  if (date < now.date) return json({ error: 'Cannot book appointments in the past' }, 400);
  if (date > addDays(now.date, BOOKING_WINDOW_DAYS - 1)) {
    return json({ error: `Cannot book more than ${BOOKING_WINDOW_DAYS} days in advance` }, 400);
  }

  // 3. Resolve the day (default + override + live count)
  const day = await resolveDate(db, chamber, date, now);
  if (!day.bookable) return json({ error: unavailableReason(day), day }, 409);

  // 4. Same patient cannot hold two active bookings for the same chamber/date
  const dup = await db.prepare(
    `SELECT a.reference FROM appointments a JOIN patients p ON p.id = a.patient_id
     WHERE p.phone = ? AND a.chamber_id = ? AND a.appointment_date = ? AND a.${COUNTED_SQL}`
  ).bind(phone, chamber.id, date).first();
  if (dup) return json({ error: `You already have an appointment on this date (${dup.reference})` }, 409);

  // 5. Patient upsert
  let patient = await db.prepare('SELECT id FROM patients WHERE phone = ?').bind(phone).first();
  if (!patient) {
    const r = await db.prepare('INSERT INTO patients (name, phone, email) VALUES (?, ?, ?)').bind(name, phone, email).run();
    patient = { id: r.meta.last_row_id };
  } else {
    await db.prepare("UPDATE patients SET name = ?, email = COALESCE(?, email), updated_at = datetime('now') WHERE id = ?")
      .bind(name, email, patient.id).run();
  }

  // 6. Insert with capacity enforced INSIDE the statement.
  //    The serial is derived from the current active count and the INSERT only
  //    happens when count < limit. Together with the UNIQUE index on
  //    (chamber_id, date, serial_number) this makes concurrent over-booking
  //    impossible: a losing racer either inserts 0 rows or hits the unique
  //    constraint, and we retry a couple of times.
  const year = now.date.slice(0, 4);
  let created = null;

  for (let attempt = 0; attempt < 3 && !created; attempt++) {
    const reference = `APT-${year}-${randomRef()}`;
    try {
      const r = await db.prepare(
        `INSERT INTO appointments
           (reference, patient_id, chamber_id, appointment_date, serial_number, start_time, end_time, status, message)
         SELECT ?, ?, ?, ?,
                (SELECT COALESCE(MAX(serial_number), 0) + 1 FROM appointments WHERE chamber_id = ? AND appointment_date = ?),
                ?, ?, 'pending', ?
         WHERE (SELECT COUNT(*) FROM appointments WHERE chamber_id = ? AND appointment_date = ? AND ${COUNTED_SQL}) < ?`
      ).bind(
        reference, patient.id, chamber.id, date,
        chamber.id, date,
        day.start_time, day.end_time, message,
        chamber.id, date, day.limit
      ).run();

      if (r.meta.changes > 0) {
        created = await db.prepare('SELECT * FROM appointments WHERE id = ?').bind(r.meta.last_row_id).first();
      } else {
        // Capacity reached between the resolve step and the insert
        const fresh = await resolveDate(db, chamber, date, now);
        return json({ error: unavailableReason({ ...fresh, status: 'full' }), day: fresh }, 409);
      }
    } catch (e) {
      // UNIQUE violation (serial or reference collision) -> retry
      if (!/UNIQUE/i.test(String(e?.message || e))) throw e;
    }
  }

  if (!created) return json({ error: 'Could not complete booking, please try again' }, 500);

  const fresh = await resolveDate(db, chamber, date, now);

  return json({
    reference: created.reference,
    chamber_id: chamber.id,
    chamber_name: chamber.name,
    chamber_address: chamber.address,
    appointment_date: date,
    serial_number: created.serial_number,
    start_time: created.start_time,
    end_time: created.end_time,
    status: created.status,
    remaining: fresh.remaining,
  }, 201);
}

function randomRef() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase().slice(0, 6);
}
