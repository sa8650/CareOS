import { parseBody, json } from '../../_middleware.js';
import {
  getChamber, resolveDate, localNow, getTimezone, isValidDate, unavailableReason,
} from '../../_lib/schedule.js';

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'];

// PUT /api/admin/appointments/:id
// body: { status?, admin_note?, appointment_date?, chamber_id? }
//
// Status changes are simple updates. Moving an appointment to another
// chamber/date goes through the schedule engine so capacity is respected and
// a fresh serial number is issued for the new day.
export async function onRequestPut(context) {
  const { id } = context.params;
  const body = await parseBody(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const db = context.env.DB;
  const appt = await db.prepare('SELECT * FROM appointments WHERE id = ?').bind(id).first();
  if (!appt) return json({ error: 'Appointment not found' }, 404);

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return json({ error: 'Invalid status' }, 400);
  }

  const updates = [];
  const params = [];

  // --- reschedule (chamber and/or date) -----------------------------------
  const newChamberId = body.chamber_id !== undefined ? Number(body.chamber_id) : appt.chamber_id;
  const newDate = body.appointment_date !== undefined ? String(body.appointment_date) : appt.appointment_date;
  const moving = newChamberId !== appt.chamber_id || newDate !== appt.appointment_date;

  if (moving) {
    if (!isValidDate(newDate)) return json({ error: 'Invalid date' }, 400);
    const chamber = await getChamber(db, newChamberId);
    if (!chamber) return json({ error: 'Chamber not found' }, 400);

    const now = localNow(getTimezone(context.env));
    const day = await resolveDate(db, chamber, newDate, now);
    const activeStatus = (body.status || appt.status);
    const occupies = !['cancelled', 'rejected'].includes(activeStatus);

    if (occupies && day.status !== 'available' && day.status !== 'full') {
      return json({ error: unavailableReason(day) }, 409);
    }
    if (occupies && day.remaining <= 0) {
      return json({ error: 'That date is already full for this chamber' }, 409);
    }

    const serialRow = await db.prepare(
      'SELECT COALESCE(MAX(serial_number), 0) + 1 AS s FROM appointments WHERE chamber_id = ? AND appointment_date = ?'
    ).bind(chamber.id, newDate).first();

    updates.push('chamber_id = ?', 'appointment_date = ?', 'serial_number = ?', 'start_time = ?', 'end_time = ?');
    params.push(chamber.id, newDate, serialRow.s, day.start_time, day.end_time);
  }

  if (body.status) { updates.push('status = ?'); params.push(body.status); }
  if (body.admin_note !== undefined) { updates.push('admin_note = ?'); params.push(body.admin_note || null); }

  if (updates.length === 0) return json({ error: 'Nothing to update' }, 400);

  updates.push("updated_at = datetime('now')");
  params.push(id);

  await db.prepare(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();

  const updated = await db.prepare(
    `SELECT a.*, c.name AS chamber_name, p.name AS patient_name, p.phone AS patient_phone, p.email AS patient_email
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     LEFT JOIN chambers c ON c.id = a.chamber_id
     WHERE a.id = ?`
  ).bind(id).first();

  return json({ success: true, appointment: updated });
}

// DELETE /api/admin/appointments/:id  (hard delete, frees the slot)
export async function onRequestDelete(context) {
  const { id } = context.params;
  const db = context.env.DB;
  const appt = await db.prepare('SELECT id FROM appointments WHERE id = ?').bind(id).first();
  if (!appt) return json({ error: 'Appointment not found' }, 404);
  await db.prepare('DELETE FROM appointments WHERE id = ?').bind(id).run();
  return json({ success: true });
}
