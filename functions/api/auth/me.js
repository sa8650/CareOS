import { json, requireAuth } from '../_middleware.js';

export async function onRequestGet(context) {
  const admin = await requireAuth(context);
  if (!admin) return json({ error: 'Not authenticated' }, 401);
  return json(admin);
}
