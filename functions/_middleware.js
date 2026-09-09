/**
 * Cloudflare adapter: make the FIRST HTML response already carry the right SEO.
 *
 * Every HTML page served by the SPA shell goes through here:
 *   - public pages (/, /about, /services, /services/:slug, /appointment, /contact, /privacy):
 *       title, description, canonical, robots, Open Graph, Twitter, JSON-LD — resolved from the
 *       doctor profile + settings + services + admin SEO overrides (same resolver the client uses)
 *       PLUS a pre-rendered, crawlable version of the page content inside <div id="root"> (doctor
 *       name, specialty, qualifications, services, chambers, contact…). React replaces it on load.
 *   - admin pages (/admin*):        "noindex, nofollow" (meta + X-Robots-Tag), no public metadata.
 *   - unknown routes / unknown service slugs: HTTP 404 + "noindex, nofollow" so they are never indexed.
 *
 * The React SeoManager still runs client-side for route changes; it re-applies identical tags.
 *
 * Provider-specific glue only — all SEO logic lives in shared/seo (portable). On another host
 * replace this file with an equivalent hook (Express middleware, PHP template, Next.js head…).
 * Safe by design: on any error the untouched HTML is served.
 */
import { resolveSeo, renderHeadHtml, renderPageContent, matchPage, normalizePath } from '../shared/seo/index.js';
import { createSeoRepo } from './api/_lib/seoRepo.js';
import { loadSiteData, resolveSiteUrl } from './api/_lib/siteData.js';

const ROBOTS_NOINDEX = 'noindex, nofollow';

function esc(v) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Replace the static placeholders of index.html with the given head fragment. */
function injectHead(html, fragment) {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+name="description"[^>]*>\s*/i, '')
    .replace(/<meta\s+name="robots"[^>]*>\s*/i, '')
    .replace(/<\/head>/i, `    ${fragment}\n  </head>`);
}

/** Put the pre-rendered page content inside the (empty) React root so crawlers see real text. */
function injectBody(html, content) {
  if (!content) return html;
  return html.replace(/<div id="root"><\/div>/i, `<div id="root">${content}</div>`);
}

function withHeaders(response, html, { status, robots } = {}) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  headers.delete('Content-Length');
  if (robots) headers.set('X-Robots-Tag', robots);
  return new Response(html, { status: status || response.status, headers });
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = normalizePath(url.pathname);

  // API and non-GET traffic are never touched.
  if (request.method !== 'GET' || path.startsWith('/api/')) return next();

  const response = await next();
  const type = response.headers.get('Content-Type') || '';
  if (!type.includes('text/html') || response.status !== 200) return response; // assets, redirects…

  try {
    const html = await response.clone().text();

    // --- Admin area: never indexable, no public metadata --------------------------------
    if (path === '/admin' || path.startsWith('/admin/')) {
      const fragment = `<title data-seo="1">Admin</title>\n    <meta data-seo="1" name="robots" content="${ROBOTS_NOINDEX}">`;
      return withHeaders(response, injectHead(html, fragment), { robots: ROBOTS_NOINDEX });
    }

    const match = matchPage(path);
    if (!env.DB) return response; // no backend bound: plain shell, client-side SEO takes over

    const db = env.DB;
    const [site, records] = await Promise.all([loadSiteData(db), createSeoRepo(db).getAll()]);
    const siteUrl = resolveSiteUrl(site.settings, request);
    const seo = resolveSeo({ path, ...site, records, siteUrl });

    // --- Unknown route or unknown/inactive service slug: real 404 + noindex -------------
    if (!match || seo.notFound) {
      return withHeaders(response, injectHead(html, renderHeadHtml(seo)), { status: 404, robots: ROBOTS_NOINDEX });
    }

    // --- Public page: full metadata + crawlable content -------------------------------------
    // Head tags and body text come from the same data, so a profile/SEO edit in the admin panel
    // changes both on the very next request (no rebuild, no code change).
    const content = renderPageContent({ path, ...site, records, siteUrl });
    const out = withHeaders(response, injectBody(injectHead(html, renderHeadHtml(seo)), content), {
      robots: /noindex/i.test(seo.robots) ? seo.robots : undefined,
    });
    return out;
  } catch {
    return response; // never break the site because of SEO
  }
}
