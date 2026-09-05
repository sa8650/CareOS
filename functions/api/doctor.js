import { json } from './_middleware.js';

export async function onRequestGet(context) {
  const db = context.env.DB;
  const doctor = await db.prepare('SELECT name, title, bio, profile_image, qualifications, specializations, experience, clinic_name, phone, email, address FROM doctor_profile WHERE id = 1').first();
  if (!doctor) return json(null);

  // Parse JSON fields
  try {
    doctor.qualifications = JSON.parse(doctor.qualifications || '[]');
  } catch { doctor.qualifications = []; }
  try {
    doctor.specializations = JSON.parse(doctor.specializations || '[]');
  } catch { doctor.specializations = (doctor.specializations || '').split(',').map(s => s.trim()).filter(Boolean); }

  return json(doctor);
}
