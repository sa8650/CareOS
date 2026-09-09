/**
 * Head-tag rendering for a resolved SEO object.
 *
 *  - applyHead(seo, document)  → mutates the live DOM (React / browser)
 *  - renderHeadHtml(seo)       → returns an HTML string (server-side injection for crawlers)
 *
 * Both produce the same tag set; each managed tag carries data-seo="1" so we can replace
 * exactly our own tags and nothing else.
 */

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The flat list of tags for a resolved SEO object. */
export function headTags(seo) {
  const tags = [];
  const meta = (attrs) => tags.push({ tag: 'meta', attrs });
  if (seo.description) meta({ name: 'description', content: seo.description });
  // NOTE: "keywords" is intentionally NOT emitted — search engines ignore it; the field is kept
  // in the record only as an admin planning aid (see docs/SEO.md).
  meta({ name: 'robots', content: seo.robots || 'index, follow' });
  if (seo.canonical) tags.push({ tag: 'link', attrs: { rel: 'canonical', href: seo.canonical } });

  if (seo.minimal) return tags;                      // admin / 404: title + robots only

  // Open Graph
  meta({ property: 'og:type', content: seo.og_type || 'website' });
  if (seo.og_title) meta({ property: 'og:title', content: seo.og_title });
  if (seo.og_description) meta({ property: 'og:description', content: seo.og_description });
  if (seo.canonical) meta({ property: 'og:url', content: seo.canonical });
  if (seo.site_name) meta({ property: 'og:site_name', content: seo.site_name });
  if (seo.locale) meta({ property: 'og:locale', content: seo.locale });
  if (seo.og_image) meta({ property: 'og:image', content: seo.og_image });

  // Twitter
  meta({ name: 'twitter:card', content: seo.twitter_card || 'summary' });
  if (seo.twitter_site) meta({ name: 'twitter:site', content: seo.twitter_site });
  if (seo.og_title) meta({ name: 'twitter:title', content: seo.og_title });
  if (seo.og_description) meta({ name: 'twitter:description', content: seo.og_description });
  if (seo.og_image) meta({ name: 'twitter:image', content: seo.og_image });

  if (seo.jsonLd) tags.push({ tag: 'script', attrs: { type: 'application/ld+json' }, text: JSON.stringify(seo.jsonLd) });
  return tags;
}

/** Server-side: HTML string with <title> + all tags. */
export function renderHeadHtml(seo) {
  const parts = [`<title data-seo="1">${esc(seo.title)}</title>`];
  for (const t of headTags(seo)) {
    const attrs = Object.entries(t.attrs).map(([k, v]) => `${k}="${esc(v)}"`).join(' ');
    if (t.tag === 'script') {
      // Prevent </script> breaking out of the tag.
      parts.push(`<script data-seo="1" ${attrs}>${String(t.text).replace(/<\//g, '<\\/')}</script>`);
    } else {
      parts.push(`<${t.tag} data-seo="1" ${attrs}>`);
    }
  }
  return parts.join('\n    ');
}

/** Browser: replace previously managed tags and set document.title. */
export function applyHead(seo, doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return;
  const head = doc.head;
  if (seo.title) doc.title = seo.title;

  // Remove tags we (or the server) injected earlier, plus the static index.html description.
  head.querySelectorAll('[data-seo="1"]').forEach(el => { if (el.tagName !== 'TITLE') el.remove(); });
  head.querySelectorAll('meta[name="description"]:not([data-seo]), meta[name="robots"]:not([data-seo])').forEach(el => el.remove());

  for (const t of headTags(seo)) {
    const el = doc.createElement(t.tag);
    el.setAttribute('data-seo', '1');
    for (const [k, v] of Object.entries(t.attrs)) el.setAttribute(k, v);
    if (t.text) el.textContent = t.text;
    head.appendChild(el);
  }
}
