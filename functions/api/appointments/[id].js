import { json } from '../_middleware.js';

export async function onRequestGet(context) {
  const { id } = context.params;
  const db = context.env.DB;

  const appointment = await db.prepare(
    `SELECT a.*, s.name as service_name, p.name as patient_name
     FROM appointments a
     JOIN services s ON a.service_id = s.id
     JOIN patients p ON a.patient_id = p.id
     WHERE a.reference = ?`
  ).bind(id).first();

  if (!appointment) return json({ error: 'Appointment not found' }, 404);

  return json(appointment);
}
