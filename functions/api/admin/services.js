import { parseBody, json } from '../_middleware.js';

export async function onRequestGet(context) {
  const db = context.env.DB;
  const { results } = await db.prepare('SELECT * FROM services ORDER BY created_at DESC').all();
  for (const s of results) {
    try { s.benefits = JSON.parse(s.benefits || '[]'); } catch { s.benefits = []; }
    try { s.faq = JSON.parse(s.faq || '[]'); } catch { s.faq = []; }
  }
  return json(results);
}

export async function onRequestPost(context) {
  const body = await parseBody(context.request);
  if (!body?.name || !body?.slug) return json({ error: 'Name and slug are required' }, 400);

  const db = context.env.DB;
  const existing = await db.prepare('SELECT id FROM services WHERE slug = ?').bind(body.slug).first();
  if (existing) return json({ error: 'Slug already exists' }, 400);

  const benefits = typeof body.benefits === 'string' ? body.benefits : JSON.stringify(body.benefits || []);
  const faq = typeof body.faq === 'string' ? body.faq : JSON.stringify(body.faq || []);

  await db.prepare(
    `INSERT INTO services (name, slug, description, price, duration_minutes, image_url, benefits, faq, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    body.name, body.slug, body.description || null,
    body.price || null, body.duration_minutes || 30,
    body.image_url || null, benefits, faq, body.is_active ?? 1
  ).run();

  return json({ success: true }, 201);
}
