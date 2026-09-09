# Changed files — Chambers + Appointment & Schedule system

All paths are relative to the repository root (`CareOS/`).

---

## 🔴 LATEST UPDATE (round 14: Magic UI Bento Grid dashboard + appointments table + scrolling testimonials) — do these first

**No database change. 10 files to replace, 10 files to add, 1 file to delete.** Nothing to run in the D1 console. Cloudflare Pages builds automatically after the commit (it runs `npm install` → `npm run build`, so the new packages are picked up on their own).

> If you already pushed round 13: this round **replaces** it (the Agent bento dashboard, the grouped sidebar, the styled login and `src/styles/admin.css` are all removed). If you never pushed round 13, just apply this block — it already contains the final versions of every file.

### ✅ What this update does

**1. `/admin` dashboard = Magic UI Bento Grid** (installed with `npx shadcn@latest add @magicui/bento-grid` → `src/components/ui/bento-grid.jsx`), fed by one request to `/api/admin/stats`:

| Card | Shows | Click |
|---|---|---|
| Total Appointments | all counted bookings, completed · pending | `/admin/appointments` |
| Today's Appointments | today's bookings | `/admin/appointments?date=<today>` (filtered to today) |
| Upcoming Appointments | bookings from today onwards | `/admin/appointments` |
| **Today's Schedule** *(wide)* | one row per active chamber: visiting hours, Available / Full / Off / Closed / Ended pill, booked / limit, remaining; "Next sitting …" when off; override note. Numbers come from the existing schedule engine (`functions/api/_lib/schedule.js`) — same as the public calendar | chamber → `/admin/schedule?chamber=<id>`, "Open schedule" |
| Chambers | active count, configured total | `/admin/chambers` |
| Services | active count, total | `/admin/services` |
| **Upcoming Appointments** *(wide)* | next 6 bookings: visiting-hours start + serial, patient (links to the booking), chamber, status; "+N more"; "View all appointments →" | `/admin/appointments` |
| Quick Actions | New Appointment (public booking form, new tab), Manage Schedule, Add Chamber, Add Service (both open the existing "Add" modal), Edit Doctor Profile | existing routes |

Skeleton while loading; "Unable to load dashboard data. — Retry" on error; real empty states ("No upcoming appointments", "No chambers configured → Add Chamber", "No services configured"). No revenue/finance cards, no fabricated activity feed (the "Recent Activity" card was left out because the database has no activity log — nothing was invented). Icons are lucide only; animations are limited to a card hover, a 0.6 s count-up on the numbers and the Magic UI CTA reveal (all off under `prefers-reduced-motion`).

Layout: 3 columns on desktop (3 stats / schedule 2-wide + Chambers, Services / upcoming 2-wide + Quick Actions), 2 columns on tablets, 1 column on phones — checked at 1366 / 768 / 390 px on all 12 admin pages: no horizontal scroll, no console errors, exactly one admin data request (`/api/admin/stats`).

**2. Tailwind is admin-only.** Tailwind v4 is loaded through `src/styles/tailwind.css`, which is imported **only** by `src/admin/AdminLayout.jsx`, does **not** include Tailwind's global reset (preflight) and only scans `src/admin` + `src/components/ui`. Result: the public website's CSS bundle is byte-for-byte the same as before; the Tailwind utilities ship in the lazy-loaded admin chunk. `global.css`, the SEO middleware, robots/sitemap and every API route other than `stats.js` are untouched.

**3. Appointments page (`/admin/appointments`) is a real table on phones too** — Serial · Patient (with date and chamber underneath) · Status, no sideways scrolling; tapping a row still opens the full detail modal. Desktop table unchanged.

**4. Home page testimonials scroll horizontally** — a continuous left-to-right marquee of the existing review cards (a second row scrolling the opposite way appears once there are 4+ reviews); pauses on hover / keyboard focus, static grid under `prefers-reduced-motion`. Hero section untouched.

### ✏️ Replace (10 files)

| # | Path | What changed |
|---|---|---|
| 1 | `package.json` | Adds `clsx`, `tailwind-merge` (runtime, used by `cn()`) and `tailwindcss`, `@tailwindcss/vite` `~4.1.18` (dev). Nothing else removed or changed |
| 2 | `vite.config.js` | Tailwind Vite plugin + the `@` → `src` import alias the shadcn component uses |
| 3 | `functions/api/admin/stats.js` | Trimmed to what the dashboard shows: totals, today/upcoming, per-status counts, chambers/services counts, `schedule_today` (from the schedule engine), `upcoming_list` (6 rows). Old keys `today, pending, confirmed, completed, total, chambers, today_by_chamber, date` kept |
| 4 | `src/admin/AdminLayout.jsx` | Back to the original sidebar/top-bar shell (round-11 responsive drawer), now also imports `styles/tailwind.css` |
| 5 | `src/admin/Dashboard.jsx` | Magic UI bento dashboard |
| 6 | `src/admin/Login.jsx` | Back to the original login card (round-13 styling removed) |
| 7 | `src/admin/Appointments.jsx` | Phone view: compact 3-column table (was card view) |
| 8 | `src/admin/Chambers.jsx` | Opens the "Add Chamber" modal when arriving with `?new=1` (dashboard quick action) |
| 9 | `src/admin/Services.jsx` | Same for "Add Service" |
| 10 | `src/pages/Home.jsx` | Testimonials section → horizontal marquee rows (hero untouched) |

### ➕ Add (10 files)

| # | Path | What it is |
|---|---|---|
| 11 | `jsconfig.json` | `@/*` path alias for editors |
| 12 | `components.json` | shadcn config (jsx, `@magicui` registry, css = `src/styles/tailwind.css`) — only needed if you run the shadcn CLI again |
| 13 | `src/lib/utils.js` | `cn()` helper (clsx + tailwind-merge) required by the Magic UI component |
| 14 | `src/styles/tailwind.css` | Admin-scoped Tailwind entry (no preflight, explicit sources, CareOS colour tokens mapped) |
| 15 | `src/components/ui/bento-grid.jsx` | Magic UI Bento Grid (`BentoGrid`, `BentoCard`), adapted: lucide arrow, React-Router `Link`, `children` slot — see header comment |
| 16 | `src/admin/components/DashboardStatCard.jsx` | Numeric bento card with count-up, clickable |
| 17 | `src/admin/components/DashboardScheduleCard.jsx` | "Today's Schedule" chamber table |
| 18 | `src/admin/components/UpcomingAppointments.jsx` | Upcoming bookings table |
| 19 | `src/admin/components/QuickActions.jsx` | Quick action list |
| 20 | `src/admin/components/DashboardSkeleton.jsx` | Loading skeleton with the same grid shape |

### 🗑️ Delete (1 file)

| # | Path | Why |
|---|---|---|
| 21 | `src/styles/admin.css` | Round-13 admin theme, no longer referenced anywhere (only exists if you pushed round 13) |

`package-lock.json`: if it exists in your repo it is regenerated by Cloudflare's `npm install`; you can also replace it with the one from this workspace. (`src/App.jsx` from round 13 — lazy-loaded admin routes — stays as it is.)

### 🗄️ Database

Nothing to run.

### 🔍 How to verify after deploy

1. Cloudflare Pages build log ends with `✓ built` (Tailwind 4.1 works on Node 18 and 20; the build was tested on Node 20).
2. `/admin` → bento dashboard; "Today's Schedule" matches the Schedule page for today; click "Today's Appointments" → appointments list filtered to today's date; Quick Actions → "Add Chamber" opens the modal.
3. Phone width: dashboard stacks in one column, Appointments page shows the 3-column table without sideways scrolling.
4. Home page: testimonials glide sideways; hover pauses them. DevTools → Network on the Home page: only `index-*.css` loads (no Tailwind on the public site).

Screenshot: `docs/admin-magicui-dashboard.png`.

---

## Round 13: admin panel — Agent bento grid dashboard + admin theme (SUPERSEDED by round 14 — skip this block if you have not applied it yet)

**No database change. 5 files to replace, 1 file to add. Public website untouched.** Nothing to run in the D1 console. No new npm packages (the reference design used Tailwind, framer-motion and Phosphor icons — everything was recreated in plain CSS with the existing `lucide-react` icons, so the build stays exactly as it is).

### ✅ What this update does

**Dashboard (`/admin`) is now a bento grid** built from real clinic data — one request to `/api/admin/stats` feeds five cards:

| Card | Shows | Data source |
|---|---|---|
| **Booking flow** | Animated node graph: Pending → review → Confirmed → Completed / Closed, with live counts on every node, all-time and this-month totals | `appointments` grouped by status |
| **Next 7 days** | Two sliding stat tiles (today's booked / capacity, next 7 days fill %) with sparklines, plus a hatched 7-day bar chart (today highlighted, amber when a chamber is full). Bars link to that day's appointments | the shared schedule engine (`resolveRange`) — same numbers as the public calendar |
| **Activity feed** | Stacked carousel of the latest 6 bookings with status icons; auto-cycles; tap opens the booking | latest `appointments` by `created_at` |
| **Chambers today** *(wide)* | Every active chamber: fill bar with scanning beam, `booked/limit`, open / full / off / closed / ended pill, hours or next sitting date; right pane shows the upcoming serial queue | schedule engine + next counted appointments |
| **Quick actions** | 2×2 3D-icon tiles: pending appointments, active chambers, live services, published testimonials — each with a mini progress bar | counts from the respective tables |

Dashboard header: live date eyebrow, one-line summary, "Review pending (N)" and "Open schedule" buttons. Numbers auto-refresh every 60 s while the tab is open.

**Admin shell (every admin page):** grouped sidebar (Overview / Clinic / Website / System) with a glowing navy backdrop and gradient active pill; user chip + sign-out in the sidebar footer; glass top bar with breadcrumb ("Admin › Schedule"), today's date chip, "View site" link and avatar; content max-width 1480 px. All admin cards, tables, inputs, buttons, badges and modals inherit the bento look (20 px radius hairline-ring cards, 3D gradient primary button, monospace uppercase badges). Login page matches (dot grid, hatched progress strip, 3D logo, proper `autocomplete` attributes).

**Responsive & optimised:** grid is 3 columns on desktop → 2 on ≤1260 px → 1 on phones; the wide chamber card stacks its two panes and switches to two-line rows on phones; sidebar is a drawer on ≤1024 px (tablets too), closes on navigation and on Escape. Checked at 390 / 768 / 1366 px on all 12 admin pages: no horizontal overflow, no console errors. Animations are CSS only, timers pause when the tab is hidden and everything is disabled under `prefers-reduced-motion`. The whole admin panel (JS + its CSS) is now **lazy-loaded**, so patients on the public site download ~33 % less JavaScript (462 kB → 310 kB main bundle) and none of the admin CSS.

**Untouched:** all public pages, `global.css`, SEO middleware/head/prerender, robots/sitemap, admin `noindex`, every other API route. The `/api/admin/stats` response still contains all the old keys (`today`, `pending`, `confirmed`, `completed`, `total`, `chambers`, `today_by_chamber`, `date`), so nothing else depends on the change.

### ✏️ Replace (5 files)

| # | Path | What changed |
|---|---|---|
| 1 | `src/App.jsx` | Admin routes are lazy-loaded (`React.lazy` + `Suspense`); public routes unchanged |
| 2 | `src/admin/AdminLayout.jsx` | New shell: grouped nav, breadcrumb top bar, user chip, drawer ≤1024 px, imports `styles/admin.css` |
| 3 | `src/admin/Dashboard.jsx` | Bento grid dashboard (5 cards) |
| 4 | `src/admin/Login.jsx` | Bento styling, hatched strip, back-to-website link, autocomplete attrs |
| 5 | `functions/api/admin/stats.js` | Richer stats: per-status + this-month counts, 7-day capacity from the schedule engine, chambers-today, recent + upcoming bookings, services/testimonials counts (old keys kept) |

### ➕ Add (1 file)

| # | Path | What it is |
|---|---|---|
| 6 | `src/styles/admin.css` | The admin/bento design system (scoped to `.admin-layout` / `.login-page` / `.bt-*`, so it cannot affect the public site) |

### 🗄️ Database

Nothing to run.

### 🔍 How to verify after deploy

1. Log in at `/admin` → the dashboard shows the five cards; the "Chambers today" card lists your real chambers with today's status; the 7-day bars match the Schedule page counts.
2. Resize to phone width → the menu button opens the drawer; cards stack in one column; nothing scrolls sideways.
3. Open the public Home page → looks exactly as before (admin CSS is not loaded there; check DevTools → Network: `admin-*.css` only appears under `/admin`).

---

## Round 12: consistent professional theme — hero untouched

**No database change. 12 files to replace, nothing to add.** Nothing to run in the D1 console. Includes everything from round 11 (the round-11 files below are the current versions of those files, so replacing them once covers both rounds).

### ✅ What this update does

**The Home hero section is byte-for-byte unchanged** (markup + all 42 CSS rules verified identical). Everything after it now follows one design system instead of six different per-page backgrounds:

| Surface | Used for | Colour |
|---|---|---|
| **White** | About-me preview, alternate featured sections, Specializations, Services CTA | `#ffffff` |
| **Soft band** (`.section-alt`) | Featured sections, Conditions, Testimonials, Qualifications, Services grid, service detail, Contact, Appointment, Privacy | `#f4f8fb` + faint dot grid |
| **Navy band** (`.section--dark`) | Home "Chamber Details", Contact "Have a Question?" | `#0f172a` with sky/violet glows |
| **Sky hero** (`.page-hero`) | Every sub-page header | the Home hero's own gradient + soft glows, so About / Services / Contact / Appointment / Privacy open exactly like Home |
| **Sky CTA** | Home bottom CTA | same hero gradient with a brand-gradient panel inside |
| **Navy footer** | All pages | matches the marquee strip and the navy bands; brand-gradient top line |

Other visible changes: every sub-page hero gets a white pill tag (e.g. "6 Treatments", "Get in touch", "Your data, protected"); glass chamber cards on navy with green day pills; testimonial cards with a quote mark and gradient avatars; About photo gets the hero's tilted gradient backdrop, qualifications and specializations become proper cards/pills; Services page ends with a "Not sure which treatment?" CTA card; service detail content and booking box are white cards on the soft band with duration/price pills in the hero; Contact cards are labelled, map box is a dotted white card; Privacy text sits in a white card; navbar links are pill-shaped with an active state, glassier bar and a proper phone menu; all `.card`s are static (only clickable cards lift on hover). Old `.appt-section` background replaced by the shared soft band. Admin panel: unchanged apart from cards inheriting the softer shadow.

Checked at 390 px / 768 px / 1366 px: no horizontal overflow on any public page; SEO head/prerender and the 404 `noindex` untouched.

### ✏️ Replace (12 files)

| # | Path | What changed |
|---|------|--------------|
| 1 | `CareOS/src/styles/global.css` | Theme tokens (`--color-bg-soft`, `--color-navy`, `--gradient-hero`, `--gradient-brand`, `--shadow-card`), shared `.section-alt` / `.section--dark` / `.page-hero` / `.page-hero-tag` / `.section-header` / `.section-tag`, card shadow; round-11 toast rules included |
| 2 | `CareOS/src/pages/Home.jsx` | Hero untouched; About-me highlight pills, navy Chambers band with glass cards, testimonial cards, sky CTA with gradient panel, per-page `.page-hero`/`.section-alt` overrides removed |
| 3 | `CareOS/src/pages/About.jsx` | Hero tag, tilted gradient photo backdrop, credential cards, specialization pills, section headers |
| 4 | `CareOS/src/pages/Services.jsx` | Hero tag with treatment count, grid on soft band, closing CTA card |
| 5 | `CareOS/src/pages/ServiceDetails.jsx` | Hero tag + duration/price pills, white content card on soft band, benefit tiles, FAQ styling, sticky booking box |
| 6 | `CareOS/src/pages/Contact.jsx` | Hero tag, labelled info cards, dotted map card, navy "Have a Question?" band |
| 7 | `CareOS/src/pages/Privacy.jsx` | Hero tag, policy in a white card on the soft band |
| 8 | `CareOS/src/pages/Appointment.jsx` | Uses shared compact hero + soft band (round-11 text/background changes included) |
| 9 | `CareOS/src/pages/AppointmentSuccess.jsx` | Shared hero with white check badge, card on soft band (round-11 toast included) |
| 10 | `CareOS/src/components/Navbar.jsx` | Glass bar, pill links with active state, phone menu |
| 11 | `CareOS/src/components/Footer.jsx` | Navy with glows + brand top line, uppercase headings, social buttons |
| 12 | `CareOS/src/components/AppointmentForm.jsx` | Unchanged since round 11 — replace only if you skipped round 11 |

### 🧪 Check after deploy

1. Home: hero identical to before; scroll down → white → soft dotted → … → **navy Chamber Details** → soft Testimonials → sky CTA → navy footer, with no abrupt colour jumps.
2. About / Services / Contact / Privacy / Appointment: header uses the same sky gradient as the Home hero with a small white pill above the title.
3. Phone: tap ☰ → white dropdown with pill links and a full-width Book Appointment button.

---

## Round 11: mobile/tablet responsive + appointment page + toasts + SEO image fix (delivered earlier)

**No database change. 17 files to replace (+1 optional doc) + 1 file to add.** Nothing to run in the D1 console.

### ✅ What this update does

1. **Whole system responsive (public site + admin panel)** — checked every public page and all 12 admin pages at 390 px (phone), 768 px (tablet) and 1024 px (tablet landscape): **no horizontal overflow anywhere** (before: Dashboard, Appointments, Profile, Gallery and Testimonials all pushed the phone layout to 430–1240 px wide).
   - Root cause fixed in `AdminLayout.jsx` (`.admin-main { min-width: 0 }`) so wide tables scroll inside their wrapper instead of stretching the whole page; tap-to-close backdrop behind the mobile sidebar; smaller topbar/title/padding, full-width modals with stacked footer buttons on phones.
   - **Appointments (admin)**: on phones every appointment is a **card** (serial chip top-right, patient, tappable phone number, chamber, date, hours, status, reference); tap the card to open the detail modal. Search/filter inputs go full width. Table view unchanged on desktop.
   - **Testimonials (admin)**: cards on phones (Publish/Edit/Delete were previously off-screen to the right).
   - Dashboard stat cards 2-up with smaller numbers; "Today by chamber" one per row; Reference column hidden in "Recent appointments" on phones.
   - Profile: 2-column fields stack; stats editor rows fit; preview box wraps. Gallery: caption + Upload full width, 2-column thumbnails. Schedule: chamber selector full width, stats 3-up (2-up under 420 px). Chambers/Gallery/Dashboard grids use `minmax(min(Npx, 100%), 1fr)` so they can never be wider than the screen.
   - Public booking form: chamber cards 1-per-row, Back/Continue buttons stacked full width, step pills tightened.
2. **Public appointment page** — page background is now soft grey-blue (`#eef4f8`); the booking form is a white card with border + shadow; the calendar sits on a tinted panel so day cells (white/green) are distinct from the card and from the page. Removed the "N of N slots remaining · you will be serial #N" line and the "You can book up to 30 days in advance. Your serial number is assigned in order of booking." sentence. Calendar tooltip no longer reveals remaining count.
3. **Confirmation toasts visible without scrolling** — every route change now scrolls to the top (new `ScrollToTop` component), so the "Appointment Booked!" page opens at the top with a 5-second green toast **"Appointment booked — your serial is #N"** fixed at the top of the screen. Moving between booking steps (and any booking error) scrolls the form back into view. In the admin panel all save messages (Profile, Settings, Privacy, Chambers, Schedule, SEO) are now **fixed overlays** at the top of the screen — you see them even after pressing a Save button at the bottom of a long form (previously they rendered above the form, out of view).
4. **SEO image save bug — found and fixed.** Titles/descriptions saved fine, but an **uploaded OG/share image was silently dropped**: the uploader returns an object key like `seo/1757…-ab12cd.jpg`, and the validator in `shared/seo/schema.js` only accepted `http(s)://…` or `/…` values, so `og_image` was stored as empty every time. Keys are now accepted (dangerous values such as `javascript:` are still rejected) and are turned into absolute `https://<site>/api/image?key=…` URLs in `og:image`, `twitter:image` and JSON-LD (verified in the raw HTML). Pasted full URLs keep working. The site-wide default image (SEO Settings → Site) already worked and is unchanged.

### ✏️ Replace (17 files + 1 optional doc)

| # | Path | What changed |
|---|------|--------------|
| 1 | `CareOS/src/styles/global.css` | `.toast` is a fixed top overlay (top-centre on phones), auto-animates in |
| 2 | `CareOS/src/App.jsx` | Mounts `<ScrollToTop />` |
| 3 | `CareOS/src/components/AppointmentForm.jsx` | Text removals, white card + calendar panel, mobile layout, scroll-into-view on step change/error |
| 4 | `CareOS/src/pages/Appointment.jsx` | Distinct page background, tighter mobile grid gap |
| 5 | `CareOS/src/pages/AppointmentSuccess.jsx` | 5-second confirmation toast, phone sizing (stacked buttons, smaller hero) |
| 6 | `CareOS/src/admin/AdminLayout.jsx` | `min-width: 0` root fix, sidebar backdrop, phone topbar/content/modal rules |
| 7 | `CareOS/src/admin/Appointments.jsx` | Card layout on phones, tappable rows, tel: links, full-width filters |
| 8 | `CareOS/src/admin/Dashboard.jsx` | Phone stat grid, chamber list, hidden Reference column |
| 9 | `CareOS/src/admin/Testimonials.jsx` | Card layout on phones, header stacks |
| 10 | `CareOS/src/admin/Profile.jsx` | Stacked fields, stats rows fit, floating toast |
| 11 | `CareOS/src/admin/Gallery.jsx` | Full-width upload controls, 2-column grid |
| 12 | `CareOS/src/admin/Schedule.jsx` | Full-width chamber select, stats grid, floating toast |
| 13 | `CareOS/src/admin/Chambers.jsx` | Grid can't exceed screen width, floating toast |
| 14 | `CareOS/src/admin/Settings.jsx` | Floating toast |
| 15 | `CareOS/src/admin/PrivacyEditor.jsx` | Floating toast |
| 16 | `CareOS/src/admin/SeoSettings.jsx` | Save/error alerts float at the top and auto-hide |
| 17 | `CareOS/shared/seo/schema.js` | Accept uploaded image keys for `og_image` (the actual bug) |
| 18 | `CareOS/docs/SEO.md` *(optional)* | Note on accepted share-image values |

### ➕ Add (1 file)

| # | Path | Purpose |
|---|------|---------|
| 1 | `CareOS/src/components/ScrollToTop.jsx` | Scrolls to the top on every route change (hash links excluded) |

### 🧪 Check after deploy

1. Phone: open `/appointment` → grey-blue page, white form card, tinted calendar panel; no "slots remaining" / "30 days in advance" text. Book → confirmation page opens at the top with the green toast.
2. Phone: log in → Appointments shows cards; tap one → modal fills the screen; Profile → scroll to the bottom → Save → green "Profile updated successfully!" appears at the top of the screen without scrolling.
3. Admin → SEO Settings → pick a page → Upload a share image → Save → reload the page: the image is still there. View Source of that page shows `og:image` = `https://dr-care.pages.dev/api/image?key=seo%2F…`.
4. Rotate a tablet: no sideways scrolling on any admin page.

---

## Round 10: crawlable content in the first HTML response (delivered earlier)

**No database change, no new admin screens.** 5 files to replace + 2 files to add. Architecture unchanged (shared pure-JS core → API → replaceable D1 adapter; React `SeoManager` stays as the client-side updater).

### 🔎 What was still wrong (checked on the live site)

The `<head>` of every public page was already correct in View Source (title, description, canonical, robots, OG, Twitter, JSON-LD), **but the `<body>` was an empty `<div id="root"></div>`** — the doctor's name and all page text only appeared after React ran and called the API. A crawler that doesn't execute JavaScript (and Google's first, un-rendered pass) saw a page with metadata but zero content.

### ✅ What this update does

The server now also injects a **pre-rendered, crawlable version of the page content** into `#root` — doctor name, specialty, bio, qualifications, specializations, hero stats, Home featured sections, services (with links to every service page), chambers with visiting days/hours, contact details, service description/benefits/FAQ, privacy text. Same data source as the head tags (profile + settings + services + chambers + SEO records) → editing anything in the admin panel changes head **and** body on the very next request, no rebuild, no code change. React replaces the block on mount (verified: no duplicate `<h1>`/nav/footer, SPA navigation and booking flow untouched). A minimal inline stylesheet keeps the pre-render readable for the few hundred milliseconds before hydration and for no-JS visitors.

### ✏️ Replace (5 files)

| # | Path | What changed |
|---|------|--------------|
| 1 | `CareOS/functions/_middleware.js` | Also calls `renderPageContent()` and splices the result into `<div id="root">` for public pages (404 / admin unchanged) |
| 2 | `CareOS/functions/api/_lib/siteData.js` | Also loads the active Home featured sections (tolerant if the table doesn't exist) |
| 3 | `CareOS/shared/seo/index.js` | Re-exports the new `content.js` |
| 4 | `CareOS/index.html` | Small inline `[data-prerender]` stylesheet (no doctor data, no meta tags) |
| 5 | `CareOS/docs/SEO.md` *(optional)* | Lifecycle + verification steps updated |

### ➕ Add (2 files)

| # | Path | Layer | What it is |
|---|------|-------|------------|
| 1 | `CareOS/shared/seo/content.js` | portable core | `renderPageContent({ path, doctor, settings, chambers, services, sections, siteUrl })` → semantic HTML per public page. Pure JS, everything HTML-escaped, no React/DB/Cloudflare |
| 2 | `CareOS/shared/site/format.js` | portable core | Tiny shared formatters (`formatTime`, `formatVisitingDays`, `asList`, `imageUrl`) used by the renderer |

### 🧪 Verify on production after deploying

1. **View Source** `view-source:https://dr-care.pages.dev/` → below `<div id="root">` you now see `<div data-prerender="1">` with `<h1>Dr. …</h1>`, specialty, qualifications, services and chambers as plain text. Repeat for `/about`, `/services`, one `/services/<slug>`, `/appointment`, `/contact`.
2. Browser: the page looks exactly as before (React replaces the block instantly); DevTools → Elements shows **no** `data-prerender` element after load.
3. Admin → Profile: change the title or a qualification → reload View Source → the raw HTML already contains the new value (no deploy).
4. Search Console → URL Inspection → *Test live URL* → *View tested page* → **HTML** tab shows the doctor content; *Screenshot* shows the real design. Then *Request indexing* for `/`, `/about`, `/services`.

---

## 🟠 Round 9 (SEO audit fixes — 404/noindex/canonical) — already live on dr-care.pages.dev ✅

An audit of the live site (`dr-care.pages.dev`) against the round-8 SEO system. **No database change, no new tables, no new admin screens** — only 8 files, all replacements, and the architecture stays exactly as it is (shared core → API → replaceable D1 adapter).

### 🔎 What the audit found (live site, before this update)

| # | Finding | Effect on Google |
|---|---------|------------------|
| 1 | Unknown URLs (`/no-such-page`, `/ABOUT`) and **deleted / misspelled service slugs** (`/services/anything`) returned **200** with a generated title like "anything in laksam \| Dr. …" and `index, follow` | Infinite indexable junk pages, duplicate content |
| 2 | `/admin*` pages served the bare shell (`<title>Loading…</title>`, no robots directive) | Admin pages could be indexed |
| 3 | `index.html` placeholder had no robots directive at all | A shell served without SEO data was indexable |
| 4 | `<meta name="keywords">` was emitted on every page | Harmless but useless — search engines ignore it |
| 5 | Service pages had no `WebPage` node and no stable `@id`s in JSON-LD; page nodes could not be referenced | Weaker structured data |
| 6 | "Block search engines" only changed robots.txt — pages still said `index, follow` and the sitemap still listed them | Inconsistent signals on a staging site |
| 7 | Sitemap could list a URL whose admin-set canonical points elsewhere (another page or another domain) | Sitemap/canonical mismatch warnings in Search Console |
| 8 | Live data: location came out as lower-case "laksam" (typed that way in Settings → Address) | Titles look unprofessional: "… Specialist in laksam" |

Already correct and kept unchanged: server-injected title/description/canonical/OG/Twitter/JSON-LD on `/`, `/about`, `/services`, `/services/:slug`, `/appointment`, `/contact`; self-referencing canonicals; `/privacy` noindex; success page noindex; dynamic sitemap + robots.txt; admin SEO manager; D1-only adapter.

### ✏️ Replace (8 files)

| # | Path | What changed |
|---|------|--------------|
| 1 | `CareOS/functions/_middleware.js` | The first HTML response now covers **every** route: public pages get full metadata (as before); `/admin*` gets `noindex, nofollow` (meta + `X-Robots-Tag` header); unknown routes and unknown/inactive service slugs get a real **HTTP 404** + `noindex, nofollow`; `noindex` pages also send `X-Robots-Tag`. Still fails safe (untouched HTML on any error) and never touches `/api/*` or assets |
| 2 | `CareOS/shared/seo/resolve.js` | Unknown service slug / unknown path → `notFoundSeo()` (title only, `noindex, nofollow`, no canonical/OG/JSON-LD); "Block search engines" now forces `noindex, nofollow` on every page |
| 3 | `CareOS/shared/seo/head.js` | Stops emitting `meta keywords`; client `applyHead` also removes the static robots placeholder |
| 4 | `CareOS/shared/seo/structuredData.js` | Service pages: `MedicalProcedure` (+ `FAQPage`) **plus** a `WebPage` node; stable `@id`s (`…#webpage`, `…#procedure`) |
| 5 | `CareOS/shared/seo/sitemap.js` | Sitemap `<loc>` = resolved canonical; skips 404s, noindex pages, canonicals pointing to another host, and duplicates; empty when indexing is blocked; new shared `isIndexingBlocked()` |
| 6 | `CareOS/shared/seo/defaults.js` | Location is title-cased when it was typed all lower-case ("laksam" → "Laksam"; mixed-case values untouched) |
| 7 | `CareOS/src/seo/SeoManager.jsx` | Keeps the server-rendered tags until it has data (no flash of defaults), then re-applies identical tags on client-side navigation; unknown routes / unknown slugs → `noindex` client-side too; admin → `noindex` immediately |
| 8 | `CareOS/index.html` | Placeholder now also carries `<meta name="robots" content="noindex">` — a raw shell without SEO data can never be indexed by accident (replaced on every real page by the server/client) |
| — | `CareOS/functions/robots.txt.js`, `CareOS/src/admin/SeoSettings.jsx`, `CareOS/docs/SEO.md` *(optional but recommended)* | robots.txt reuses the shared block-indexing helper; keywords field relabelled "Target keywords — planning note only"; docs updated with the request lifecycle + production testing checklist |

### ✅ Verify on production after deploying (takes 5 minutes)

1. **View Source** `view-source:https://dr-care.pages.dev/about` → `<title data-seo="1">About Dr. …</title>`, description, canonical, `og:*`, `twitter:*`, robots and the JSON-LD block are all in the raw HTML. Repeat for one service page — different title, different description.
2. **DOM**: DevTools → Elements → `<head>`: one `<title>`, one description, one canonical, **no** `keywords` meta. Click through the menu — they update.
3. `https://dr-care.pages.dev/anything-random` and `/services/does-not-exist` → **404**, `noindex, nofollow`. `https://dr-care.pages.dev/admin` → `noindex, nofollow`.
4. `https://dr-care.pages.dev/sitemap.xml` → open two listed URLs; each returns 200 and its canonical equals the sitemap URL. `robots.txt` → `Sitemap:` line uses the same host.
5. **Google Search Console** → URL Inspection on `/`, `/about`, one service page → "Indexing allowed? Yes", user-declared canonical = the URL. Then Sitemaps → submit `sitemap.xml`.

> ⚠️ **One thing only you can fix — the domain.** Your live canonicals, sitemap and `og:image` all point to `https://dr-nafis.pages.dev`, which **does not resolve** (DNS lookup fails). Google will treat every `dr-care.pages.dev` page as a duplicate of a dead URL and will not index it. Go to **Admin → SEO Settings → Site URL** and either clear it (the site then uses whatever domain it is served on) or set it to the real final domain (e.g. `https://dr-care.pages.dev` or your custom domain once attached). Also **Settings → Address**: type it as `Laksam, Cumilla` (proper case, with district) — it feeds titles and JSON-LD.

---

## 🟠 Round 8 (portable dynamic SEO system) — already live on dr-care.pages.dev ✅

Compared against your GitHub `main` on 2026-09-07. **Nothing on the site depends on doing the SQL first** — deploy the files, then run the SQL whenever convenient; until then every page simply uses the automatic SEO defaults and the admin page shows a yellow reminder.

### 🗄️ Step 1 — database (one statement, ~5 seconds)

Cloudflare dashboard → **Workers & Pages → D1 → `doctor-db` → Console** → paste → **Execute**:

```sql
CREATE TABLE IF NOT EXISTS seo_pages (page TEXT PRIMARY KEY, title TEXT, description TEXT, keywords TEXT, canonical TEXT, og_title TEXT, og_description TEXT, og_image TEXT, robots TEXT, schema_type TEXT, schema_json TEXT, updated_at TEXT NOT NULL DEFAULT (datetime('now')));
```

(That is the whole content of `CareOS/migrations/004_seo.sql`. It only creates one empty table — no existing data is touched. Fresh installs get it from `001_initial.sql` automatically.)

### ✏️ Step 2 — Replace (6 files)

| # | Path | Why |
|---|------|-----|
| 1 | `CareOS/src/App.jsx` | Mounts the single `<SeoManager />` (one place for all pages) + admin route `/admin/seo` |
| 2 | `CareOS/src/admin/AdminLayout.jsx` | Sidebar entry **SEO Settings** |
| 3 | `CareOS/src/admin/Services.jsx` | Refreshes the SEO service list after you add/rename/delete a service |
| 4 | `CareOS/src/utils/helpers.js` | Social-link helpers moved to `shared/site/social.js` (re-exported here, so nothing else changes) |
| 5 | `CareOS/index.html` | Hard-coded title/description removed — they now come from the profile |
| 6 | `CareOS/migrations/001_initial.sql` *(optional)* | Fresh installs create `seo_pages` automatically |
| — | `CareOS/scripts/reset.sql`, `CareOS/scripts/seed.sql` *(optional)* | Reset drops `seo_pages` too; seed adds two empty `seo_*` settings rows |

### ➕ Step 3 — Add (19 files)

| # | Path | Layer | What it is |
|---|------|-------|------------|
| 1 | `CareOS/shared/seo/pages.js` | portable core | Registry of public pages (Home, About, Services, `/services/:slug`, Appointment, Contact, Privacy, success) — add future pages here |
| 2 | `CareOS/shared/seo/schema.js` | portable core | SEO record fields, limits, validation |
| 3 | `CareOS/shared/seo/defaults.js` | portable core | Automatic defaults from the profile: `{Doctor} \| {Specialty} in {Location}` etc. |
| 4 | `CareOS/shared/seo/structuredData.js` | portable core | JSON-LD (Physician / MedicalClinic / MedicalProcedure + FAQ / WebPage…) from profile + chambers + services |
| 5 | `CareOS/shared/seo/resolve.js` | portable core | `resolveSeo()` — defaults ← generic service record ← page record |
| 6 | `CareOS/shared/seo/head.js` | portable core | Builds title/description/canonical/OG/Twitter/robots/JSON-LD tags (server string or live `<head>`) |
| 7 | `CareOS/shared/seo/sitemap.js` | portable core | sitemap.xml + robots.txt builders |
| 8 | `CareOS/shared/seo/index.js` | portable core | Re-exports |
| 9 | `CareOS/shared/site/social.js` | portable core | Social platform list (shared by the footer and the JSON-LD `sameAs`) |
| 10 | `CareOS/src/seo/SeoManager.jsx` | React | The one centralized SEO component (route change → tags) |
| 11 | `CareOS/src/seo/seoService.js` | React | `getSEO / getAllSEO / updateSEO / deleteSEO` over HTTP — no DB code |
| 12 | `CareOS/src/admin/SeoSettings.jsx` | React admin | **Admin → SEO Settings**: site-wide settings, page list with auto/custom badges, per-page editor, Google + social previews, OG image upload, schema type / custom JSON |
| 13 | `CareOS/functions/api/_lib/seoRepo.js` | backend adapter | The **only** file with SQL for SEO (table `seo_pages`) — swap this for MySQL/Postgres/Supabase… |
| 14 | `CareOS/functions/api/_lib/siteData.js` | backend adapter | Loads doctor + settings + chambers + services for the resolver (reuses existing tables, no duplicates) |
| 15 | `CareOS/functions/api/seo.js` | backend adapter | Public `GET /api/seo` |
| 16 | `CareOS/functions/api/admin/seo/index.js` | backend adapter | `GET / PUT / DELETE /api/admin/seo` (existing admin auth) |
| 17 | `CareOS/functions/sitemap.xml.js` | backend adapter | Dynamic `/sitemap.xml` (public pages + every active service; skips noindex pages) |
| 18 | `CareOS/functions/robots.txt.js` | backend adapter | Dynamic `/robots.txt` (+ "block search engines" switch for staging) |
| 19 | `CareOS/functions/_middleware.js` | backend adapter | Injects the resolved tags into the HTML for bots that don't run JavaScript (WhatsApp/Facebook previews, crawlers). Fails safe: on any error it serves the untouched page |
| — | `CareOS/migrations/004_seo.sql`, `CareOS/docs/SEO.md` | | The SQL above + architecture / porting guide |

### ✅ After deploying

1. **Admin → SEO Settings** → fill **Location (city)** (e.g. `Dhaka`) and, once you have a custom domain, **Site URL** (leave empty on `dr-care.pages.dev` — it uses the current domain automatically). Save.
2. Check `https://dr-care.pages.dev/sitemap.xml` and `/robots.txt`, then `view-source:` of the home page — you'll see `<title data-seo="1">Dr. Nafis Rahman | … in Dhaka</title>` plus the JSON-LD block.
3. Optional: pick any page in the list and override the title/description/OG image. Empty fields keep the automatic value (shown as placeholder); **Use defaults** removes an override.
4. Submit the sitemap in Google Search Console.

---

## 🟠 Round 7 (editable hero stats + smaller headers + chamber section) — push together with round 8 if not done yet

Compared against your current GitHub `main` on 2026-09-07 (round 6 is already pushed ✅): **8 files** (6 replace + 2 add) **+ one SQL statement in the D1 console**.

### 🗄️ Step 1 — database (one time, ~5 seconds)

Cloudflare dashboard → **Workers & Pages → D1 → `doctor-db` → Console** → paste this single line → **Execute**:

```sql
ALTER TABLE doctor_profile ADD COLUMN stats TEXT;
```

(That is the whole content of `CareOS/migrations/003_profile_stats.sql`.) It only adds one empty column — nothing else changes, no data is lost.

> If you deploy the files first and run the SQL later, nothing breaks: the site keeps showing the default 10K+ / 15+ / 4.9, and the Profile page saves everything else but tells you "Statistics were not saved: run migrations/003…" until the column exists.

### ✏️ Step 2 — Replace (6 files)

| # | Path | Why |
|---|------|-----|
| 1 | `CareOS/functions/api/admin/doctor.js` | Saves the hero statistics (`stats`), gracefully handles a DB without the column |
| 2 | `CareOS/functions/api/doctor.js` | Public profile now includes `stats` (defaults to 10K+/15+/4.9 when nothing is saved) |
| 3 | `CareOS/functions/api/_lib/profile.js` | Shared stats parsing / validation (max 4 rows) |
| 4 | `CareOS/src/admin/Profile.jsx` | New **Hero Statistics** card (number + label rows, add/remove, live preview, reset to default) |
| 5 | `CareOS/src/pages/Home.jsx` | Hero stats come from the profile · **compact CTA** ("Ready to Get Expert Treatment?") · **tinted Chambers section** so white cards stand out |
| 6 | `CareOS/src/pages/Appointment.jsx` | Much smaller page header, especially on mobile (≈20% of the screen instead of ≈50%) |

### ➕ Step 3 — Add (2 files)

| # | Path | Why |
|---|------|-----|
| 7 | `CareOS/migrations/003_profile_stats.sql` | The SQL for Step 1 (kept in the repo for reference / fresh installs) |
| 8 | `CareOS/CHANGED_FILES.md` | This file |

Optional (not required for the live site): `CareOS/migrations/001_initial.sql` (fresh installs now include the `stats` column) and `CareOS/scripts/reset.sql` (drops `home_sections` on a full wipe).

### After deploy

**Admin → Profile → Hero Statistics** → edit the numbers/labels (e.g. *10K+ Patients*, *15+ Years*, *4.9 Rating*), add a 4th one if you like, or remove all rows to hide the box → **Save Profile**. The Home page updates immediately.

---

## 🟠 Round 6 (custom Home sections from the admin panel) — already on GitHub ✅

Compared against your current GitHub `main` on 2026-09-07 (everything from round 5 is already pushed ✅): **13 files** (5 replace + 8 add) **+ one SQL statement in the D1 console**.

### 🗄️ Step 1 — database (one time, ~10 seconds)

Cloudflare dashboard → **Workers & Pages → D1 → `doctor-db` → Console** → paste the contents of
`CareOS/migrations/002_home_sections.sql` → **Execute**. It only *creates* a new table `home_sections`; nothing else is touched and no data is lost.

> Until you run it, the site keeps working (the Home page simply shows no custom sections) and the admin page shows a message telling you to run it.

### ✏️ Step 2 — Replace (5 files)

| # | Path | Why |
|---|------|-----|
| 1 | `CareOS/src/pages/Home.jsx` | Renders the custom sections right after "About Me" |
| 2 | `CareOS/src/api/api.js` | `fetchSections` + admin section calls |
| 3 | `CareOS/src/App.jsx` | Adds the `/admin/sections` route |
| 4 | `CareOS/src/admin/AdminLayout.jsx` | Sidebar item **Home Sections** |
| 5 | `CareOS/migrations/001_initial.sql` | Includes the new table for future fresh installs (does **not** affect your live DB) |

### ➕ Step 3 — Add (8 files)

| # | Path | Why |
|---|------|-----|
| 6 | `CareOS/functions/api/sections.js` | Public `GET /api/sections` (active sections only, no caching) |
| 7 | `CareOS/functions/api/admin/sections/index.js` | Admin list + create |
| 8 | `CareOS/functions/api/admin/sections/[id].js` | Admin edit (partial), delete (also deletes its R2 images) |
| 9 | `CareOS/functions/api/_lib/sections.js` | Shared validation (title required, max 3 images, safe button links) |
| 10 | `CareOS/src/components/FeaturedSection.jsx` | The public design (image collage, benefits, button; alternates left/right) |
| 11 | `CareOS/src/admin/HomeSections.jsx` | The admin page **Admin → Home Sections** |
| 12 | `CareOS/migrations/002_home_sections.sql` | The SQL for Step 1 |
| 13 | `CareOS/CHANGED_FILES.md` | This file |

Optional: `CareOS/scripts/reset.sql` (adds the new table to the wipe script — only matters if you ever do a full reset).

### How to use it

**Admin → Home Sections → Add Section**: Title (e.g. *Hair PRP*), small label, description (empty line = new paragraph), benefits (one per line), up to **3 images** (first one is the big one — reorder with ‹ ›), optional button text + link (`/appointment`, `/services/hair-prp` or a full https:// URL), and a "Show on Home page" switch. Sections can be reordered with ↑ ↓, hidden/shown, edited and deleted at any time. Changes are live immediately.

---

## 🟠 Round 5 (qualifications / privacy editor / premium cards / marquee) — already on GitHub ✅

Compared against your current GitHub `main` on 2026-09-07: **15 files** (10 replace + 5 add). **No database changes.**

> ⚠️ **Why qualifications are still missing:** none of the round-4 files were ever uploaded — GitHub `main` still has the **old** `functions/api/doctor.js` (and no `functions/api/_lib/profile.js`). Rows 1–6 below are those same round-4 files. Until row 1 + row 11 are on GitHub, the public API keeps returning `[]` for qualifications no matter what the frontend does.

### ✏️ Replace (10 files)

| # | Path | Why |
|---|------|-----|
| 1 | `CareOS/functions/api/doctor.js` | **Qualifications fix (backend).** Reads every storage format, sends `Cache-Control: no-store` |
| 2 | `CareOS/functions/api/admin/doctor.js` | Same tolerant parsing for the admin Profile page |
| 3 | `CareOS/src/utils/helpers.js` | `asList` / `asLines` helpers |
| 4 | `CareOS/src/pages/Home.jsx` | Qualification highlights fixed **+ new scrolling strip between Hero and About Me + premium "Conditions We Treat" cards** |
| 5 | `CareOS/src/pages/About.jsx` | Qualifications / specializations parse defensively |
| 6 | `CareOS/src/pages/Privacy.jsx` | Now renders the policy text saved in the admin panel (falls back to the default text) |
| 7 | `CareOS/src/App.jsx` | Adds the `/admin/privacy` route |
| 8 | `CareOS/src/admin/AdminLayout.jsx` | Adds the **Privacy Policy** item to the admin sidebar |
| 9 | `CareOS/src/components/ServiceCard.jsx` | **Premium service cards** (image header with zoom, number + price badges, dashed footer, hover lift) |
| 10 | `CareOS/src/pages/Services.jsx` | Passes the card index (for numbering / colour accents) |

### ➕ Add (5 files)

| # | Path | Why |
|---|------|-----|
| 11 | `CareOS/functions/api/_lib/profile.js` | Shared profile parsing used by rows 1 + 2 (**required**, otherwise the doctor API crashes with "module not found") |
| 12 | `CareOS/src/utils/privacy.js` | Default privacy text + tiny safe markdown renderer (`##` headings, `-` bullets, `**bold**`, links) |
| 13 | `CareOS/src/admin/PrivacyEditor.jsx` | The new admin page **Admin → Privacy Policy** (editor + live preview + "Default text" + Save) |
| 14 | `CareOS/src/components/Marquee.jsx` | Single-row scroll-velocity strip (pauses on hover, respects reduced-motion, no photo) |
| 15 | `CareOS/CHANGED_FILES.md` | This file |

### After the Cloudflare deploy finishes

1. **Admin → Profile → Save** once (re-stores qualifications in the clean format).
2. **Admin → Privacy Policy** → click **Default text** (or write your own) → **Save**. Until you save once, `/privacy` shows the built-in default text.
3. Hard-refresh the public site (Ctrl+F5).

The privacy policy is stored in the existing `settings` table (keys `privacy_policy`, `privacy_updated`) — no SQL to run.

---

## 🟠 Round 3 (profile / footer / contact / socials) — already on GitHub ✅


Compared against your current GitHub `main`: **14 files** to update.

### ✏️ Replace (12 files)

| # | Path | Fixes |
|---|------|-------|
| 1 | `CareOS/functions/api/admin/doctor.js` | **#1** Qualifications not saved — the save crashed with `D1_TYPE_ERROR` (undefined `clinic_name/phone/…`) and stored the textarea as a raw string. Now "one per line" → JSON array, partial saves merge with existing row |
| 2 | `CareOS/functions/api/doctor.js` | **#1** Public API tolerant of both JSON-array and newline-stored values |
| 3 | `CareOS/src/admin/Profile.jsx` | **#1** Refreshes form from the saved response; shared image helper; clears public cache |
| 4 | `CareOS/src/pages/Home.jsx` | **#2** About-Me section photo removed (hero photo kept, section centred) |
| 5 | `CareOS/src/pages/About.jsx` | **#2** Uses shared `imageUrl()` (works with R2 keys *and* full http URLs) |
| 6 | `CareOS/src/components/Footer.jsx` | **#3** "Developed by Dexter Studio" · **#5** contact info from Admin → Settings · **#6** social icons |
| 7 | `CareOS/src/components/AppointmentForm.jsx` | **#4** Calendar cells show "Open" instead of "10 left" (count still in the summary under the calendar) |
| 8 | `CareOS/src/pages/Contact.jsx` | **#5 #6** Settings-driven phone/email/address, "Follow Us" social buttons, real Google-Maps link, chambers list, working Call/Email buttons |
| 9 | `CareOS/src/pages/Appointment.jsx` | **#5** "Need help?" box uses the Settings phone (was the old +1 555 number) |
| 10 | `CareOS/src/admin/Settings.jsx` | Adds Clinic Name field + YouTube & WhatsApp socials; clears public cache on save |
| 11 | `CareOS/src/utils/helpers.js` | New helpers: `imageUrl`, `SOCIAL_PLATFORMS`, `socialHref`, `telHref` |
| 12 | `CareOS/src/styles/global.css` | `.form-help` style |

### ➕ Add (2 files)

| # | Path | Why |
|---|------|-----|
| 13 | `CareOS/src/hooks/useSiteInfo.js` | Shared hook: merges doctor profile + admin settings + chambers for Navbar/Footer/Contact/Appointment (Settings values win, profile is fallback) |
| 14 | `CareOS/CHANGED_FILES.md` | This file |

No database changes in this round — nothing to run in D1.

---

## 🟠 Round 2 (D1 migration error fix) — already on GitHub ✅


Compared against your current GitHub `main`: **7 files** need attention.

### ✏️ Replace (5 files)

| # | Path | Why |
|---|------|-----|
| 1 | `CareOS/migrations/001_initial.sql` | **Fixes the D1 console error.** Rewritten with block comments only — the `--` line comments broke when the console joined lines ("incomplete input", "no such table") |
| 2 | `CareOS/scripts/reset.sql` | Same comment-style fix, so it can be pasted into the D1 console |
| 3 | `CareOS/scripts/seed.mjs` | Testimonials now insert only-if-missing (safe to re-run); source for `seed.sql` |
| 4 | `CareOS/README.md` | Fresh-start instructions for the dashboard console (Option A) and CLI (Option B) |
| 5 | `CareOS/CHANGED_FILES.md` | This file |

### ➕ Add (1 file)

| # | Path | Why |
|---|------|-----|
| 6 | `CareOS/scripts/seed.sql` | Sample data as plain SQL — paste into the D1 console (you don't run npm locally) |

### ⚠️ Still outdated on GitHub from the previous round (3 files)

These are on GitHub but still contain the old `LEFT JOIN services s ON s.id = a.service_id`.
`service_id` no longer exists in the new schema, so **these API calls will fail** until replaced:

| # | Path |
|---|------|
| 7 | `CareOS/functions/api/admin/appointments/index.js` |
| 8 | `CareOS/functions/api/admin/schedule/day.js` |
| 9 | `CareOS/functions/api/appointments/[id].js` |

---

## 🗄️ Fresh database via the Cloudflare dashboard

Cloudflare → Workers & Pages → **D1** → `doctor-db` → **Console** tab.
Paste each file's full contents and click **Execute**, in this order:

| Step | File | Result |
|------|------|--------|
| 1 | `CareOS/scripts/reset.sql` | All tables + data deleted (⚠️ irreversible) |
| 2 | `CareOS/migrations/001_initial.sql` | 10 tables created |
| 3 | `CareOS/scripts/seed.sql` | Admin + doctor + 6 services + 2 chambers + testimonials + settings |

Then type `/tables` in the console — you should see:
`admins, appointments, chambers, doctor_profile, gallery, patients, schedule_overrides, services, settings, testimonials`

Login: `admin@clinic.com` / `admin123` → **change the password** in Admin → Settings/Profile.
Then set each chamber's days / hours / daily limit in **Admin → Chambers**.

---

## 📦 FULL LIST (everything changed since the original repo)

### 🆕 New files (23)

| # | Path | What it is |
|---|------|------------|
| 1 | `CareOS/functions/api/_lib/schedule.js` | Central schedule-resolution engine (chamber default → date override → appointment count) |
| 2 | `CareOS/functions/api/chambers.js` | Public `GET /api/chambers` |
| 3 | `CareOS/functions/api/admin/chambers/index.js` | Admin `GET/POST /api/admin/chambers` |
| 4 | `CareOS/functions/api/admin/chambers/[id].js` | Admin `GET/PUT/DELETE /api/admin/chambers/:id` |
| 5 | `CareOS/functions/api/admin/schedule/index.js` | Admin `GET /api/admin/schedule` (30-day calendar feed) |
| 6 | `CareOS/functions/api/admin/schedule/day.js` | Admin `GET/PUT/DELETE /api/admin/schedule/day` (day detail, save/reset override) |
| 7 | `CareOS/scripts/reset.sql` | Drops ALL tables (+ `d1_migrations`) for a fresh start |
| 8 | `CareOS/scripts/seed.sql` | Sample data as plain SQL for the D1 console |
| 9 | `CareOS/CHANGED_FILES.md` | This checklist |
| 10 | `CareOS/package-lock.json` | npm lockfile (generated) |
| 11 | `CareOS/src/hooks/useSiteInfo.js` | Shared public site-info hook (doctor + settings + chambers) |
| 12 | `CareOS/functions/api/_lib/profile.js` | Shared doctor-profile list parsing |
| 13 | `CareOS/src/utils/privacy.js` | Default privacy policy text + safe mini-markdown renderer |
| 14 | `CareOS/src/admin/PrivacyEditor.jsx` | Admin → Privacy Policy editor page |
| 15 | `CareOS/src/components/Marquee.jsx` | Home-page scrolling strip component |
| 16 | `CareOS/functions/api/sections.js` | Public featured-sections endpoint |
| 17 | `CareOS/functions/api/admin/sections/index.js` | Admin sections list/create |
| 18 | `CareOS/functions/api/admin/sections/[id].js` | Admin sections edit/delete |
| 19 | `CareOS/functions/api/_lib/sections.js` | Sections validation helpers |
| 20 | `CareOS/src/components/FeaturedSection.jsx` | Public featured-section design |
| 21 | `CareOS/src/admin/HomeSections.jsx` | Admin → Home Sections page |
| 22 | `CareOS/migrations/002_home_sections.sql` | Adds `home_sections` table to an existing DB |
| 23 | `CareOS/migrations/003_profile_stats.sql` | Adds `doctor_profile.stats` column to an existing DB |

### ✏️ Modified files (36)

**Backend (Cloudflare Pages Functions)**

| # | Path | Change |
|---|------|--------|
| 1 | `CareOS/functions/api/availability.js` | Chamber-based availability via the engine |
| 2 | `CareOS/functions/api/appointments/index.js` | `POST` booking: serial number + server-side capacity limit |
| 3 | `CareOS/functions/api/appointments/[id].js` | Lookup by reference (chamber + serial); `service_id` join removed |
| 4 | `CareOS/functions/api/admin/appointments/index.js` | List with filters; `service_id` join removed |
| 5 | `CareOS/functions/api/admin/appointments/[id].js` | Update status/note, reschedule (capacity-checked), delete |
| 6 | `CareOS/functions/api/admin/schedule/day.js` | Day detail; `service_id` join removed |
| 7 | `CareOS/functions/api/admin/stats.js` | Dashboard stats incl. per-chamber today |
| 7a | `CareOS/functions/api/admin/doctor.js` | Qualifications one-per-line → JSON array; safe partial saves |
| 7b | `CareOS/functions/api/doctor.js` | Tolerant parsing of qualifications/specializations |

**Frontend (React)**

| # | Path | Change |
|---|------|--------|
| 8 | `CareOS/src/api/api.js` | New API client functions |
| 9 | `CareOS/src/utils/helpers.js` | Date/time/day helpers, `TIME_OPTIONS`, status labels |
| 10 | `CareOS/src/admin/Chambers.jsx` | Chamber cards + modal: 7 day toggles, start/end selects, daily limit |
| 11 | `CareOS/src/admin/Schedule.jsx` | Chamber dropdown, dynamic 30-day calendar, day management modal |
| 12 | `CareOS/src/admin/Appointments.jsx` | Serial column, URL-synced filters, detail modal |
| 13 | `CareOS/src/admin/Dashboard.jsx` | New stat cards + "Today by Chamber" |
| 14 | `CareOS/src/components/AppointmentForm.jsx` | 3-step booking (chamber → date → details); no service selection |
| 15 | `CareOS/src/pages/Appointment.jsx` | Chamber sidebar; redirect to success page |
| 16 | `CareOS/src/pages/AppointmentSuccess.jsx` | Serial number, reference, chamber, date, hours |
| 17 | `CareOS/src/pages/Home.jsx` | Chambers from `/api/chambers`, qualification highlights, scrolling strip, premium condition cards, admin-managed featured sections |
| 18 | `CareOS/src/pages/Contact.jsx` | Settings-driven contact info, socials, maps link, chambers |
| 18a | `CareOS/src/pages/About.jsx` | Shared image helper |
| 18b | `CareOS/src/components/Footer.jsx` | Settings contact info, social icons, "Developed by Dexter Studio" |
| 18c | `CareOS/src/admin/Profile.jsx` | Reload form from save response, Hero Statistics editor |
| 18d | `CareOS/src/admin/Settings.jsx` | Clinic name + YouTube/WhatsApp socials |
| 18e | `CareOS/src/styles/global.css` | `.form-help` |
| 18f | `CareOS/src/pages/Privacy.jsx` | Renders the admin-editable policy |
| 18g | `CareOS/src/App.jsx` | `/admin/privacy` route |
| 18h | `CareOS/src/admin/AdminLayout.jsx` | Sidebar item "Privacy Policy" |
| 18i | `CareOS/src/components/ServiceCard.jsx` | Premium service card design |
| 18j | `CareOS/src/pages/Services.jsx` | Passes card index |
| 18k | `CareOS/src/api/api.js` | Sections API calls |
| 18l | `CareOS/src/pages/Appointment.jsx` | Compact page header (mobile) |

**Config / scripts / docs / database**

| # | Path | Change |
|---|------|--------|
| 19 | `CareOS/migrations/001_initial.sql` | **REPLACED** — single combined migration, complete new schema, D1-console safe |
| 20 | `CareOS/scripts/seed.mjs` | Seeds 2 chambers; `--remote` support; re-run safe |
| 21 | `CareOS/wrangler.toml` | Added `TIMEZONE = "Asia/Dhaka"` |
| 22 | `CareOS/package.json` | Scripts: `db:reset[:local]`, `db:fresh[:local]`, `seed:remote`; `db:migrate` → `--remote` |
| 23 | `CareOS/README.md` | Schedule system, API, fresh-start instructions |

### 🗑️ Deleted files (2)

| # | Path | Why |
|---|------|-----|
| 1 | `CareOS/functions/api/admin/availability.js` | Replaced by `/api/admin/chambers` + `/api/admin/schedule` |
| 2 | `CareOS/migrations/002_chambers_schedule.sql` | Merged into `001_initial.sql` (never add this file) |
