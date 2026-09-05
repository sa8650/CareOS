import { parseBody, json } from '../../_middleware.js';

export async function onRequestPut(context) {
  const { id } = context.params;
  const body = await parseBody(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const db = context.env.DB;
  const service = await db.prepare('SELECT * FROM services WHERE id = ?').bind(id).first();
  if (!service) return json({ error: 'Service not found' }, 404);

  const updates = [];
  const params = [];
  const fields = ['name', 'slug', 'description', 'price', 'duration_minutes', 'image_url', 'is_active'];
  for (const f of fields) {
    if (body[f] !== undefined) { updates.push(`${f} = ?`); params.push(body[f]); }
  }
  if (body.benefits !== undefined) {
    updates.push('benefits = ?');
    params.push(typeof body.benefits === 'string' ? body.benefits : JSON.stringify(body.benefits));
  }
  if (body.faq !== undefined) {
    updates.push('faq = ?');
    params.push(typeof body.faq === 'string' ? body.faq : JSON.stringify(body.faq));
  }
  updates.push('updated_at = datetime("now")');
  params.push(id);

  await db.prepare(`UPDATE services SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
  return json({ success: true });
}

export async function onRequestDelete(context) {
  const { id } = context.params;
  const db = context.env.DB;
  await db.prepare('DELETE FROM services WHERE id = ?').bind(id).run();
  return json({ success: true });
}
