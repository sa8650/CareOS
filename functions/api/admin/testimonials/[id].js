import { parseBody, json } from '../../_middleware.js';

export async function onRequestPut(context) {
  const { id } = context.params;
  const body = await parseBody(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const db = context.env.DB;
  const updates = [];
  const params = [];
  const fields = ['name', 'review', 'rating', 'image_url', 'is_published'];
  for (const f of fields) {
    if (body[f] !== undefined) { updates.push(`${f} = ?`); params.push(body[f]); }
  }
  if (updates.length === 0) return json({ error: 'No fields to update' }, 400);

  params.push(id);
  await db.prepare(`UPDATE testimonials SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
  return json({ success: true });
}

export async function onRequestDelete(context) {
  const { id } = context.params;
  const db = context.env.DB;
  await db.prepare('DELETE FROM testimonials WHERE id = ?').bind(id).run();
  return json({ success: true });
}
