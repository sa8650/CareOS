/* ==========================================================================
   004_seo.sql - per-page SEO overrides (Admin -> SEO Settings)

   For an EXISTING database (your live site): run this once.
   Cloudflare dashboard: D1 -> doctor-db -> Console -> paste -> Execute
   (Fresh installs do not need it: 001_initial.sql already contains it.)

   Portable schema: plain SQL, works unchanged on SQLite / MySQL / PostgreSQL.
   ========================================================================== */
CREATE TABLE IF NOT EXISTS seo_pages (
  page           TEXT PRIMARY KEY,
  title          TEXT,
  description    TEXT,
  keywords       TEXT,
  canonical      TEXT,
  og_title       TEXT,
  og_description TEXT,
  og_image       TEXT,
  robots         TEXT,
  schema_type    TEXT,
  schema_json    TEXT,
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
