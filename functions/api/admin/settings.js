import { parseBody, json } from '../_middleware.js';

export async function onRequestGet(context) {
  const db = context.env.DB;
  const { results } = await db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const r of results) settings[r.key] = r.value;
  return json(settings);
}

export async function onRequestPut(context) {
  const body = await parseBody(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const db = context.env.DB;
  for (const [key, value] of Object.entries(body)) {
    await db.prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')`
    ).bind(key, value, value).run();
  }

  return json({ success: true });
}
