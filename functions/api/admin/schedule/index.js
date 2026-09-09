import { json } from '../../_middleware.js';
import {
  getChamber, resolveRange, summarize, localNow, getTimezone,
  isValidDate, BOOKING_WINDOW_DAYS,
} from '../../_lib/schedule.js';

// GET /api/admin/schedule?chamber_id=1[&from=YYYY-MM-DD][&days=30]
//
// Admin calendar feed. Dynamically resolves each day for the chamber using the
// shared schedule engine (default schedule + sparse overrides + live counts).
export async function onRequestGet(context) {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const chamberId = url.searchParams.get('chamber_id');
  if (!chamberId) return json({ error: 'chamber_id is required' }, 400);

  const chamber = await getChamber(db, chamberId);
  if (!chamber) return json({ error: 'Chamber not found' }, 404);

  const now = localNow(getTimezone(context.env));
  const from = url.searchParams.get('from');
  const fromDate = from && isValidDate(from) ? from : now.date;
  const days = Number(url.searchParams.get('days')) || BOOKING_WINDOW_DAYS;

  const resolved = await resolveRange(db, chamber, fromDate, days, now);

  return json({
    chamber,
    today: now.date,
    timezone: now.timezone,
    from: fromDate,
    days: resolved,
    summary: summarize(resolved),
  });
}
