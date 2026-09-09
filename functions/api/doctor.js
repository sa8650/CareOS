import { json } from './_middleware.js';
import { parseProfileRow } from './_lib/profile.js';

export async function onRequestGet(context) {
  const db = context.env.DB;
  // SELECT * (not an explicit column list) so the endpoint keeps working even if an
  // optional column such as `stats` has not been added to the live database yet.
  const row = await db.prepare('SELECT * FROM doctor_profile WHERE id = 1').first();
  if (!row) return json(null);

  const { id, updated_at, ...profile } = parseProfileRow(row);
  return new Response(JSON.stringify(profile), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Always fresh: admin edits must show up immediately on the public site
      'Cache-Control': 'no-store',
    },
  });
}
