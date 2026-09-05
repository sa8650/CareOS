import { parseBody, json, checkRateLimit } from '../_middleware.js';

// Simple hash function using Web Crypto API (available in Workers)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
  const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!checkRateLimit(ip)) {
    return json({ error: 'Too many login attempts. Try again later.' }, 429);
  }

  const body = await parseBody(context.request);
  if (!body?.email || !body?.password) {
    return json({ error: 'Email and password are required' }, 400);
  }

  const db = context.env.DB;
  const admin = await db.prepare('SELECT * FROM admins WHERE email = ?')
    .bind(body.email)
    .first();

  if (!admin) {
    return json({ error: 'Invalid credentials' }, 401);
  }

  const hash = await hashPassword(body.password);
  if (hash !== admin.password_hash) {
    return json({ error: 'Invalid credentials' }, 401);
  }

  return json(
    { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    200,
    {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session=${admin.id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`,
      },
    }
  );
}
