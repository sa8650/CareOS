/**
 * SEO repository — the ONLY place that knows how SEO records are stored.
 *
 * Today: Cloudflare D1 (SQLite). To move to MySQL / Postgres / Supabase / Mongo / another API,
 * re-implement these five functions with the same signatures; nothing else changes.
 *
 * Record shape: see shared/seo/schema.js  ({ page, title, description, ..., updated_at })
 */
import { SEO_FIELDS, normalizeSeoRecord } from '../../../shared/seo/schema.js';

const TABLE = 'seo_pages';
const MISSING = /no such table/i;

export function createSeoRepo(db) {
  return {
    /** All records as an object keyed by page: { home: {...}, 'service:hair-prp': {...} } */
    async getAll() {
      try {
        const { results } = await db.prepare(`SELECT * FROM ${TABLE}`).all();
        const out = {};
        for (const r of results) out[r.page] = r;
        return out;
      } catch (err) {
        if (MISSING.test(err?.message || '')) return {}; // table not created yet -> defaults only
        throw err;
      }
    },

    async get(page) {
      try {
        return (await db.prepare(`SELECT * FROM ${TABLE} WHERE page = ?`).bind(page).first()) || null;
      } catch (err) {
        if (MISSING.test(err?.message || '')) return null;
        throw err;
      }
    },

    /** Insert or update. Returns the stored record. */
    async upsert(page, data) {
      const rec = normalizeSeoRecord({ ...data, page });
      const cols = ['page', ...SEO_FIELDS];
      const placeholders = cols.map(() => '?').join(', ');
      const updates = SEO_FIELDS.map(f => `${f} = excluded.${f}`).join(', ');
      await db.prepare(
        `INSERT INTO ${TABLE} (${cols.join(', ')}, updated_at) VALUES (${placeholders}, datetime('now'))
         ON CONFLICT(page) DO UPDATE SET ${updates}, updated_at = datetime('now')`
      ).bind(...cols.map(c => rec[c] ?? '')).run();
      return this.get(page);
    },

    async remove(page) {
      await db.prepare(`DELETE FROM ${TABLE} WHERE page = ?`).bind(page).run();
      return true;
    },

    /** True when the storage is ready (table exists). Used by the admin UI to show setup help. */
    async isReady() {
      try { await db.prepare(`SELECT 1 FROM ${TABLE} LIMIT 1`).all(); return true; }
      catch (err) { if (MISSING.test(err?.message || '')) return false; throw err; }
    },
  };
}

/** Human-readable hint for the admin panel when the table is missing. */
export const SEO_TABLE_MISSING = 'SEO table "seo_pages" does not exist yet. Run migrations/004_seo.sql in the D1 console. Until then the site uses the automatic defaults.';
