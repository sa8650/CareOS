import { json } from './_middleware.js';
import {
  getChamber, resolveRange, resolveDate, summarize,
  localNow, getTimezone, isValidDate, BOOKING_WINDOW_DAYS,
} from './_lib/schedule.js';

// Public availability API (used by the patient booking page).
//
//   GET /api/availability?chamber_id=1              -> next 30 days (resolved)
//   GET /api/availability?chamber_id=1&date=YYYY-MM-DD -> single day
//
// Every value is computed live by the schedule engine – no schedule rows are
// ever generated or stored by this endpoint.
export async function onRequestGet(context) {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const chamberId = url.searchParams.get('chamber_id');
  const date = url.searchParams.get('date');

  if (!chamberId) return json({ error: 'chamber_id is required' }, 400);

  const chamber = await getChamber(db, chamberId);
  if (!chamber || !chamber.is_active) return json({ error: 'Chamber not found' }, 404);

  const now = localNow(getTimezone(context.env));
  const publicChamber = {
    id: chamber.id, name: chamber.name, address: chamber.address, phone: chamber.phone,
    visiting_days: chamber.visiting_days, start_time: chamber.start_time,
    end_time: chamber.end_time, daily_limit: chamber.daily_limit,
  };

  if (date) {
    if (!isValidDate(date)) return json({ error: 'Invalid date' }, 400);
    const day = await resolveDate(db, chamber, date, now);
    return json({ chamber: publicChamber, today: now.date, day });
  }

  const days = await resolveRange(db, chamber, now.date, BOOKING_WINDOW_DAYS, now);
  return json({
    chamber: publicChamber,
    today: now.date,
    timezone: now.timezone,
    window_days: BOOKING_WINDOW_DAYS,
    days,
    summary: summarize(days),
  });
}
