import { parseBody, json } from '../_middleware.js';

export async function onRequestGet(context) {
  const db = context.env.DB;
  const doctor = await db.prepare('SELECT * FROM doctor_profile WHERE id = 1').first();
  if (!doctor) {
    // Return default empty profile
    return json({
      name: '', title: '', bio: '', profile_image: '',
      qualifications: [], specializations: [], experience: '',
      clinic_name: '', phone: '', email: '', address: '',
    });
  }
  try { doctor.qualifications = JSON.parse(doctor.qualifications || '[]'); } catch { doctor.qualifications = []; }
  try { doctor.specializations = JSON.parse(doctor.specializations || '[]'); } catch {
    doctor.specializations = (doctor.specializations || '').split(',').map(s => s.trim()).filter(Boolean);
  }
  return json(doctor);
}

export async function onRequestPut(context) {
  const body = await parseBody(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const db = context.env.DB;

  const qualifications = typeof body.qualifications === 'string' ? body.qualifications : JSON.stringify(body.qualifications || []);
  const specializations = typeof body.specializations === 'string' ? body.specializations : JSON.stringify(
    typeof body.specializations === 'string' ? body.specializations.split(',').map(s => s.trim()) : (body.specializations || [])
  );

  const existing = await db.prepare('SELECT id FROM doctor_profile WHERE id = 1').first();

  if (existing) {
    await db.prepare(
      `UPDATE doctor_profile SET name=?, title=?, bio=?, profile_image=?, qualifications=?, specializations=?, experience=?, clinic_name=?, phone=?, email=?, address=?, updated_at=datetime('now') WHERE id=1`
    ).bind(
      body.name, body.title, body.bio, body.profile_image,
      qualifications, specializations, body.experience,
      body.clinic_name, body.phone, body.email, body.address
    ).run();
  } else {
    await db.prepare(
      `INSERT INTO doctor_profile (id, name, title, bio, profile_image, qualifications, specializations, experience, clinic_name, phone, email, address) VALUES (1,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      body.name, body.title, body.bio, body.profile_image,
      qualifications, specializations, body.experience,
      body.clinic_name, body.phone, body.email, body.address
    ).run();
  }

  return json({ success: true });
}
