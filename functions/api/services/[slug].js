import { json } from '../_middleware.js';

export async function onRequestGet(context) {
  const { slug } = context.params;
  const db = context.env.DB;

  const service = await db.prepare(
    'SELECT id, name, slug, description, price, duration_minutes, image_url, benefits, faq, is_active FROM services WHERE slug = ?'
  ).bind(slug).first();

  if (!service) return json({ error: 'Service not found' }, 404);

  try { service.benefits = JSON.parse(service.benefits || '[]'); } catch { service.benefits = []; }
  try { service.faq = JSON.parse(service.faq || '[]'); } catch { service.faq = []; }

  return json(service);
}
