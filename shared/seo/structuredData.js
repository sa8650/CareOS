/**
 * JSON-LD (schema.org) builders — generated from the live doctor / chamber / service data.
 * No doctor-specific values are hard-coded anywhere in this file.
 */
import { socialLinks } from '../site/social.js';

const clean = (v) => (v == null ? '' : String(v)).replace(/\s+/g, ' ').trim();
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function absolute(url, siteUrl) {
  const u = clean(url);
  if (!u) return undefined;
  if (/^https?:\/\//i.test(u)) return u;
  if (!siteUrl) return u;
  // R2 object keys are served through /api/image?key=...
  const path = u.startsWith('/') ? u : `/api/image?key=${encodeURIComponent(u)}`;
  return `${siteUrl}${path}`;
}

function postalAddress(address) {
  const a = clean(address);
  return a ? { '@type': 'PostalAddress', streetAddress: a } : undefined;
}

/** Chambers -> schema.org openingHoursSpecification[] */
export function openingHours(chambers) {
  const out = [];
  for (const c of chambers || []) {
    const days = (Array.isArray(c.visiting_days) ? c.visiting_days : []).map(d => DAY_NAMES[Number(d)]).filter(Boolean);
    if (!days.length || !c.start_time || !c.end_time) continue;
    out.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: days, opens: String(c.start_time).slice(0, 5), closes: String(c.end_time).slice(0, 5) });
  }
  return out.length ? out : undefined;
}

function prune(obj) {
  if (Array.isArray(obj)) return obj.map(prune).filter(v => v !== undefined && v !== '' && !(Array.isArray(v) && !v.length));
  if (obj && typeof obj === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(obj)) {
      const pv = prune(v);
      if (pv !== undefined && pv !== '' && !(Array.isArray(pv) && !pv.length) && !(pv && typeof pv === 'object' && !Array.isArray(pv) && !Object.keys(pv).length)) o[k] = pv;
    }
    return o;
  }
  return obj;
}

/** The doctor as a schema.org Physician (also used as the site-wide entity). */
export function physicianSchema(ctx, { id } = {}) {
  const { doctor: d, siteUrl } = ctx;
  return prune({
    '@type': 'Physician',
    '@id': id || (siteUrl ? `${siteUrl}/#physician` : undefined),
    name: ctx.name,
    url: siteUrl || undefined,
    image: absolute(ctx.image, siteUrl),
    description: clean(d.bio) || undefined,
    medicalSpecialty: ctx.specs.length ? ctx.specs : (ctx.specialty ? [ctx.specialty] : undefined),
    jobTitle: clean(d.title) || undefined,
    telephone: ctx.phone || undefined,
    email: ctx.email || undefined,
    address: postalAddress(ctx.address),
    areaServed: ctx.location || undefined,
    hasCredential: ctx.quals.map(q => ({ '@type': 'EducationalOccupationalCredential', name: q })),
    sameAs: socialLinks(ctx.settings),
    openingHoursSpecification: openingHours(ctx.chambers),
    availableService: ctx.services.slice(0, 12).map(s => ({
      '@type': 'MedicalProcedure', name: clean(s.name),
      url: siteUrl && s.slug ? `${siteUrl}/services/${s.slug}` : undefined,
    })),
    department: ctx.chambers.length > 1 ? ctx.chambers.map(c => clinicSchema(ctx, c)) : undefined,
    potentialAction: siteUrl ? { '@type': 'ReserveAction', target: `${siteUrl}/appointment`, name: 'Book Appointment' } : undefined,
  });
}

/** One chamber as a MedicalClinic. */
export function clinicSchema(ctx, chamber) {
  return prune({
    '@type': 'MedicalClinic',
    name: clean(chamber.name),
    address: postalAddress(chamber.address),
    telephone: clean(chamber.phone) || ctx.phone || undefined,
    openingHoursSpecification: openingHours([chamber]),
  });
}

/** Whole practice as a MedicalBusiness/LocalBusiness with the doctor as employee. */
export function businessSchema(ctx, type = 'MedicalBusiness') {
  const { siteUrl } = ctx;
  return prune({
    '@type': type,
    '@id': siteUrl ? `${siteUrl}/#business` : undefined,
    name: ctx.clinic || ctx.siteName,
    url: siteUrl || undefined,
    image: absolute(ctx.image, siteUrl),
    telephone: ctx.phone || undefined,
    email: ctx.email || undefined,
    address: postalAddress(ctx.address),
    openingHoursSpecification: openingHours(ctx.chambers),
    sameAs: socialLinks(ctx.settings),
    employee: physicianSchema(ctx),
  });
}

export function webPageSchema(ctx, seo, type = 'WebPage') {
  return prune({
    '@type': type,
    '@id': seo.canonical ? `${seo.canonical}#webpage` : undefined,
    name: seo.title,
    description: seo.description,
    url: seo.canonical || undefined,
    isPartOf: ctx.siteUrl ? { '@type': 'WebSite', name: ctx.siteName, url: ctx.siteUrl } : undefined,
    about: { '@id': ctx.siteUrl ? `${ctx.siteUrl}/#physician` : undefined, '@type': 'Physician', name: ctx.name },
  });
}

export function procedureSchema(ctx, seo, service = {}) {
  const faq = Array.isArray(service.faq) ? service.faq.filter(f => f && f.question && f.answer) : [];
  const nodes = [prune({
    '@type': 'MedicalProcedure',
    '@id': seo.canonical ? `${seo.canonical}#procedure` : undefined,
    name: clean(service.name) || seo.title,
    description: seo.description,
    url: seo.canonical || undefined,
    image: absolute(service.image_url || ctx.image, ctx.siteUrl),
    howPerformed: undefined,
    provider: { '@type': 'Physician', '@id': ctx.siteUrl ? `${ctx.siteUrl}/#physician` : undefined, name: ctx.name },
    offers: service.price ? { '@type': 'Offer', price: String(service.price), priceCurrency: clean(ctx.settings.seo_currency) || 'USD', availability: 'https://schema.org/InStock' } : undefined,
  })];
  if (faq.length) {
    nodes.push({
      '@type': 'FAQPage',
      mainEntity: faq.slice(0, 10).map(f => ({ '@type': 'Question', name: clean(f.question), acceptedAnswer: { '@type': 'Answer', text: clean(f.answer) } })),
    });
  }
  return nodes;
}

/**
 * Build the JSON-LD graph for a resolved page.
 * @param ctx   from buildSeoContext
 * @param seo   resolved SEO (title, description, canonical, schema_type, schema_json)
 * @param extra { service } for service pages
 * @returns object | null  (ready for JSON.stringify into <script type="application/ld+json">)
 */
export function buildJsonLd(ctx, seo, extra = {}) {
  // Admin-provided custom schema wins outright.
  if (seo.schema_json) {
    try { return JSON.parse(seo.schema_json); } catch { /* fall through to generated */ }
  }
  const type = seo.schema_type || 'WebPage';
  if (type === 'none') return null;

  const graph = [];
  switch (type) {
    case 'Physician':
      graph.push(physicianSchema(ctx));
      graph.push(webPageSchema(ctx, seo, 'WebPage'));
      break;
    case 'MedicalClinic':
    case 'MedicalBusiness':
    case 'LocalBusiness':
      graph.push(businessSchema(ctx, type));
      break;
    case 'MedicalProcedure':
      graph.push(...procedureSchema(ctx, seo, extra.service || {}));
      graph.push(webPageSchema(ctx, seo, 'WebPage'));
      break;
    case 'AboutPage':
      graph.push(webPageSchema(ctx, seo, 'AboutPage'));
      graph.push(physicianSchema(ctx));
      break;
    case 'ContactPage':
      graph.push(webPageSchema(ctx, seo, 'ContactPage'));
      graph.push(businessSchema(ctx, 'MedicalBusiness'));
      break;
    default:
      graph.push(webPageSchema(ctx, seo, type));
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
