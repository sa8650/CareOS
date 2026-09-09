# Doctor Portfolio & Appointment Website

One repo, many websites. This template powers any number of doctor portfolio +
appointment sites (SaaS style): every doctor deploys the **same code** as their
own Cloudflare Pages project and connects their **own database + file storage**
in the dashboard. The repo contains **no bindings, no IDs, no secrets** — safe
for public repos.

## Tech Stack

- **Frontend:** React 18 + Vite + React Router
- **Backend:** Cloudflare Pages Functions
- **Database:** Cloudflare D1 (SQLite — one database per website)
- **Storage:** Cloudflare R2 (images — one bucket per website)
- **Hosting:** Cloudflare Pages (one project per website)

## How It Works (SaaS)

```text
Same GitHub repo ─┬─► Pages project "Doctor A" ─► D1 + R2 of Doctor A
                  ├─► Pages project "Doctor B" ─► D1 + R2 of Doctor B
                  └─► Pages project "Doctor C" ─► …
```

- Push code once → every connected website rebuilds automatically.
- Each website's content (doctor profile, chambers, appointments, …) lives in
  its own D1 database and is edited through that site's own `/admin` panel.
- No per-doctor code changes needed. Ever.

## Setup — Repeat for Each Doctor Website (dashboard only, ~10 min, no terminal)

### 1. Create the D1 database

Cloudflare Dashboard → **Workers & Pages → D1 SQL → Create database**.
Name it anything, e.g. `doctor-a-db` → Create.

### 2. Create the tables

Open your new database → **Console** tab. Open the file
`migrations/001_initial.sql` in this repo, copy **all** of it, paste into the
console → **Execute**. (One paste creates all 12 tables.)

### 3. Add starter data (recommended)

In the same D1 Console, copy-paste `scripts/seed.sql` → **Execute**.
This creates the admin login plus a sample doctor profile, services and
chambers that you will replace with the real doctor's data.

### 4. Create the R2 bucket

Dashboard → **R2 → Create bucket**, e.g. `doctor-a-media`. Leave it
**private** — images upload through `/api/admin/upload` and are served through
`/api/image`, so no public bucket URL is ever needed.

### 5. Connect the website

Dashboard → **Workers & Pages → Create → Pages → Connect to Git**:

1. Select this repository (the same repo for every doctor) → Begin setup.
2. Build settings: **Build command** `npm run build`,
   **Build output directory** `dist` → Save and Deploy.
3. The first deploy shows empty data — normal, bindings come next.

### 6. Add this website's bindings

Pages → your project → **Settings → Bindings** — set for
**both Production and Preview**:

- **D1 database** → variable name `DB` → your database from step 1
- **R2 bucket** → variable name `R2` → your bucket from step 4
- (Optional) **Environment variables** → `TIMEZONE` = e.g. `Asia/Dhaka`
  (the code defaults to `Asia/Dhaka` if unset)

Then **Deployments → (⋯) → Retry deployment** — bindings only apply on a
fresh deploy.

### 7. Log in and make it theirs

1. Open `https://<your-site>.pages.dev/admin`
   (add a custom domain later under Pages → Custom domains).
2. Log in: `admin@clinic.com` / `admin123`, then **change the password
   immediately**: D1 → your database → Console → run

   ```sql
   UPDATE admins SET password_hash = '<sha256-of-new-password>'
   WHERE email = 'admin@clinic.com';
   ```

   To get the `<sha256-of-new-password>` value, open any page in Chrome,
   press F12 → Console, paste this (with your new password) → Enter:

   ```js
   await crypto.subtle.digest('SHA-256', new TextEncoder().encode('NEW-PASSWORD'))
     .then(b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join(''))
   ```

3. **Admin → Profile**: doctor name, photo, qualifications, …
4. **Admin → Chambers**: visiting days, hours, daily patient limit.
5. Add services, gallery, testimonials and settings as needed.

### Fresh start (wipe one website's data)

D1 → your database → Console, paste + Execute in this order
(⚠️ irreversible):

1. `scripts/reset.sql` — drops every table
2. `migrations/001_initial.sql` — creates the complete schema
3. `scripts/seed.sql` — optional starter data

All three files survive the console's line-joining and are safe to re-run.

### Existing databases: additive migrations

Fresh installs need only `001_initial.sql` (it already contains everything).
If a database was created from an *older* `001`, run each of these once in the
D1 console instead of resetting:

- `migrations/002_home_sections.sql` — featured home-page sections
- `migrations/003_profile_stats.sql` — editable hero statistics
- `migrations/004_seo.sql` — per-page SEO overrides

## Appointment & Schedule System

Scheduling is **chamber-specific and fully dynamic**. Nothing is pre-generated:
every date is resolved on demand by one central engine
(`functions/api/_lib/schedule.js`) that is shared by the admin Schedule page,
the patient booking page, the availability API and the booking API.

```text
Chamber Default Schedule  +  Date-Specific Override  +  Real-time Appointment Count
```

| Layer | Table | What it stores |
|-------|-------|----------------|
| Chambers | `chambers` | name, address, phone, `visiting_days` (JSON `[0..6]`, 0 = Sunday), default `start_time` / `end_time`, `daily_limit` |
| Overrides | `schedule_overrides` | **one row per (chamber, date) only when an admin edits that date**: status (`available` / `off` / `closed`), start/end time, appointment limit, note. `NULL` fields inherit the chamber default |
| Appointments | `appointments` | patient + `chamber_id` + `appointment_date` + `serial_number` + status |

Resolution order for any (chamber, date): chamber default → override (if any) →
Available / Off / Closed → count booked appointments → remaining capacity →
`full` when booked ≥ limit. Booking is enforced server-side inside a single
atomic `INSERT … WHERE count < limit` guarded by a unique
`(chamber_id, date, serial_number)` index, so capacity can never be exceeded
even under concurrent requests.

Statuses: **Available** (bookable), **Off** (not a visiting day), **Closed**
(visiting day disabled by admin for that date), **Full** (computed
automatically).

Set the clinic timezone with the `TIMEZONE` dashboard variable (defaults to
`Asia/Dhaka`); "today" and "visiting hours ended" are evaluated in that zone.

## Project Structure

```text
doctor-website/
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   ├── pages/              # Public pages
│   ├── admin/              # Admin dashboard
│   ├── api/                # API client
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Helpers
│   └── styles/             # Global CSS
├── functions/api/          # Cloudflare Pages Functions (API)
│   ├── _lib/schedule.js    # Central schedule resolution engine
│   ├── auth/               # Authentication endpoints
│   ├── admin/              # Admin endpoints
│   └── *.js                # Public endpoints
├── migrations/             # D1 schema (paste into the D1 console)
├── scripts/                # reset.sql + seed.sql (paste into the D1 console)
└── public/                 # Static assets
```

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctor` | Doctor profile |
| GET | `/api/services` | All active services |
| GET | `/api/services/:slug` | Service details |
| GET | `/api/gallery` | Published gallery images |
| GET | `/api/testimonials` | Published testimonials |
| GET | `/api/chambers` | Active chambers with default schedule |
| GET | `/api/availability?chamber_id=1` | Resolved next-30-days schedule for a chamber |
| GET | `/api/availability?chamber_id=1&date=YYYY-MM-DD` | Resolved single day |
| POST | `/api/appointments` | Book appointment (`chamber_id`, `date`, `name`, `phone`, `email?`, `message?`) → serial number |
| GET | `/api/appointments/:reference` | Appointment lookup |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| POST | `/api/auth/logout` | Admin logout |
| GET | `/api/auth/me` | Current admin user |

### Admin (requires auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/appointments` | List appointments (`status`, `date`, `from`, `to`, `chamber_id`, `search`, `limit`) |
| PUT | `/api/admin/appointments/:id` | Update status / note, or move to another chamber & date (capacity checked, new serial) |
| DELETE | `/api/admin/appointments/:id` | Delete appointment |
| GET | `/api/admin/chambers` | List chambers |
| POST | `/api/admin/chambers` | Create chamber |
| PUT | `/api/admin/chambers/:id` | Update chamber (partial) |
| DELETE | `/api/admin/chambers/:id` | Delete chamber (`?force=1` if it has upcoming appointments) |
| GET | `/api/admin/schedule?chamber_id=1` | Dynamic 30-day calendar for a chamber |
| GET | `/api/admin/schedule/day?chamber_id=1&date=…` | Resolved day + override + appointments |
| PUT | `/api/admin/schedule/day` | Create/update a date-specific override |
| DELETE | `/api/admin/schedule/day?chamber_id=1&date=…` | Remove override (back to chamber default) |
| GET | `/api/admin/sections` | List home-page featured sections |
| POST | `/api/admin/sections` | Create featured section |
| PUT | `/api/admin/sections/:id` | Update featured section |
| DELETE | `/api/admin/sections/:id` | Delete featured section |
| GET | `/api/admin/services` | List all services |
| POST | `/api/admin/services` | Create service |
| PUT | `/api/admin/services/:id` | Update service |
| DELETE | `/api/admin/services/:id` | Delete service |
| GET | `/api/admin/doctor` | Get doctor profile |
| PUT | `/api/admin/doctor` | Update doctor profile |
| GET | `/api/admin/gallery` | List gallery |
| POST | `/api/admin/gallery` | Add gallery image |
| PUT | `/api/admin/gallery/:id` | Update gallery item |
| DELETE | `/api/admin/gallery/:id` | Delete gallery image |
| GET | `/api/admin/testimonials` | List testimonials |
| POST | `/api/admin/testimonials` | Add testimonial |
| PUT | `/api/admin/testimonials/:id` | Update testimonial |
| DELETE | `/api/admin/testimonials/:id` | Delete testimonial |
| GET | `/api/admin/settings` | Get settings |
| PUT | `/api/admin/settings` | Update settings |
| GET | `/api/admin/seo` | List SEO records |
| PUT | `/api/admin/seo` | Upsert SEO record |
| DELETE | `/api/admin/seo` | Delete SEO record |
| POST | `/api/admin/upload` | Upload image to R2 |

## Default Admin Login

- **Email:** admin@clinic.com
- **Password:** admin123

⚠️ Change the password after first login (see step 7 of Setup)!

## Environment Variables & Bindings

Set per Pages project in the dashboard (Settings → Bindings / Environment
variables, for both Production and Preview). Nothing is stored in git.

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `DB` | D1 binding | Yes | This website's database |
| `R2` | R2 binding | Yes | This website's image bucket |
| `TIMEZONE` | Variable | No | Clinic timezone (default `Asia/Dhaka`) |

## Routes

### Public
- `/` - Home page
- `/about` - About the doctor
- `/services` - All services
- `/services/:slug` - Service details
- `/appointment` - Book appointment
- `/appointment/success/:id` - Booking confirmation
- `/contact` - Contact page
- `/privacy` - Privacy policy

### Admin
- `/admin/login` - Admin login
- `/admin` - Dashboard
- `/admin/appointments` - Manage appointments
- `/admin/schedule` - Chamber calendar (next 30 days) & date overrides
- `/admin/chambers` - Chambers with visiting days / hours / daily limit
- `/admin/services` - Manage services
- `/admin/profile` - Edit doctor profile
- `/admin/gallery` - Manage gallery
- `/admin/testimonials` - Manage testimonials
- `/admin/settings` - Clinic settings
- `/admin/sections` - Home-page featured sections
- `/admin/seo` - SEO settings
- `/admin/privacy` - Privacy policy editor

## Customization

### Change Doctor Information

Edit via the admin dashboard at `/admin/profile` (each website has its own data).

### Change Services

Add/edit services via the admin dashboard at `/admin/services`.

### Change Styling

Global styles are in `src/styles/global.css`. CSS variables make it easy to change colors and spacing.

### Add Images

Upload images via the admin dashboard. They're stored in that website's own R2 bucket.

## Security Notes

- Passwords are hashed using SHA-256
- Admin routes require HTTP-only session cookies
- Login has rate limiting (5 attempts per 15 minutes)
- File uploads are validated for type and size
- All database queries use parameterized statements
- No sensitive data is exposed in public API responses
- The repo holds no bindings, IDs or secrets — each deployment adds its own

## License

MIT
