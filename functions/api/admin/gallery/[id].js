import { parseBody, json } from '../../_middleware.js';

export async function onRequestPut(context) {
  const { id } = context.params;
  const body = await parseBody(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const db = context.env.DB;
  const updates = [];
  const params = [];

  if (body.caption !== undefined) { updates.push('caption = ?'); params.push(body.caption); }
  if (body.display_order !== undefined) { updates.push('display_order = ?'); params.push(body.display_order); }
  if (body.is_published !== undefined) { updates.push('is_published = ?'); params.push(body.is_published); }

  if (updates.length === 0) return json({ error: 'No fields to update' }, 400);

  params.push(id);
  await db.prepare(`UPDATE gallery SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
  return json({ success: true });
}

export async function onRequestDelete(context) {
  const { id } = context.params;
  const db = context.env.DB;

  const image = await db.prepare('SELECT image_url FROM gallery WHERE id = ?').bind(id).first();
  if (image?.image_url && context.env.R2) {
    try {
      const key = image.image_url.split('/').slice(-3).join('/');
      await context.env.R2.delete(key);
    } catch {}
  }

  await db.prepare('DELETE FROM gallery WHERE id = ?').bind(id).run();
  return json({ success: true });
}
