import { json } from '../../_middleware.js';

// GET /api/admin/appointments?status=&date=&chamber_id=&search=&limit=&from=&to=
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const status = url.searchParams.get('status');
  const date = url.searchParams.get('date');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const chamberId = url.searchParams.get('chamber_id');
  const search = url.searchParams.get('search');
  const limit = url.searchParams.get('limit');

  let query = `
    SELECT a.*, c.name AS chamber_name,
           p.name AS patient_name, p.phone AS patient_phone, p.email AS patient_email
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    LEFT JOIN chambers c ON c.id = a.chamber_id
    WHERE 1=1
  `;
  const params = [];

  if (status) { query += ' AND a.status = ?'; params.push(status); }
  if (date) { query += ' AND a.appointment_date = ?'; params.push(date); }
  if (from) { query += ' AND a.appointment_date >= ?'; params.push(from); }
  if (to) { query += ' AND a.appointment_date <= ?'; params.push(to); }
  if (chamberId) { query += ' AND a.chamber_id = ?'; params.push(Number(chamberId)); }
  if (search) {
    query += ' AND (p.name LIKE ? OR a.reference LIKE ? OR p.phone LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  query += ' ORDER BY a.appointment_date DESC, a.chamber_id ASC, a.serial_number DESC, a.created_at DESC';
  if (limit) { query += ' LIMIT ?'; params.push(Number(limit)); }

  const db = context.env.DB;
  const { results } = await db.prepare(query).bind(...params).all();
  return json(results);
}
