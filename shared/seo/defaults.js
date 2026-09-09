/**
 * Doctor-driven SEO defaults.
 *
 * Everything here is generated from live data (doctor profile, settings, chambers, services)
 * so the same code works for any doctor. Nothing doctor-specific is hard-coded.
 *
 * Input shape (see buildSeoContext):
 *   {
 *     doctor:   { name, title, bio, specializations[], qualifications[], experience, profile_image, clinic_name, address, phone, email }
 *     settings: { clinic_name, phone, email, address, seo_site_url, seo_site_name, seo_location, seo_default_image, seo_twitter, seo_locale, ... }
 *     chambers: [{ name, address, phone, visiting_days[], start_time, end_time }]
 *     services: [{ name, slug, description, image_url, price, duration_minutes, is_active }]
 *   }
 */
import { PAGES, splitKey } from './pages.js';

const clean = (v) => (v == null ? '' : String(v)).replace(/\s+/g, ' ').trim();
const first = (...vals) => vals.map(clean).find(Boolean) || '';

export function truncate(text, max) {
  const t = clean(text);
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 25)).trim() + '…';
}

/** Pick the first variant that fits `max` characters; fall back to a soft truncate of the last one. */
export function fit(variants, max) {
  for (const v of variants) { const t = clean(v); if (t.length <= max) return t; }
  return truncate(variants[variants.length - 1], max);
}

/** "laksam" -> "Laksam" (only when the value is entirely lower-case; "Dhanmondi, Dhaka" untouched). */
export function titleCaseIfLower(v) {
  const t = clean(v);
  if (!t || t !== t.toLowerCase()) return t;
  return t.replace(/\b\p{L}/gu, ch => ch.toUpperCase());
}

/** Try to extract a city from an address like "123 Road, Dhanmondi, Dhaka 1205" -> "Dhaka". */
export function guessLocation(address) {
  const a = clean(address);
  if (!a) return '';
  const parts = a.split(',').map(p => p.trim()).filter(Boolean);
  if (!parts.length) return '';
  const last = parts[parts.length - 1].replace(/\b\d{3,}\b/g, '').replace(/[-–]\s*$/, '').trim();
  // Skip country-ish last segment if there is a city before it
  if (parts.length >= 2 && /^(bangladesh|india|pakistan|usa|uk|united kingdom|united states|canada|australia)$/i.test(last)) {
    return parts[parts.length - 2].replace(/\b\d{3,}\b/g, '').trim();
  }
  return last;
}

/** Normalised view of everything the defaults need. */
export function buildSeoContext({ doctor, settings, chambers, services, siteUrl } = {}) {
  const s = settings || {};
  const d = doctor || {};
  const ch = Array.isArray(chambers) ? chambers : [];
  const sv = (Array.isArray(services) ? services : []).filter(x => x && (x.is_active === undefined || Number(x.is_active) === 1));

  const specs = Array.isArray(d.specializations) ? d.specializations : [];
  const quals = Array.isArray(d.qualifications) ? d.qualifications : [];

  const name = first(d.name, 'Doctor');
  const specialty = first(d.title, specs[0], 'Specialist Doctor');
  const address = first(s.address, d.address, ch[0]?.address);
  const location = titleCaseIfLower(first(s.seo_location, guessLocation(address)));
  const clinic = first(s.clinic_name, d.clinic_name, ch[0]?.name);
  const siteName = first(s.seo_site_name, clinic ? `${name} – ${clinic}` : name);
  const base = clean(siteUrl || s.seo_site_url).replace(/\/+$/, '');
  const image = first(s.seo_default_image, d.profile_image);

  return {
    doctor: d, settings: s, chambers: ch, services: sv,
    name, specialty, specs, quals, address, location, clinic, siteName,
    siteUrl: base,
    image,
    phone: first(s.phone, d.phone, ch[0]?.phone),
    email: first(s.email, d.email),
    experience: clean(d.experience),
    twitter: clean(s.seo_twitter),
    locale: first(s.seo_locale, 'en_US'),
    serviceNames: sv.map(x => clean(x.name)).filter(Boolean),
  };
}

const inLoc = (ctx) => (ctx.location ? ` in ${ctx.location}` : '');
const listWords = (arr, max = 3) => {
  const a = arr.slice(0, max);
  if (a.length <= 1) return a[0] || '';
  return a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
};

/**
 * Generate default SEO for a page key ("home", "service:hair-prp", ...).
 * Returns the same field names as the DB record, plus `path`, `schema_type`.
 */
export function defaultSeoFor(recordKey, ctx, extra = {}) {
  const { base, param } = splitKey(recordKey);
  const page = PAGES.find(p => p.key === base) || PAGES[0];
  const { name, specialty, location, serviceNames, clinic } = ctx;
  const services3 = listWords(serviceNames, 3);
  const kw = (arr) => [...new Set(arr.map(clean).filter(Boolean))].join(', ');

  const common = {
    page: recordKey,
    robots: page.noindex ? 'noindex, nofollow' : 'index, follow',
    og_image: ctx.image,
    keywords: kw([name, specialty, location && `${specialty} in ${location}`, location && `best ${specialty.toLowerCase()} ${location}`, ...serviceNames.slice(0, 6), clinic]),
  };

  switch (base) {
    case 'home': {
      const exp = ctx.experience ? ` with ${ctx.experience.replace(/of experience$/i, '').trim()} of experience` : '';
      const variants = [
        `${name} is a ${specialty}${inLoc(ctx)}${services3 ? ` providing ${services3}` : ''}${exp}. Book your appointment online.`,
        `${name} is a ${specialty}${inLoc(ctx)}${services3 ? ` providing ${services3}` : ''}. Book your appointment online.`,
        `${name} is a ${specialty}${inLoc(ctx)}${listWords(serviceNames, 2) ? ` providing ${listWords(serviceNames, 2)}` : ''}. Book online.`,
        `${name} is a ${specialty}${inLoc(ctx)}${exp}. Book your appointment online.`,
        `${name} is a ${specialty}${inLoc(ctx)}. Book your appointment online.`,
      ];
      return {
        ...common,
        title: `${name} | ${specialty}${inLoc(ctx)}`,
        description: fit(variants, 160),
        schema_type: 'Physician',
      };
    }
    case 'about':
      return {
        ...common,
        title: `About ${name} | ${specialty}${inLoc(ctx)}`,
        description: fit([
          `Learn about ${name}, ${/^[aeiou]/i.test(specialty) ? 'an' : 'a'} ${specialty}${inLoc(ctx)}${ctx.quals.length ? ` (${ctx.quals.slice(0, 3).join(', ')})` : ''}${ctx.experience ? ` with ${ctx.experience}` : ''}. Qualifications, specializations and approach to patient care.`,
          `Learn about ${name}, ${/^[aeiou]/i.test(specialty) ? 'an' : 'a'} ${specialty}${inLoc(ctx)}${ctx.experience ? ` with ${ctx.experience}` : ''}. Qualifications, specializations and patient care.`,
          `About ${name}, ${specialty}${inLoc(ctx)}: qualifications, specializations and approach to patient care.`,
        ], 160),
        schema_type: 'AboutPage',
      };
    case 'services':
      return {
        ...common,
        title: `Services & Treatments | ${name}${location ? `, ${location}` : ''}`,
        description: fit([
          `${services3 ? `${services3} and more — ` : ''}treatments offered by ${name}, ${specialty}${inLoc(ctx)}. See details and book an appointment.`,
          `Treatments offered by ${name}, ${specialty}${inLoc(ctx)}. See details and book an appointment.`,
        ], 160),
        schema_type: 'WebPage',
      };
    case 'service': {
      const svc = extra.service || ctx.services.find(x => x.slug === param) || {};
      const sName = clean(svc.name) || clean(param).replace(/-/g, ' ');
      const desc = clean(svc.description).replace(/^[-•*]\s*/gm, '').replace(/\s*\n+\s*/g, '. ');
      return {
        ...common,
        title: `${sName}${inLoc(ctx)} | ${name}`,
        description: truncate(desc || `${sName} by ${name}, ${specialty}${inLoc(ctx)}. Learn about the treatment, benefits and book an appointment.`, 160),
        og_image: first(svc.image_url, ctx.image),
        keywords: kw([sName, location && `${sName} ${location}`, name, specialty, ...(Array.isArray(svc.benefits) ? svc.benefits.slice(0, 4) : [])]),
        schema_type: 'MedicalProcedure',
      };
    }
    case 'appointment':
      return {
        ...common,
        title: `Book an Appointment | ${name}${location ? `, ${location}` : ''}`,
        description: fit([
          `Book an appointment with ${name}, ${specialty}${inLoc(ctx)}. Choose a chamber and date and receive your serial number instantly${ctx.chambers.length ? ` — ${ctx.chambers.length} chamber${ctx.chambers.length > 1 ? 's' : ''} available` : ''}.`,
          `Book an appointment with ${name}, ${specialty}${inLoc(ctx)}. Choose a chamber and date — serial number instantly.`,
        ], 160),
        schema_type: 'WebPage',
      };
    case 'contact':
      return {
        ...common,
        title: `Contact ${name} | ${specialty}${inLoc(ctx)}`,
        description: fit([
          `Contact ${name}${clinic ? ` at ${clinic}` : ''}${ctx.address ? `, ${ctx.address}` : ''}${ctx.phone ? `. Call ${ctx.phone}` : ''}. Chamber addresses, visiting hours and directions.`,
          `Contact ${name}${clinic ? ` at ${clinic}` : ''}${ctx.phone ? `. Call ${ctx.phone}` : ''}. Chamber addresses, visiting hours and directions.`,
          `Contact ${name}, ${specialty}${inLoc(ctx)}. Chamber addresses, visiting hours and directions.`,
        ], 160),
        schema_type: 'ContactPage',
      };
    case 'privacy':
      return {
        ...common,
        title: `Privacy Policy | ${name}`,
        description: `How ${name}${clinic ? ` (${clinic})` : ''} collects, uses and protects your personal information when you book an appointment.`,
        robots: 'noindex, follow',
        schema_type: 'WebPage',
      };
    case 'appointment_success':
      return { ...common, title: `Appointment Confirmed | ${name}`, description: 'Your appointment details.', robots: 'noindex, nofollow', schema_type: 'none' };
    default:
      return { ...common, title: `${page.label} | ${name}`, description: `${page.label} — ${name}, ${specialty}${inLoc(ctx)}.`, schema_type: 'WebPage' };
  }
}
