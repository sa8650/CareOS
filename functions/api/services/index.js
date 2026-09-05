import { json } from '../_middleware.js';

export async function onRequestGet(context) {
  const db = context.env.DB;
  const { results } = await db.prepare(
    'SELECT id, name, slug, description, price, duration_minutes, image_url, is_active, created_at FROM services ORDER BY created_at DESC'
  ).all();

  // Parse benefits/faq for each
  for (const s of results) {
    try { s.benefits = JSON.parse(s.benefits || '[]'); } catch { s.benefits = []; }
    try { s.faq = JSON.parse(s.faq || '[]'); } catch { s.faq = []; }
  }

  return json(results);
}
