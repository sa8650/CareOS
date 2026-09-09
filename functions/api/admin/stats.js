import { json } from '../_middleware.js';
import {
  localNow, getTimezone, COUNTED_SQL, STATUS,
  listChambers, resolveRange,
} from '../_lib/schedule.js';

// GET /api/admin/stats — single request behind the admin dashboard.
//
// Everything is derived from the existing tables + the shared schedule engine
// (functions/api/_lib/schedule.js), so the numbers always match the public
// booking calendar and the admin Schedule page.
//
// Response:
//   date, time, timezone
//   total, today, upcoming            appointment counts (counted = not cancelled/rejected)
//   pending, confirmed, completed     by status (all time)
//   chambers, chambers_total          active / all
//   services, services_total          active / all
//   today_by_chamber                  legacy shape: [{ id, name, today }]
//   schedule_today                    per active chamber, resolved for today:
//                                     { id, name, status, booked, limit, remaining,
//                                       start_time, end_time, ended, is_override, next_date }
//   upcoming_list                     next 6 counted appointments from today (serial order)

const LOOKAHEAD_DAYS = 14;
const safe = (promise, fallback) => promise.catch(() => fallback);

export async function onRequestGet(context) {
  const db = context.env.DB;
  const now = localNow(getTimezone(context.env));

  const [statusRows, todayRow, upcomingRow, chambersAll, servicesRow, upcomingList] = await Promise.all([
    db.prepare('SELECT status, COUNT(*) AS c FROM appointments GROUP BY status').all().then(r => r.results),
    db.prepare(`SELECT COUNT(*) AS c FROM appointments WHERE appointment_date = ? AND ${COUNTED_SQL}`).bind(now.date).first(),
    db.prepare(`SELECT COUNT(*) AS c FROM appointments WHERE appointment_date >= ? AND ${COUNTED_SQL}`).bind(now.date).first(),
    safe(listChambers(db), []),
    safe(db.prepare('SELECT COUNT(*) AS total, COALESCE(SUM(is_active), 0) AS active FROM services').first(), { total: 0, active: 0 }),
    safe(db.prepare(
      `SELECT a.id, a.reference, a.serial_number, a.appointment_date, a.start_time, a.end_time, a.status,
              a.chamber_id, c.name AS chamber_name, p.name AS patient_name, p.phone AS patient_phone
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       LEFT JOIN chambers c ON c.id = a.chamber_id
       WHERE a.appointment_date >= ? AND a.${COUNTED_SQL}
       ORDER BY a.appointment_date ASC, a.chamber_id ASC, a.serial_number ASC
       LIMIT 6`
    ).bind(now.date).all().then(r => r.results), []),
  ]);

  const byStatus = { pending: 0, confirmed: 0, completed: 0, cancelled: 0, rejected: 0 };
  let total = 0;
  for (const r of statusRows) {
    const c = Number(r.c) || 0;
    if (r.status in byStatus) byStatus[r.status] = c;
    total += c;
  }

  // Today's schedule per active chamber via the central resolver (a short look-ahead
  // lets us tell the admin when a chamber that is off today sits next).
  const activeChambers = chambersAll.filter(c => c.is_active === 1);
  const ranges = await Promise.all(
    activeChambers.map(c => safe(resolveRange(db, c, now.date, LOOKAHEAD_DAYS, now), []))
  );
  const scheduleToday = activeChambers.map((c, i) => {
    const days = ranges[i] || [];
    const t = days[0];
    const next = days.slice(1).find(d => d.status === STATUS.AVAILABLE || d.status === STATUS.FULL);
    return {
      id: c.id,
      name: c.name,
      status: t ? t.status : STATUS.OFF,
      booked: t ? t.booked : 0,
      limit: t ? t.limit : c.daily_limit,
      remaining: t ? t.remaining : 0,
      start_time: t ? t.start_time : c.start_time,
      end_time: t ? t.end_time : c.end_time,
      ended: t ? t.ended : false,
      is_override: t ? t.is_override : false,
      next_date: next ? next.date : null,
    };
  });

  return json({
    date: now.date,
    time: now.time,
    timezone: now.timezone,

    total,
    today: Number(todayRow?.c || 0),
    upcoming: Number(upcomingRow?.c || 0),
    pending: byStatus.pending,
    confirmed: byStatus.confirmed,
    completed: byStatus.completed,

    chambers: activeChambers.length,
    chambers_total: chambersAll.length,
    services: Number(servicesRow?.active || 0),
    services_total: Number(servicesRow?.total || 0),

    today_by_chamber: scheduleToday.map(c => ({ id: c.id, name: c.name, today: c.booked })),
    schedule_today: scheduleToday,
    upcoming_list: upcomingList,
  });
}
