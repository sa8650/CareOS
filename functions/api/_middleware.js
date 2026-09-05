// Helper to parse JSON body
export async function parseBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// Helper to create JSON response
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Auth middleware - checks for valid session cookie
export async function requireAuth(context) {
  const session = context.request.headers.get('Cookie')?.match(/session=([^;]+)/)?.[1];
  if (!session) return null;

  const db = context.env.DB;
  const admin = await db.prepare('SELECT id, name, email, role FROM admins WHERE id = ?')
    .bind(session)
    .first();
  return admin;
}

// Rate limiting (simple in-memory)
const loginAttempts = new Map();

export function checkRateLimit(ip) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || [];
  const recent = attempts.filter(t => now - t < 15 * 60 * 1000); // 15 min window
  if (recent.length >= 5) return false;
  recent.push(now);
  loginAttempts.set(ip, recent);
  return true;
}
