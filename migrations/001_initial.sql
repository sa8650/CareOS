/* ==========================================================================
   001_initial.sql - complete CareOS schema (fresh install)

   Chamber-specific dynamic scheduling:
     chambers           -> chamber info + DEFAULT schedule (days / hours / limit)
     schedule_overrides -> one row per (chamber, date) ONLY when an admin edits
                           that date. Recurring days are never stored - they are
                           resolved on the fly by functions/api/_lib/schedule.js
     appointments       -> patient + chamber + date + serial_number

   Resolution order: Chamber Default -> Date Override -> Appointment Count

   NOTE: this file is safe to paste into the Cloudflare D1 console, which joins
   all lines together and splits on semicolons. Keep it that way: use only
   block comments and never put a semicolon inside a comment.
   ========================================================================== */

CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS doctor_profile (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  name            TEXT NOT NULL,
  title           TEXT,
  bio             TEXT,
  profile_image   TEXT,
  qualifications  TEXT,
  specializations TEXT,
  experience      TEXT,
  clinic_name     TEXT,
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS services (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  description      TEXT,
  price            REAL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  image_url        TEXT,
  benefits         TEXT,
  faq              TEXT,
  is_active        INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);

/* visiting_days = JSON array of weekday numbers, 0=Sun ... 6=Sat
   start_time / end_time = HH:MM 24h, daily_limit = patients per day */
CREATE TABLE IF NOT EXISTS chambers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  address       TEXT,
  phone         TEXT,
  visiting_days TEXT    NOT NULL DEFAULT '[]',
  start_time    TEXT    NOT NULL DEFAULT '16:00',
  end_time      TEXT    NOT NULL DEFAULT '20:00',
  daily_limit   INTEGER NOT NULL DEFAULT 10,
  is_active     INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_chambers_active_order ON chambers(is_active, display_order);

/* Sparse per-date overrides. status = 'available' | 'off' | 'closed' | NULL.
   NULL in any field means: inherit the chamber default. */
CREATE TABLE IF NOT EXISTS schedule_overrides (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  chamber_id        INTEGER NOT NULL REFERENCES chambers(id) ON DELETE CASCADE,
  date              TEXT    NOT NULL,
  status            TEXT,
  start_time        TEXT,
  end_time          TEXT,
  appointment_limit INTEGER,
  note              TEXT,
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (chamber_id, date)
);

CREATE INDEX IF NOT EXISTS idx_overrides_chamber_date ON schedule_overrides(chamber_id, date);

CREATE TABLE IF NOT EXISTS patients (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  email      TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);

/* Serial-number booking per chamber + date.
   status = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected'
   (cancelled / rejected do not count toward the daily limit).
   start_time / end_time = snapshot of the visiting window at booking time. */
CREATE TABLE IF NOT EXISTS appointments (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  reference        TEXT    NOT NULL UNIQUE,
  patient_id       INTEGER NOT NULL REFERENCES patients(id),
  chamber_id       INTEGER REFERENCES chambers(id) ON DELETE SET NULL,
  appointment_date TEXT    NOT NULL,
  serial_number    INTEGER,
  start_time       TEXT,
  end_time         TEXT,
  status           TEXT    NOT NULL DEFAULT 'pending',
  message          TEXT,
  admin_note       TEXT,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_chamber_date ON appointments(chamber_id, appointment_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_serial ON appointments(chamber_id, appointment_date, serial_number);

CREATE TABLE IF NOT EXISTS testimonials (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  review       TEXT NOT NULL,
  rating       INTEGER NOT NULL DEFAULT 5,
  image_url    TEXT,
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gallery (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url     TEXT NOT NULL,
  caption       TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published  INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
