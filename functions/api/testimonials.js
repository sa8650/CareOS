import { json } from './_middleware.js';

export async function onRequestGet(context) {
  const db = context.env.DB;
  const { results } = await db.prepare(
    'SELECT id, name, review, rating, image_url FROM testimonials WHERE is_published = 1 ORDER BY created_at DESC'
  ).all();
  return json(results);
}
