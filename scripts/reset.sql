/* ==========================================================================
   scripts/reset.sql - WIPE the database (all tables + all data)

   Use for a completely fresh start. Also drops d1_migrations (Wrangler's
   bookkeeping table) so `wrangler d1 migrations apply` re-runs 001_initial.sql.

   Cloudflare dashboard: D1 -> doctor-db -> Console -> paste this file -> Execute
   CLI:  npm run db:reset  (remote)   |   npm run db:reset:local  (local)
   ========================================================================== */
PRAGMA foreign_keys = OFF;

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

/* legacy tables from older versions (harmless if absent) */
DROP TABLE IF EXISTS availability;
DROP TABLE IF EXISTS appointments_v2;

/* wrangler migration bookkeeping */
DROP TABLE IF EXISTS d1_migrations;

PRAGMA foreign_keys = ON;
