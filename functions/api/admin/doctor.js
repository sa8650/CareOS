import { parseBody, json } from '../_middleware.js';
import { parseProfileRow, qualificationsList, specializationsList, statsList, DEFAULT_STATS } from '../_lib/profile.js';

const EMPTY_PROFILE = {
  name: '', title: '', bio: '', profile_image: '',
  qualifications: [], specializations: [], experience: '',
  clinic_name: '', phone: '', email: '', address: '', stats: DEFAULT_STATS,
};

const STATS_MISSING = 'Statistics were not saved: run migrations/003_profile_stats.sql in the D1 console first.';

const str = (v) => (v == null ? '' : String(v));

export async function onRequestGet(context) {
  const db = context.env.DB;
  const row = await db.prepare('SELECT * FROM doctor_profile WHERE id = 1').first();
  return json(parseProfileRow(row) || EMPTY_PROFILE);
}

export async function onRequestPut(context) {
  const body = await parseBody(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const db = context.env.DB;
  const existing = await db.prepare('SELECT * FROM doctor_profile WHERE id = 1').first();

  // Merge with the stored row so fields the form does not send are preserved,
  // and never bind `undefined` (D1 rejects it with D1_TYPE_ERROR).
  const merged = { ...(existing || {}), ...body };

  // Textarea "one per line" -> JSON array; comma list -> JSON array.
  const qualifications = JSON.stringify(
    qualificationsList(body.qualifications !== undefined ? body.qualifications : existing?.qualifications)
  );
  const specializations = JSON.stringify(
    specializationsList(body.specializations !== undefined ? body.specializations : existing?.specializations)
  );

  const values = [
    str(merged.name).trim() || 'Doctor',
    str(merged.title),
    str(merged.bio),
    str(merged.profile_image),
    qualifications,
    specializations,
    str(merged.experience),
    str(merged.clinic_name),
    str(merged.phone),
    str(merged.email),
    str(merged.address),
  ];

  // Hero statistics: array of { value, label } -> JSON. Only touched when the form sends it.
  const statsJson = body.stats !== undefined ? JSON.stringify(statsList(body.stats, { fallback: false })) : undefined;

  const run = async (withStats) => {
    if (existing) {
      const sql = `UPDATE doctor_profile
         SET name=?, title=?, bio=?, profile_image=?, qualifications=?, specializations=?, experience=?,
             clinic_name=?, phone=?, email=?, address=?${withStats ? ', stats=?' : ''}, updated_at=datetime('now')
         WHERE id=1`;
      await db.prepare(sql).bind(...values, ...(withStats ? [statsJson] : [])).run();
    } else {
      const sql = `INSERT INTO doctor_profile (id, name, title, bio, profile_image, qualifications, specializations, experience, clinic_name, phone, email, address${withStats ? ', stats' : ''})
         VALUES (1,?,?,?,?,?,?,?,?,?,?,?${withStats ? ',?' : ''})`;
      await db.prepare(sql).bind(...values, ...(withStats ? [statsJson] : [])).run();
    }
  };

  let warning = null;
  try {
    await run(statsJson !== undefined);
  } catch (err) {
    // Live DB without the `stats` column (migration 003 not run yet): save everything else.
    if (statsJson !== undefined && /no (such )?column.*stats|has no column named stats/i.test(err?.message || '')) {
      await run(false);
      warning = STATS_MISSING;
    } else {
      throw err;
    }
  }

  const saved = await db.prepare('SELECT * FROM doctor_profile WHERE id = 1').first();
  return json({ success: true, doctor: parseProfileRow(saved), ...(warning ? { warning } : {}) });
}
