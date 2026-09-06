-- ============================================================================
-- scripts/reset.sql — WIPE the database (all tables + all data)
--
-- Use this for a completely fresh start. It also drops `d1_migrations`, the
-- table Wrangler uses to remember which migrations ran, so that
-- `wrangler d1 migrations apply` will re-run 001_initial.sql from scratch.
--
--   Remote (production):  npm run db:reset          (asks for confirmation)
--   Local  (wrangler dev):  npm run db:reset:local
-- ============================================================================
PRAGMA foreign_keys = OFF;

-- current schema
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS schedule_overrides;
DROP TABLE IF EXISTS chambers;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS testimonials;
DROP TABLE IF EXISTS gallery;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS doctor_profile;
DROP TABLE IF EXISTS admins;

-- legacy tables from older versions (harmless if absent)
DROP TABLE IF EXISTS availability;
DROP TABLE IF EXISTS appointments_v2;

-- wrangler migration bookkeeping
DROP TABLE IF EXISTS d1_migrations;

PRAGMA foreign_keys = ON;
