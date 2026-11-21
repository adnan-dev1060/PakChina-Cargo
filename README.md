# Pak China Cargo — Website

| Folder | Stack | Run |
|---|---|---|
| `frontend/` | Vite · React 19 · TypeScript · Tailwind CSS v4 · lucide-react · Motion · TanStack Query · React Hook Form + Zod | `npm --prefix frontend start` → http://localhost:5173 |
| `backend/` | Node · Express 5 · TypeScript · Zod · Helmet | `npm --prefix backend run dev` → http://localhost:4000/api/v1/health |

First run: `npm --prefix frontend install` and `npm --prefix backend install`, then copy each `.env.example` to `.env`.

## How content works
All public content is read through `frontend/src/lib/api.ts`.
- `VITE_API_URL` **empty** → the site renders `frontend/src/content/seed.ts` (starting content from the company's posts).
- `VITE_API_URL` **set** → the same functions call the REST API, whose data is managed in the admin dashboard.

Lines marked `CLIENT REVIEW` in `seed.ts` are wording the client should confirm (phone numbers, mission, vision, history).

## Backend setup (MongoDB + Cloudinary)
1. Copy `backend/.env.example` to `backend/.env` and fill in `MONGODB_URI`, `JWT_ACCESS_SECRET`, the Cloudinary keys and `SEED_ADMIN_*`.
2. `npm --prefix backend run seed` loads the starting content and creates the first super admin. It's safe to re-run: it only fills empty collections. `-- --reset` replaces the website content.
3. `npm --prefix backend run dev`, then set `VITE_API_URL=http://localhost:4000` in `frontend/.env`.
4. `npm --prefix backend run test:api` runs 49 end-to-end API tests against an in-memory MongoDB (no credentials needed).

### API overview (`/api/v1`)
- **Public:** `GET /settings`, `/home`, `/about`, `/offices`, `/shipping-modes`, `/services`, `/services/:slug`, `/routes`, `/commodities`, `/process-steps`, `/highlights`, `/testimonials`, `/faqs`, `/updates`. `POST /inquiries` is rate-limited and has a honeypot field.
- **Auth:** `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/change-password`, `GET /auth/me`. Sessions use httpOnly cookies, rotating refresh tokens and lockout after 5 failed attempts.
- **Admin** (signed in): `GET /admin/stats`.
  - `GET|PUT /admin/content/{settings|home|about}`.
  - For each collection: `GET|POST /admin/content/<collection>`, `GET|PUT|DELETE /admin/content/<collection>/:id`, `PATCH /admin/content/<collection>/:id/publish`, `PUT /admin/content/<collection>/reorder`.
  - `GET|POST /admin/media` (Cloudinary upload, checked by file content), `PATCH|DELETE /admin/media/:id` (blocked while the image is in use).
  - `GET /admin/inquiries` (filter and search), `GET|PATCH|DELETE /admin/inquiries/:id`.
  - `/admin/users` (super admin only).

## Deployment
In production the backend serves the website too: one server, one domain. It adds per-page SEO tags, `sitemap.xml` and `robots.txt`. See [DEPLOYMENT.md](DEPLOYMENT.md) for the free Render demo (`render.yaml`) and the later VPS setup.

## Status
- Phase 2 (design system + public site): done — Home, About, Services, Service detail, Routes, Contact, 404.
- Phase 3 (MongoDB, auth, content APIs, Cloudinary uploads, inquiries): done — connected to Atlas and seeded.
- Phase 4 (admin dashboard at /admin): done — content, homepage, About, settings, inquiries, media, admin users, account. Try it safely with `npm --prefix backend run dev:memory` (test admin: admin@example.test / TestPassw0rd!).
- Phase 5 (integration and testing): done — 49 API tests (`npm --prefix backend run test:api`) cover every content type, inquiries, media, users and accounts; uploads, the quote form and admin-to-website updates checked in the browser.
- Phase 6 (SEO, mobile polish, deployment prep): done — server-rendered page titles and link previews, sitemap, structured business data, app icons, larger mobile tap targets, Render blueprint and VPS guide.
