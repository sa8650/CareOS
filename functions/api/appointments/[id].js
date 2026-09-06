import { json } from '../_middleware.js';

// GET /api/appointments/:reference  (public confirmation page)
export async function onRequestGet(context) {
  const { id } = context.params;
  const db = context.env.DB;

  const appointment = await db.prepare(
    `SELECT a.reference, a.appointment_date, a.serial_number, a.start_time, a.end_time, a.status, a.created_at,
            a.chamber_id, c.name AS chamber_name, c.address AS chamber_address, c.phone AS chamber_phone,
            s.name AS service_name, p.name AS patient_name
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     LEFT JOIN chambers c ON c.id = a.chamber_id
     LEFT JOIN services s ON s.id = a.service_id
     WHERE a.reference = ?`
  ).bind(id).first();

  if (!appointment) return json({ error: 'Appointment not found' }, 404);
  return json(appointment);
}
