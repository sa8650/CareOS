import { parseBody, json } from '../_middleware.js';

export async function onRequestPost(context) {
  const body = await parseBody(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const { service_id, date, start_time, end_time, name, phone, email, message } = body;

  // Validate required fields
  if (!service_id || !date || !start_time || !end_time || !name || !phone) {
    return json({ error: 'Service, date, time, name, and phone are required' }, 400);
  }

  const db = context.env.DB;

  // 1. Validate service exists and is active
  const service = await db.prepare('SELECT id, name, duration_minutes FROM services WHERE id = ? AND is_active = 1')
    .bind(service_id).first();
  if (!service) return json({ error: 'Service not found or inactive' }, 400);

  // 2. Validate date is not in the past
  const appointmentDate = new Date(date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (appointmentDate < today) {
    return json({ error: 'Cannot book appointments in the past' }, 400);
  }

  // 3. Check working hours
  const dayOfWeek = appointmentDate.getDay();
  const availability = await db.prepare(
    'SELECT start_time, end_time FROM availability WHERE day_of_week = ? AND is_active = 1'
  ).bind(dayOfWeek).first();

  if (!availability) {
    return json({ error: 'Clinic is closed on this day' }, 400);
  }

  // 4. Check if requested time falls within working hours
  if (start_time < availability.start_time || end_time > availability.end_time) {
    return json({ error: 'Requested time is outside working hours' }, 400);
  }

  // 5. Check for existing appointments at this time
  const conflict = await db.prepare(
    `SELECT id FROM appointments
     WHERE appointment_date = ? AND status NOT IN ('cancelled', 'rejected')
     AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) OR (start_time >= ? AND end_time <= ?))`
  ).bind(date, end_time, start_time, end_time, start_time, start_time, end_time).first();

  if (conflict) {
    return json({ error: 'This time slot is already booked' }, 400);
  }

  // 6. Create or find patient
  let patient = await db.prepare('SELECT id FROM patients WHERE phone = ?').bind(phone).first();
  if (!patient) {
    const result = await db.prepare(
      'INSERT INTO patients (name, phone, email) VALUES (?, ?, ?)'
    ).bind(name, phone, email || null).run();
    patient = { id: result.meta.last_row_id };
  } else if (name || email) {
    await db.prepare('UPDATE patients SET name = ?, email = ?, updated_at = datetime("now") WHERE id = ?')
      .bind(name, email || null, patient.id).run();
  }

  // 7. Generate reference number
  const year = new Date().getFullYear();
  const count = await db.prepare('SELECT COUNT(*) as c FROM appointments').first();
  const ref = `APT-${year}-${String((count?.c || 0) + 1).padStart(6, '0')}`;

  // 8. Create appointment
  await db.prepare(
    `INSERT INTO appointments (reference, patient_id, service_id, appointment_date, start_time, end_time, status, message)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`
  ).bind(ref, patient.id, service_id, date, start_time, end_time, message || null).run();

  return json({
    reference: ref,
    service_name: service.name,
    appointment_date: date,
    start_time,
    end_time,
    status: 'pending',
  }, 201);
}
