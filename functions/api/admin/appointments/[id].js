import { parseBody, json } from '../../_middleware.js';

export async function onRequestPut(context) {
  const { id } = context.params;
  const body = await parseBody(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const db = context.env.DB;
  const appointment = await db.prepare('SELECT * FROM appointments WHERE id = ?').bind(id).first();
  if (!appointment) return json({ error: 'Appointment not found' }, 404);

  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'];
  if (body.status && !validStatuses.includes(body.status)) {
    return json({ error: 'Invalid status' }, 400);
  }

  const updates = [];
  const params = [];
  if (body.status) { updates.push('status = ?'); params.push(body.status); }
  if (body.admin_note !== undefined) { updates.push('admin_note = ?'); params.push(body.admin_note); }
  if (body.appointment_date) { updates.push('appointment_date = ?'); params.push(body.appointment_date); }
  if (body.start_time) { updates.push('start_time = ?'); params.push(body.start_time); }
  if (body.end_time) { updates.push('end_time = ?'); params.push(body.end_time); }
  updates.push('updated_at = datetime("now")');
  params.push(id);

  await db.prepare(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
  return json({ success: true });
}
