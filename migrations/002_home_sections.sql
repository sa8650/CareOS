/* ==========================================================================
   002_home_sections.sql - adds the "Featured Sections" table

   For an EXISTING database (your live site): run this once.
   Cloudflare dashboard: D1 -> doctor-db -> Console -> paste -> Execute
   (Fresh installs do not need it: 001_initial.sql already contains it.)
   ========================================================================== */
CREATE TABLE IF NOT EXISTS home_sections (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  subtitle      TEXT,
  description   TEXT,
  benefits      TEXT,
  images        TEXT,
  button_text   TEXT,
  button_link   TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_home_sections_active_order ON home_sections(is_active, display_order);
