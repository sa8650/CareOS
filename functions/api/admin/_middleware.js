import { json, requireAuth } from '../_middleware.js';

export async function onRequest(context) {
  // Only allow non-GET requests to be checked for auth
  const admin = await requireAuth(context);
  if (!admin) {
    return json({ error: 'Unauthorized' }, 401);
  }
  context.admin = admin;
  return context.next();
}
