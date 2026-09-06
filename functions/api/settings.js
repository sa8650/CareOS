import { json } from './_middleware.js';

export async function onRequestGet(context) {
  const db = context.env.DB;
  const { results } = await db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const r of results) settings[r.key] = r.value;
  return json(settings);
}
