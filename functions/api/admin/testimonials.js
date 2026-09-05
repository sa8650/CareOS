import { parseBody, json } from '../_middleware.js';

export async function onRequestGet(context) {
  const db = context.env.DB;
  const { results } = await db.prepare('SELECT * FROM testimonials ORDER BY created_at DESC').all();
  return json(results);
}

export async function onRequestPost(context) {
  const body = await parseBody(context.request);
  if (!body?.name || !body?.review) return json({ error: 'Name and review are required' }, 400);

  const db = context.env.DB;
  await db.prepare(
    'INSERT INTO testimonials (name, review, rating, image_url, is_published) VALUES (?, ?, ?, ?, ?)'
  ).bind(body.name, body.review, body.rating || 5, body.image_url || null, body.is_published ?? 1).run();

  return json({ success: true }, 201);
}
