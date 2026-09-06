import { json } from '../_middleware.js';
import { localNow, getTimezone, COUNTED_SQL } from '../_lib/schedule.js';

export async function onRequestGet(context) {
  const db = context.env.DB;
  const now = localNow(getTimezone(context.env));

  const [todayAppt, pending, confirmed, completed, total, chambers, perChamber] = await Promise.all([
    db.prepare(`SELECT COUNT(*) AS c FROM appointments WHERE appointment_date = ? AND ${COUNTED_SQL}`).bind(now.date).first(),
    db.prepare("SELECT COUNT(*) AS c FROM appointments WHERE status = 'pending'").first(),
    db.prepare("SELECT COUNT(*) AS c FROM appointments WHERE status = 'confirmed'").first(),
    db.prepare("SELECT COUNT(*) AS c FROM appointments WHERE status = 'completed'").first(),
    db.prepare('SELECT COUNT(*) AS c FROM appointments').first(),
    db.prepare('SELECT COUNT(*) AS c FROM chambers WHERE is_active = 1').first(),
    db.prepare(
      `SELECT c.id, c.name, COUNT(a.id) AS today
       FROM chambers c
       LEFT JOIN appointments a ON a.chamber_id = c.id AND a.appointment_date = ? AND a.${COUNTED_SQL}
       WHERE c.is_active = 1
       GROUP BY c.id ORDER BY c.display_order, c.id`
    ).bind(now.date).all(),
  ]);

  return json({
    today: todayAppt?.c || 0,
    pending: pending?.c || 0,
    confirmed: confirmed?.c || 0,
    completed: completed?.c || 0,
    total: total?.c || 0,
    chambers: chambers?.c || 0,
    today_by_chamber: perChamber.results,
    date: now.date,
  });
}
