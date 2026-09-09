/* ==========================================================================
   scripts/reset.sql - WIPE one website's database (all tables + all data)

   Cloudflare dashboard: D1 -> your database -> Console -> paste -> Execute
   Afterwards run migrations/001_initial.sql, then scripts/seed.sql (optional).
   Also drops the d1_migrations bookkeeping table (harmless if absent).
   ========================================================================== */
PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS schedule_overrides;
DROP TABLE IF EXISTS chambers;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS testimonials;
DROP TABLE IF EXISTS gallery;
DROP TABLE IF EXISTS home_sections;
DROP TABLE IF EXISTS seo_pages;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS doctor_profile;
DROP TABLE IF EXISTS admins;

/* legacy tables from older versions (harmless if absent) */
DROP TABLE IF EXISTS availability;
DROP TABLE IF EXISTS appointments_v2;

/* wrangler migration bookkeeping */
DROP TABLE IF EXISTS d1_migrations;

PRAGMA foreign_keys = ON;
