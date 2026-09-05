import { json } from '../../_middleware.js';

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const status = url.searchParams.get('status');
  const date = url.searchParams.get('date');
  const search = url.searchParams.get('search');
  const limit = url.searchParams.get('limit');

  let query = `
    SELECT a.*, s.name as service_name, p.name as patient_name, p.phone as patient_phone, p.email as patient_email
    FROM appointments a
    JOIN services s ON a.service_id = s.id
    JOIN patients p ON a.patient_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }
  if (date) {
    query += ' AND a.appointment_date = ?';
    params.push(date);
  }
  if (search) {
    query += ' AND (p.name LIKE ? OR a.reference LIKE ? OR p.phone LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  query += ' ORDER BY a.appointment_date DESC, a.start_time DESC';
  if (limit) {
    query += ' LIMIT ?';
    params.push(Number(limit));
  }

  const db = context.env.DB;
  const { results } = await db.prepare(query).bind(...params).all();
  return json(results);
}
