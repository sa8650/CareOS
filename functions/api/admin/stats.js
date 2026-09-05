import { json } from '../_middleware.js';

export async function onRequestGet(context) {
  const db = context.env.DB;
  const today = new Date().toISOString().split('T')[0];

  const [todayAppt, pending, confirmed, completed, total] = await Promise.all([
    db.prepare("SELECT COUNT(*) as c FROM appointments WHERE appointment_date = ?").bind(today).first(),
    db.prepare("SELECT COUNT(*) as c FROM appointments WHERE status = 'pending'").first(),
    db.prepare("SELECT COUNT(*) as c FROM appointments WHERE status = 'confirmed'").first(),
    db.prepare("SELECT COUNT(*) as c FROM appointments WHERE status = 'completed'").first(),
    db.prepare("SELECT COUNT(*) as c FROM appointments").first(),
  ]);

  return json({
    today: todayAppt?.c || 0,
    pending: pending?.c || 0,
    confirmed: confirmed?.c || 0,
    completed: completed?.c || 0,
    total: total?.c || 0,
  });
}
