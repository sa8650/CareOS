-- ============================================================================
-- 002: Chamber-specific dynamic scheduling
--
--   chambers            -> chamber info + DEFAULT schedule (days / hours / limit)
--   schedule_overrides  -> ONE row per (chamber, date) ONLY when an admin edits
--                          that specific date. Normal recurring days are never
--                          stored; they are resolved dynamically by the engine.
--   appointments        -> now linked to chamber + date + serial_number
--
-- The old global "availability" table (weekday based, not chamber aware) is
-- retired. Service selection is no longer part of booking (service_id kept as
-- an optional column so historical rows are preserved).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Chambers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chambers (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT    NOT NULL,
  address        TEXT,
  phone          TEXT,
  visiting_days  TEXT    NOT NULL DEFAULT '[]',     -- JSON array of weekday ints, 0=Sun ... 6=Sat
  start_time     TEXT    NOT NULL DEFAULT '16:00',  -- default visiting start (HH:MM, 24h)
  end_time       TEXT    NOT NULL DEFAULT '20:00',  -- default visiting end   (HH:MM, 24h)
  daily_limit    INTEGER NOT NULL DEFAULT 10,       -- default patients per day
  is_active      INTEGER NOT NULL DEFAULT 1,
  display_order  INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Best-effort import of legacy chambers that were stored as JSON in settings.
-- Only name / address / phone can be migrated reliably (days & hours were free
-- text). Imported chambers get NO visiting days, so they resolve to "Off" until
-- the admin configures them in Admin -> Chambers. Runs only when the table is
-- still empty, so it is safe to re-run.
INSERT INTO chambers (name, address, phone, visiting_days, display_order)
SELECT
  COALESCE(NULLIF(TRIM(json_extract(j.value, '$.name')), ''), 'Chamber'),
  NULLIF(TRIM(COALESCE(json_extract(j.value, '$.address'), '')), ''),
  NULLIF(TRIM(COALESCE(json_extract(j.value, '$.phone'), '')), ''),
  '[]',
  j.key
FROM (SELECT value FROM settings WHERE key = 'chambers' AND value IS NOT NULL AND json_valid(value) AND json_type(value) = 'array') s,
     json_each(s.value) j
WHERE NOT EXISTS (SELECT 1 FROM chambers);

-- ---------------------------------------------------------------------------
-- Date-specific overrides (sparse: only explicitly edited dates)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedule_overrides (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  chamber_id         INTEGER NOT NULL REFERENCES chambers(id) ON DELETE CASCADE,
  date               TEXT    NOT NULL,              -- YYYY-MM-DD
  status             TEXT,                          -- 'available' | 'off' | 'closed' | NULL = inherit default
  start_time         TEXT,                          -- NULL = inherit chamber default
  end_time           TEXT,                          -- NULL = inherit chamber default
  appointment_limit  INTEGER,                       -- NULL = inherit chamber default
  note               TEXT,
  created_at         TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (chamber_id, date)
);

CREATE INDEX IF NOT EXISTS idx_overrides_chamber_date ON schedule_overrides(chamber_id, date);

-- ---------------------------------------------------------------------------
-- Appointments: rebuild so service_id becomes optional and we gain
-- chamber_id + serial_number. Existing rows are preserved.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments_v2 (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  reference        TEXT    NOT NULL UNIQUE,
  patient_id       INTEGER NOT NULL REFERENCES patients(id),
  chamber_id       INTEGER REFERENCES chambers(id) ON DELETE SET NULL,
  service_id       INTEGER REFERENCES services(id) ON DELETE SET NULL,
  appointment_date TEXT    NOT NULL,
  serial_number    INTEGER,                        -- per chamber + date
  start_time       TEXT,                           -- visiting window snapshot at booking time
  end_time         TEXT,
  status           TEXT    NOT NULL DEFAULT 'pending',
  message          TEXT,
  admin_note       TEXT,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO appointments_v2 (id, reference, patient_id, service_id, appointment_date, start_time, end_time, status, message, admin_note, created_at, updated_at)
SELECT id, reference, patient_id, service_id, appointment_date, start_time, end_time, status, message, admin_note, created_at, updated_at
FROM appointments;

DROP TABLE appointments;
ALTER TABLE appointments_v2 RENAME TO appointments;

CREATE INDEX IF NOT EXISTS idx_appointments_date          ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status        ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient       ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_chamber_date  ON appointments(chamber_id, appointment_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_serial ON appointments(chamber_id, appointment_date, serial_number);

-- ---------------------------------------------------------------------------
-- Retire the old weekday availability table
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS availability;
