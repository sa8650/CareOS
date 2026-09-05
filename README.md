# Doctor Portfolio & Appointment Website

A modern, responsive doctor portfolio and appointment booking website built with React + Vite, deployed on Cloudflare Pages with D1 database and R2 storage.

## Tech Stack

- **Frontend:** React 18 + Vite + React Router
- **Backend:** Cloudflare Pages Functions
- **Database:** Cloudflare D1 (SQLite)
- **Storage:** Cloudflare R2 (images)
- **Hosting:** Cloudflare Pages

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
npm install
```

### 2. Create D1 Database

```bash
npx wrangler d1 create doctor-db
```

Copy the `database_id` output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "doctor-db"
database_id = "YOUR_DATABASE_ID"
```

### 3. Run Migrations

```bash
# Local development
npm run db:migrate:local

# Production
npm run db:migrate
```

### 4. Seed Sample Data

```bash
npm run seed
```

This creates:
- Admin account (admin@clinic.com / admin123)
- Sample doctor profile
- 6 sample services
- Availability schedule (Mon-Fri 9-5, Sat 9-1)
- Sample testimonials
- Basic settings

### 5. Start Development Server

```bash
npm run pages:dev
```

This runs Vite with Cloudflare Pages Functions, D1, and R2 bindings.

Visit `http://localhost:8788` for the full app with API.

For frontend-only development:

```bash
npm run dev
```

## R2 Storage Setup

### Create R2 Bucket

```bash
npx wrangler r2 bucket create doctor-media
```

### Enable Public Access (for image serving)

In Cloudflare Dashboard:
1. Go to R2 → doctor-media → Settings
2. Enable Public Access
3. Note the public URL

### Update Upload Function

Edit `functions/api/admin/upload.js` and update the URL generation to use your R2 public URL:

```js
const url = `https://your-r2-public-url/${key}`;
```

## Deployment to Cloudflare Pages

### Option 1: GitHub Integration (Recommended)

1. Push code to GitHub
2. Go to Cloudflare Dashboard → Pages → Create a project
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Add environment variables:
   - `D1_DATABASE_ID`: Your D1 database ID
6. After first deploy, go to Settings → Functions:
   - Add D1 binding: `DB` → `doctor-db`
   - Add R2 binding: `R2` → `doctor-media`
7. Run production migrations:

```bash
npm run db:migrate
```

### Option 2: Direct Upload

```bash
npm run build
npx wrangler pages deploy dist
```

## Project Structure

```
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
│   ├── auth/               # Authentication endpoints
│   ├── admin/              # Admin endpoints
│   └── *.js                # Public endpoints
├── migrations/             # D1 database migrations
├── scripts/                # Utility scripts
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
| GET | `/api/availability` | Availability schedule |
| POST | `/api/appointments` | Book appointment |

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
| GET | `/api/admin/appointments` | List appointments |
| PUT | `/api/admin/appointments/:id` | Update appointment |
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
| GET | `/api/admin/availability` | Get availability |
| PUT | `/api/admin/availability` | Update availability |
| POST | `/api/admin/upload` | Upload image to R2 |

## Default Admin Login

- **Email:** admin@clinic.com
- **Password:** admin123

⚠️ Change the password after first login in production!

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ADMIN_EMAIL` | Default admin email (for seeding) |
| `ADMIN_PASSWORD` | Default admin password (for seeding) |

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
- `/admin/services` - Manage services
- `/admin/profile` - Edit doctor profile
- `/admin/gallery` - Manage gallery
- `/admin/testimonials` - Manage testimonials
- `/admin/settings` - Clinic settings

## Customization

### Change Doctor Information

Update the seed data in `scripts/seed.mjs` or edit via the admin dashboard at `/admin/profile`.

### Change Services

Add/edit services via the admin dashboard at `/admin/services`.

### Change Styling

Global styles are in `src/styles/global.css`. CSS variables make it easy to change colors and spacing.

### Add Images

Upload images via the admin dashboard. They're stored in Cloudflare R2.

## Security Notes

- Passwords are hashed using SHA-256
- Admin routes require HTTP-only session cookies
- Login has rate limiting (5 attempts per 15 minutes)
- File uploads are validated for type and size
- All database queries use parameterized statements
- No sensitive data is exposed in public API responses

## License

MIT
