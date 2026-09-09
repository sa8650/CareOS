# SEO system — how it works and how to port it

The SEO layer is **data-driven and provider-independent**. No doctor name, city, domain or
Cloudflare API appears in React source. The same code base serves Doctor A / B / C — only the
profile data (admin panel), the domain and the backend connection change.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ shared/seo   (pure JS, no React, no DB, no Cloudflare)  ← the portable core   │
│   pages.js          public page registry + route matcher                     │
│   schema.js         SEO record shape, validation, limits                     │
│   defaults.js       automatic defaults from doctor/settings/chambers/services│
│   structuredData.js JSON-LD (@graph: Physician / MedicalClinic / WebPage …)  │
│   resolve.js        resolveSeo(): defaults ← generic record ← page record    │
│   head.js           head tags → HTML string (server) or live <head> (client) │
│   sitemap.js        sitemap.xml + robots.txt builders                        │
│   content.js        crawlable page content (pre-render) from the same data   │
├──────────────────────────────────────────────────────────────────────────────┤
│ src/seo      (React)                                                         │
│   SeoManager.jsx    ONE component mounted in App.jsx; on every route change  │
│                     it resolves and applies the head tags. No per-page code. │
│   seoService.js     getSEO / getAllSEO / updateSEO / deleteSEO over HTTP     │
│ src/admin/SeoSettings.jsx   Admin → SEO Settings editor                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ functions/   (Cloudflare adapter — the ONLY place with D1 / Pages code)       │
│   api/_lib/seoRepo.js     the only file that runs SQL for SEO (table seo_pages)│
│   api/_lib/siteData.js    loads doctor + settings + chambers + services      │
│   api/seo.js              GET /api/seo            (public records)           │
│   api/admin/seo/index.js  GET/PUT/DELETE /api/admin/seo (auth guarded)       │
│   sitemap.xml.js, robots.txt.js                                              │
│   _middleware.js          injects tags into index.html for non-JS bots       │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Where the tags — and the content — come from (request lifecycle)

1. **First HTML response (server)** — `functions/_middleware.js` runs for every HTML page and
   rewrites the shell before it leaves the server, so crawlers, link-preview bots and "View
   Source" see the final metadata without executing JavaScript:
   * public page → title, description, canonical, robots, Open Graph, Twitter, JSON-LD **and a
     pre-rendered, crawlable version of the page content inside `<div id="root">`** (doctor name,
     specialty, qualifications, bio, services with links, chambers & hours, contact details — built
     by `shared/seo/content.js` from the same data). Google's first, un-rendered pass and every
     non-JS bot therefore see real text, not an empty shell. React replaces the block on mount;
   * `/admin*` → `noindex, nofollow` (meta + `X-Robots-Tag`), no public metadata;
   * unknown route or unknown/inactive service slug → **HTTP 404** + `noindex, nofollow`;
   * `noindex` pages additionally send an `X-Robots-Tag` header.
   It uses the *same* `resolveSeo()` as the client, so both always agree.
2. **Client (React)** — `SeoManager` keeps the server tags untouched until it has the data, then
   re-applies the same tags and updates them on every client-side route change. Without the
   server step (e.g. plain static hosting) it is the sole source and still covers everything.
3. `index.html` ships only neutral placeholders (`<title>Loading…</title>`, `robots=noindex`)
   which both layers replace — a raw shell without SEO data is never indexable by accident.

## Resolution order (per page)

1. **Automatic defaults** (`shared/seo/defaults.js`) built from the doctor profile, settings,
   chambers and services. Example home title: `Dr. Nafis Rahman | Dermatologist in Dhaka`.
2. **Generic `service` record** — used as a template for every `/services/:slug` page that has
   no record of its own.
3. **Page record** from the database (`home`, `about`, `service:acne-treatment`, …). Any field
   left empty in the record falls back to the level above. Admin can override everything.

Special cases: `/privacy` defaults to `noindex, follow`; `/appointment/success/:id` is always
`noindex, nofollow` and never in the sitemap; `/admin*` gets a plain title + `noindex`; unknown
URLs resolve to `notFoundSeo()` (404, `noindex, nofollow`, no canonical / OG / JSON-LD).

**Keywords** are stored and editable (admin planning aid) but intentionally **not emitted** as a
`<meta name="keywords">` tag — search engines ignore it.

**Sitemap ⇄ canonical contract:** every sitemap `<loc>` is the page's resolved canonical URL;
pages that resolve to `noindex`, that don't exist, or whose canonical points to another host or
to an already-listed page are left out. "Block search engines" empties the sitemap, sets every
page to `noindex, nofollow` and turns robots.txt into `Disallow: /` — all three stay consistent.

## Site-wide inputs (Admin → SEO Settings → "Site-wide settings", stored in `settings`)

| key | purpose | fallback when empty |
|---|---|---|
| `seo_site_url` | canonical / sitemap origin | the current request origin (works on `*.pages.dev` and custom domains) |
| `seo_site_name` | `og:site_name`, JSON-LD organisation name | `clinic_name` → doctor name |
| `seo_location` | city used in titles | guessed from the clinic address |
| `seo_default_image` | `og:image` fallback | doctor profile image |
| `seo_twitter` | `twitter:site` | omitted |
| `seo_locale` | `og:locale` | `en_US` |
| `seo_currency` | JSON-LD `Offer.priceCurrency` | `USD` |
| `seo_block_indexing` | `1` → robots.txt `Disallow: /` (staging) | indexing allowed |

## Adding a new public page

Add one entry to `PAGES` in `shared/seo/pages.js` (key, path, label, default schema type,
sitemap priority). It immediately appears in the admin editor, the sitemap and the resolver.
Dynamic routes use `dynamic: true` + a `pattern` (see the `service` entry).

## Porting to another host / database

* **Different database** (MySQL, Postgres, Supabase, Firebase, Mongo…): rewrite only
  `functions/api/_lib/seoRepo.js` (five functions: `getAll`, `get`, `upsert`, `remove`,
  `isReady`) and the equivalent loaders in `siteData.js`. The React app and `shared/seo` do not
  change. The record shape is documented in `shared/seo/schema.js`.
* **Different backend** (Express, Nest, Laravel, Next.js API routes…): expose the same three
  endpoints — `GET /api/seo`, `GET/PUT/DELETE /api/admin/seo`, plus `/sitemap.xml` and
  `/robots.txt` — by calling the builders in `shared/seo`. They are plain ES modules.
* **Server-side tags + pre-rendered content**: `functions/_middleware.js` is Cloudflare glue only —
  it calls `renderHeadHtml(resolveSeo(...))` and `renderPageContent(...)` and splices both strings
  into `index.html`. Any server can do the same two string replacements (`</head>` and
  `<div id="root"></div>`).
  Without it the client-side `SeoManager` still sets every tag; with any other server, render
  `renderHeadHtml(resolveSeo(...))` into your HTML shell the same way.

## Testing checklist (production)

1. **View Source** (`view-source:https://<domain>/about`): the `<title data-seo="1">`, description,
   canonical, `og:*`, `twitter:*`, robots and the `application/ld+json` block are already in the
   HTML — no JavaScript needed. Scroll to `<div id="root"><div data-prerender="1">`: the doctor's
   name, specialty, qualifications, services and chambers are there as plain text with `<h1>`/`<h2>`
   headings and real links. Compare with a service page and the home page: titles and text differ.
   Change the profile in the admin panel and reload View Source — both head and body follow.
2. **DOM inspection** (DevTools → Elements → `<head>`): exactly one `<title>`, one description, one
   canonical; navigate with the menu and watch them change; no `keywords` meta.
3. `https://<domain>/sitemap.xml` — open 2–3 listed URLs, confirm each returns 200 and its
   canonical equals the sitemap URL. `https://<domain>/robots.txt` — `Sitemap:` line points to the
   same host as the canonicals (set **Site URL** in Admin → SEO Settings when you use a custom domain).
4. `https://<domain>/some-random-page` and `/services/does-not-exist` → 404 + `noindex`;
   `/admin` → `noindex, nofollow`.
5. **Google Search Console** → URL Inspection for `/`, `/about`, one service page: "Indexing
   allowed? Yes", "User-declared canonical" = the page URL, and the rendered title. Then
   *Sitemaps* → submit `sitemap.xml`. Use the Rich Results Test for the Physician /
   MedicalProcedure + FAQPage structured data.
6. Social preview: share a URL in WhatsApp / Facebook Sharing Debugger → title, description and
   image come from the same tags.

## Share images (`og_image`, `seo_default_image`)

Accepted values: a full `https://…` URL, a site-relative path (`/…`), or an **uploaded object key** as returned by
`POST /api/admin/upload` (e.g. `seo/1757000000-ab12cd.jpg`). Keys are resolved to
`https://<site_url>/api/image?key=<encoded key>` when the page is served, in `og:image`, `twitter:image`
and JSON-LD `image`. Anything else (`javascript:`, free text) is discarded by `normalizeSeoRecord`.
