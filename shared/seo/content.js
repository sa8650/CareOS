/**
 * Server-side content pre-render for public pages ("SEO body").
 *
 * WHY: the React app renders into an empty <div id="root">. Crawlers that don't execute
 * JavaScript (and Google's first, un-rendered pass) would otherwise see a page with correct
 * <head> tags but no text at all. This module renders the *important content* of each public
 * page (doctor name, specialty, qualifications, services, chambers, contact…) as plain, semantic
 * HTML from the same data the React pages use. The output is placed inside #root by the host
 * adapter; React replaces it on hydration — no duplicate content, no layout dependency.
 *
 * Pure JavaScript: no React, no DOM, no database, nothing provider-specific. Any backend
 * (Cloudflare Function, Express, PHP, Next.js…) can call `renderPageContent()` and inject the
 * string into the HTML shell.
 */
import { matchPage } from './pages.js';
import { buildSeoContext, titleCaseIfLower } from './defaults.js';
import { formatTimeRange, formatVisitingDays, asLines, asList, imageUrl } from '../site/format.js';

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const clean = (v) => (v == null ? '' : String(v)).replace(/\s+/g, ' ').trim();

/** Multi-line text -> <p> paragraphs (escaped). */
function paragraphs(text, { max = 6 } = {}) {
  const parts = String(text || '').replace(/\r\n?/g, '\n').split(/\n{2,}|\n/).map(clean).filter(Boolean).slice(0, max);
  return parts.map(p => `<p>${esc(p)}</p>`).join('');
}

function list(items, { max = 12 } = {}) {
  const arr = (Array.isArray(items) ? items : []).map(clean).filter(Boolean).slice(0, max);
  return arr.length ? `<ul>${arr.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : '';
}

/** Lines starting with -, •, * become a list; the rest paragraphs (mirrors ServiceDetails.jsx). */
function descriptionBlock(desc) {
  const lines = String(desc || '').replace(/\r\n?/g, '\n').split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return '';
  const bullets = lines.filter(l => /^[-•*]\s+/.test(l)).map(l => l.replace(/^[-•*]\s*/, ''));
  if (bullets.length && bullets.length >= lines.length - 1) {
    const intro = lines.find(l => !/^[-•*]\s+/.test(l));
    return (intro ? `<p>${esc(intro)}</p>` : '') + list(bullets, { max: 20 });
  }
  return paragraphs(lines.join('\n'));
}

function chamberBlock(c, siteUrl) {
  const hours = formatTimeRange(c.start_time, c.end_time);
  const days = formatVisitingDays(c.visiting_days);
  const rows = [
    c.address && `<p>${esc(c.address)}</p>`,
    c.phone && `<p>Phone: <a href="tel:${esc(String(c.phone).replace(/[^\d+]/g, ''))}">${esc(c.phone)}</a></p>`,
    (hours || days) && `<p>${esc([days, hours].filter(Boolean).join(' · '))}</p>`,
  ].filter(Boolean).join('');
  return `<article><h3>${esc(c.name || 'Chamber')}</h3>${rows}</article>`;
}

function serviceCard(s, siteUrl) {
  const href = `${siteUrl}/services/${encodeURIComponent(s.slug)}`;
  const summary = clean(String(s.description || '').split('\n')[0]).slice(0, 220);
  return `<article><h3><a href="${esc(href)}">${esc(s.name)}</a></h3>${summary ? `<p>${esc(summary)}</p>` : ''}</article>`;
}

function contactBlock(ctx) {
  const rows = [
    ctx.clinic && `<p><strong>${esc(ctx.clinic)}</strong></p>`,
    ctx.address && `<p>${esc(ctx.address)}</p>`,
    ctx.phone && `<p>Phone: <a href="tel:${esc(String(ctx.phone).replace(/[^\d+]/g, ''))}">${esc(ctx.phone)}</a></p>`,
    ctx.email && `<p>Email: <a href="mailto:${esc(ctx.email)}">${esc(ctx.email)}</a></p>`,
  ].filter(Boolean).join('');
  return rows;
}

function navBlock(siteUrl, ctx) {
  const links = [['/', 'Home'], ['/about', 'About'], ['/services', 'Services'], ['/appointment', 'Book Appointment'], ['/contact', 'Contact']];
  return `<nav aria-label="Main"><p><a href="${esc(siteUrl)}/"><strong>${esc(ctx.name)}</strong></a></p><ul>${links.map(([p, l]) => `<li><a href="${esc(siteUrl + p)}">${esc(l)}</a></li>`).join('')}</ul></nav>`;
}

function footerBlock(siteUrl, ctx) {
  return `<footer><p>&copy; ${new Date().getFullYear()} ${esc(ctx.name)}. All rights reserved. <a href="${esc(siteUrl)}/privacy">Privacy Policy</a></p></footer>`;
}

// ---------------------------------------------------------------------------------------------
// Per-page renderers. Each returns <main> inner HTML. Keep them short: this is the crawlable
// summary of the page, not a copy of the React design.
// ---------------------------------------------------------------------------------------------
function homeContent(ctx, siteUrl) {
  const d = ctx.doctor;
  const specs = ctx.specs;
  const stats = Array.isArray(d.stats) ? d.stats.filter(s => s && (s.value || s.label)) : [];
  const sections = Array.isArray(ctx.sections) ? ctx.sections : [];
  const img = imageUrl(ctx.image, siteUrl);
  return [
    `<section><p>${esc(ctx.specialty)}${ctx.location ? ` in ${esc(ctx.location)}` : ''}</p><h1>${esc(ctx.name)}</h1>`,
    d.bio ? paragraphs(d.bio, { max: 2 }) : '',
    (ctx.clinic || ctx.address) ? `<p>${esc([ctx.clinic, ctx.address].filter(Boolean).join(' · '))}</p>` : '',
    stats.length ? `<ul>${stats.map(s => `<li>${esc(s.value)} ${esc(s.label)}</li>`).join('')}</ul>` : '',
    `<p><a href="${esc(siteUrl)}/appointment">Book Appointment</a> · <a href="${esc(siteUrl)}/about">About ${esc(ctx.name)}</a></p></section>`,
    (specs.length || ctx.quals.length) ? `<section><h2>About ${esc(ctx.name)}</h2>${ctx.experience ? `<p>${esc(ctx.experience)}${/experience/i.test(ctx.experience) ? '' : ' of experience'}</p>` : ''}${specs.length ? `<h3>Specializations</h3>${list(specs)}` : ''}${ctx.quals.length ? `<h3>Qualifications</h3>${list(ctx.quals)}` : ''}</section>` : '',
    ...sections.map(sec => `<section><h2>${esc(sec.title)}</h2>${sec.description ? paragraphs(sec.description, { max: 3 }) : ''}${list(sec.benefits, { max: 8 })}</section>`),
    ctx.services.length ? `<section><h2>Services &amp; Treatments</h2>${ctx.services.slice(0, 12).map(s => serviceCard(s, siteUrl)).join('')}<p><a href="${esc(siteUrl)}/services">All services</a></p></section>` : '',
    ctx.chambers.length ? `<section><h2>Chambers &amp; Visiting Hours</h2>${ctx.chambers.map(c => chamberBlock(c, siteUrl)).join('')}</section>` : '',
    img ? `<p><img src="${esc(img)}" alt="${esc(ctx.name)}" width="400" height="400" loading="lazy"></p>` : '',
  ].join('');
}

function aboutContent(ctx, siteUrl) {
  const d = ctx.doctor;
  const img = imageUrl(d.profile_image, siteUrl);
  return [
    `<section><h1>About ${esc(ctx.name)}</h1><p>${esc(ctx.specialty)}${ctx.location ? ` · ${esc(ctx.location)}` : ''}</p>`,
    img ? `<p><img src="${esc(img)}" alt="${esc(ctx.name)}" width="400" height="400" loading="lazy"></p>` : '',
    d.bio ? paragraphs(d.bio) : '',
    ctx.experience ? `<p>${esc(ctx.experience)}${/experience/i.test(ctx.experience) ? '' : ' of experience'}</p>` : '',
    ctx.quals.length ? `<h2>Qualifications</h2>${list(ctx.quals)}` : '',
    ctx.specs.length ? `<h2>Specializations</h2>${list(ctx.specs)}` : '',
    ctx.clinic ? `<p>${esc(ctx.clinic)}${ctx.address ? `, ${esc(ctx.address)}` : ''}</p>` : '',
    `<p><a href="${esc(siteUrl)}/appointment">Book an appointment with ${esc(ctx.name)}</a></p></section>`,
  ].join('');
}

function servicesContent(ctx, siteUrl) {
  return [
    `<section><h1>Services &amp; Treatments</h1><p>Treatments offered by ${esc(ctx.name)}, ${esc(ctx.specialty)}${ctx.location ? ` in ${esc(ctx.location)}` : ''}.</p>`,
    ctx.services.length ? ctx.services.map(s => serviceCard(s, siteUrl)).join('') : '<p>Service details will be published soon.</p>',
    `<p><a href="${esc(siteUrl)}/appointment">Book Appointment</a></p></section>`,
  ].join('');
}

function serviceContent(ctx, siteUrl, service) {
  const s = service || {};
  const benefits = asList(s.benefits);
  const faq = (Array.isArray(s.faq) ? s.faq : []).filter(f => f && f.question && f.answer).slice(0, 10);
  const img = imageUrl(s.image_url, siteUrl);
  return [
    `<section><p><a href="${esc(siteUrl)}/services">Services</a></p><h1>${esc(s.name)}</h1><p>${esc(ctx.name)} · ${esc(ctx.specialty)}${ctx.location ? ` · ${esc(ctx.location)}` : ''}</p>`,
    img ? `<p><img src="${esc(img)}" alt="${esc(s.name)}" width="800" height="450" loading="lazy"></p>` : '',
    descriptionBlock(s.description),
    (s.duration_minutes || s.price) ? `<p>${[s.duration_minutes && `Duration: ${esc(s.duration_minutes)} minutes`, s.price && `Price: ${esc(s.price)}`].filter(Boolean).join(' · ')}</p>` : '',
    benefits.length ? `<h2>Benefits</h2>${list(benefits)}` : '',
    faq.length ? `<h2>Frequently Asked Questions</h2>${faq.map(f => `<h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p>`).join('')}` : '',
    `<p><a href="${esc(siteUrl)}/appointment">Book an appointment for ${esc(s.name)}</a></p></section>`,
  ].join('');
}

function appointmentContent(ctx, siteUrl) {
  return [
    `<section><h1>Book an Appointment</h1><p>Book an appointment with ${esc(ctx.name)}, ${esc(ctx.specialty)}${ctx.location ? ` in ${esc(ctx.location)}` : ''}. Choose a chamber and a date and receive your serial number instantly.</p>`,
    ctx.chambers.length ? `<h2>Chambers</h2>${ctx.chambers.map(c => chamberBlock(c, siteUrl)).join('')}` : '',
    ctx.phone ? `<p>Prefer to call? <a href="tel:${esc(String(ctx.phone).replace(/[^\d+]/g, ''))}">${esc(ctx.phone)}</a></p>` : '',
    `<noscript><p>Online booking needs JavaScript. Please enable it or call the chamber.</p></noscript></section>`,
  ].join('');
}

function contactContent(ctx, siteUrl) {
  return [
    `<section><h1>Contact ${esc(ctx.name)}</h1>`,
    contactBlock(ctx),
    ctx.chambers.length ? `<h2>Chambers &amp; Visiting Hours</h2>${ctx.chambers.map(c => chamberBlock(c, siteUrl)).join('')}` : '',
    `<p><a href="${esc(siteUrl)}/appointment">Book Appointment</a></p></section>`,
  ].join('');
}

function privacyContent(ctx) {
  const text = clean(ctx.settings?.privacy_policy);
  return `<section><h1>Privacy Policy</h1>${text ? paragraphs(ctx.settings.privacy_policy, { max: 40 }).replace(/<p>#{1,3}\s*([^<]*)<\/p>/g, '<h2>$1</h2>') : `<p>How ${esc(ctx.name)} collects, uses and protects your personal information.</p>`}</section>`;
}

/**
 * Render the crawlable content for a public page.
 * @param {object} args  { path, doctor, settings, chambers, services, sections, siteUrl, service }
 * @returns {string} HTML for the inside of <div id="root"> ('' for non-public / unknown pages)
 */
export function renderPageContent(args) {
  const match = matchPage(args.path);
  if (!match || match.page.noindex) return '';
  const ctx = buildSeoContext(args);
  ctx.sections = Array.isArray(args.sections) ? args.sections.filter(s => s && Number(s.is_active ?? 1) === 1) : [];
  ctx.location = titleCaseIfLower(ctx.location);
  const siteUrl = ctx.siteUrl || '';

  let main = '';
  switch (match.page.key) {
    case 'home': main = homeContent(ctx, siteUrl); break;
    case 'about': main = aboutContent(ctx, siteUrl); break;
    case 'services': main = servicesContent(ctx, siteUrl); break;
    case 'service': {
      const service = args.service || ctx.services.find(s => s.slug === match.param);
      if (!service) return '';
      main = serviceContent(ctx, siteUrl, service);
      break;
    }
    case 'appointment': main = appointmentContent(ctx, siteUrl); break;
    case 'contact': main = contactContent(ctx, siteUrl); break;
    case 'privacy': main = privacyContent(ctx); break;
    default: return '';
  }
  // data-prerender marks the block; the React root replaces it entirely on mount.
  return `<div data-prerender="1">${navBlock(siteUrl, ctx)}<main>${main}</main>${footerBlock(siteUrl, ctx)}</div>`;
}
