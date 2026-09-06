-- ============================================================================
-- 001_initial.sql — complete CareOS schema (fresh install)
--
-- Single migration that creates the whole database, including the
-- chamber-specific dynamic scheduling system:
--
--   chambers            -> chamber info + DEFAULT schedule (days / hours / limit)
--   schedule_overrides  -> ONE row per (chamber, date) ONLY when an admin edits
--                          that specific date. Recurring days are never stored;
--                          they are resolved on the fly by
--                          functions/api/_lib/schedule.js
--   appointments        -> patient + chamber + date + serial_number
--
-- Resolution order for any (chamber, date):
--   Chamber Default -> Date Override -> Appointment Count (Full when booked >= limit)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Doctor profile (single row, id = 1)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctor_profile (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  name            TEXT NOT NULL,
  title           TEXT,
  bio             TEXT,
  profile_image   TEXT,
  qualifications  TEXT,   -- JSON array of strings
  specializations TEXT,   -- JSON array of strings
  experience      TEXT,
  clinic_name     TEXT,
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Services (portfolio pages only — not part of the booking flow)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  description      TEXT,
  price            REAL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  image_url        TEXT,
  benefits         TEXT,  -- JSON array of strings
  faq              TEXT,  -- JSON array of {question, answer}
  is_active        INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_services_slug   ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);

-- ---------------------------------------------------------------------------
-- Chambers — each chamber owns its default schedule
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chambers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  address       TEXT,
  phone         TEXT,
  visiting_days TEXT    NOT NULL DEFAULT '[]',     -- JSON array of weekday ints, 0=Sun ... 6=Sat
  start_time    TEXT    NOT NULL DEFAULT '16:00',  -- default visiting start (HH:MM, 24h)
  end_time      TEXT    NOT NULL DEFAULT '20:00',  -- default visiting end   (HH:MM, 24h)
  daily_limit   INTEGER NOT NULL DEFAULT 10,       -- default patients per day
  is_active     INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_chambers_active_order ON chambers(is_active, display_order);

-- ---------------------------------------------------------------------------
-- Date-specific overrides (sparse: only explicitly edited dates)
-- NULL in any field = inherit the chamber default for that field.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedule_overrides (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  chamber_id        INTEGER NOT NULL REFERENCES chambers(id) ON DELETE CASCADE,
  date              TEXT    NOT NULL,   -- YYYY-MM-DD
  status            TEXT,               -- 'available' | 'off' | 'closed' | NULL
  start_time        TEXT,               -- HH:MM or NULL
  end_time          TEXT,               -- HH:MM or NULL
  appointment_limit INTEGER,            -- patients/day for this date, or NULL
  note              TEXT,
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (chamber_id, date)
);

CREATE INDEX IF NOT EXISTS idx_overrides_chamber_date ON schedule_overrides(chamber_id, date);

-- ---------------------------------------------------------------------------
-- Patients
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  email      TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);

-- ---------------------------------------------------------------------------
-- Appointments — serial-number booking per chamber + date
-- status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected'
-- (cancelled / rejected do not count toward the daily limit)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  reference        TEXT    NOT NULL UNIQUE,                 -- e.g. APT-2026-1EFBF5
  patient_id       INTEGER NOT NULL REFERENCES patients(id),
  chamber_id       INTEGER REFERENCES chambers(id) ON DELETE SET NULL,
  appointment_date TEXT    NOT NULL,                        -- YYYY-MM-DD
  serial_number    INTEGER,                                 -- 1..limit, per chamber + date
  start_time       TEXT,                                    -- visiting window snapshot at booking time
  end_time         TEXT,
  status           TEXT    NOT NULL DEFAULT 'pending',
  message          TEXT,
  admin_note       TEXT,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_appointments_date         ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status       ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient      ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_chamber_date ON appointments(chamber_id, appointment_date);
-- Guarantees two bookings can never receive the same serial for a chamber/date
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_serial ON appointments(chamber_id, appointment_date, serial_number);

-- ---------------------------------------------------------------------------
-- Testimonials
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS testimonials (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  review       TEXT NOT NULL,
  rating       INTEGER NOT NULL DEFAULT 5,
  image_url    TEXT,
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Gallery
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gallery (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url     TEXT NOT NULL,
  caption       TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published  INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Settings (key-value)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
