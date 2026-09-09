// Shared helpers for the doctor profile (used by public + admin doctor endpoints).

const NEWLINE = /\r?\n/;
const NEWLINE_OR_COMMA = /\r?\n|,/;

/**
 * Normalise a stored/submitted list value into a clean array of strings.
 * Accepts, in any combination:
 *   - a real array                       ["MBBS", "FCPS"]
 *   - a JSON array string                '["MBBS","FCPS"]'
 *   - a JSON string                      '"MBBS\\nFCPS"'
 *   - plain text, one item per line      "MBBS\nFCPS"
 *   - (specializations) comma separated  "Derma, PRP"
 * Empty / whitespace-only items are dropped.
 */
export function toList(value, separators = NEWLINE_OR_COMMA) {
  if (value == null) return [];

  if (Array.isArray(value)) {
    return value
      .flatMap(v => String(v ?? '').split(NEWLINE))
      .map(v => v.trim())
      .filter(Boolean);
  }

  let str = String(value).trim();
  if (!str) return [];

  if (str.startsWith('[') || str.startsWith('"')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) return toList(parsed, separators);
      if (typeof parsed === 'string') str = parsed;
    } catch { /* not JSON - treat as plain text */ }
  }

  return str.split(separators).map(s => s.trim()).filter(Boolean);
}

/** Qualifications are "one per line" (commas are allowed inside an item). */
export const qualificationsList = (v) => toList(v, NEWLINE);
/** Specializations are comma separated (newlines also accepted). */
export const specializationsList = (v) => toList(v, NEWLINE_OR_COMMA);

/** Hero statistics shown on the Home page (Admin → Profile → Hero Statistics). */
export const DEFAULT_STATS = [
  { value: '10K+', label: 'Patients' },
  { value: '15+', label: 'Years' },
  { value: '4.9', label: 'Rating' },
];
export const MAX_STATS = 4;

/**
 * Normalise stats into [{ value, label }] (max 4, empty rows dropped).
 * Accepts an array or a JSON string. Returns DEFAULT_STATS when nothing is stored.
 */
export function statsList(value, { fallback = true } = {}) {
  let list = value;
  if (typeof list === 'string') {
    try { list = JSON.parse(list); } catch { list = null; }
  }
  if (!Array.isArray(list)) return fallback ? DEFAULT_STATS : [];
  const clean = list
    .map(s => ({ value: String(s?.value ?? '').trim().slice(0, 12), label: String(s?.label ?? '').trim().slice(0, 24) }))
    .filter(s => s.value || s.label)
    .slice(0, MAX_STATS);
  if (!clean.length && fallback && value == null) return DEFAULT_STATS;
  return clean;
}

/** Convert a DB row into the API shape (arrays instead of JSON strings). */
export function parseProfileRow(row) {
  if (!row) return null;
  return {
    ...row,
    qualifications: qualificationsList(row.qualifications),
    specializations: specializationsList(row.specializations),
    stats: statsList(row.stats),
  };
}
