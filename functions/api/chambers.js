import { json } from './_middleware.js';
import { listChambers } from './_lib/schedule.js';

// GET /api/chambers -> active chambers with their default schedule (public)
export async function onRequestGet(context) {
  const chambers = await listChambers(context.env.DB, { activeOnly: true });
  return json(chambers.map(c => ({
    id: c.id,
    name: c.name,
    address: c.address,
    phone: c.phone,
    visiting_days: c.visiting_days,
    start_time: c.start_time,
    end_time: c.end_time,
    daily_limit: c.daily_limit,
  })));
}
