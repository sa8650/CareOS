import { json } from './_middleware.js';

export async function onRequestGet(context) {
  const db = context.env.DB;
  const { results } = await db.prepare(
    'SELECT id, image_url, caption, display_order FROM gallery WHERE is_published = 1 ORDER BY display_order ASC'
  ).all();
  return json(results);
}
