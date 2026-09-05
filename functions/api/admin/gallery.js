import { parseBody, json } from '../_middleware.js';

export async function onRequestGet(context) {
  const db = context.env.DB;
  const { results } = await db.prepare('SELECT * FROM gallery ORDER BY display_order ASC').all();
  return json(results);
}

export async function onRequestPost(context) {
  const body = await parseBody(context.request);
  if (!body?.image_url) return json({ error: 'Image URL is required' }, 400);

  const db = context.env.DB;
  await db.prepare(
    'INSERT INTO gallery (image_url, caption, display_order, is_published) VALUES (?, ?, ?, ?)'
  ).bind(body.image_url, body.caption || null, body.display_order || 0, body.is_published ?? 1).run();

  return json({ success: true }, 201);
}

export async function onRequestDelete(context) {
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id') || context.params?.id;
  if (!id) return json({ error: 'Missing ID' }, 400);

  const db = context.env.DB;

  // Get image URL to delete from R2
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
