# LOKACIA.KZ — Technical State (April 15, 2026)

## Tech Stack

- **Framework**: Next.js 16.2.2 (App Router, Turbopack) — uses `proxy.ts` instead of deprecated `middleware.ts`
- **Language**: TypeScript 5, React 19
- **Styling**: Tailwind CSS 4 (PostCSS plugin)
- **Database**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **Auth**: Supabase SSR (`@supabase/ssr`) with cookie-based sessions across three clients:
  - `src/lib/supabase.ts` — `createBrowserClient` for client components
  - `src/lib/supabase-proxy.ts` — `createServerClient` for the proxy (route protection)
  - `src/lib/supabase-server.ts` — `createServerClient` for Server Components/Actions
- **Deployment**: Hetzner VPS (46.225.230.12) via GitHub Actions → Docker Compose
  - Workflow: `.github/workflows/deploy.yml` (push to `main` → SSH → `docker compose up -d --build`)
  - Project dir on server: `/opt/lokacia`
  - Docker: multi-stage Node 20 Alpine, `output: "standalone"`
  - Git remote on server uses HTTPS (was changed from SSH due to missing deploy key)
- **Storage**: Supabase bucket `listings` (public read, auth upload, folder = user ID)

## Database Schema (Supabase)

### Core Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `profiles` | User profiles (extends auth.users) | id (uuid, FK auth.users), name, phone, role (host/renter), avatar_url, is_admin, created_at |
| `listings` | Venue/space listings | host_id (FK profiles), title, slug, description, space_type, activity_types[], city, district, address, price_per_hour, price_per_day, min_hours, images[], amenities[], rules[], status (active/inactive), rating, review_count |
| `bookings` | Booking requests | listing_id, renter_id, date, start_time, end_time, guest_count, total_price, status (pending/confirmed/rejected/completed/cancelled), payment_status, commission_rate, referral_code |
| `reviews` | User reviews | listing_id, author_id, rating (1-5), text — trigger auto-updates listing.rating |
| `conversations` | Chat threads (1 per guest+listing pair) | listing_id, guest_id, host_id, updated_at — unique(listing_id, guest_id) |
| `messages` | Chat messages | conversation_id, sender_id, content, is_read — trigger auto-updates conversation.updated_at |
| `scout_requests` | Location preview requests | listing_id, guest_id, status, requested_date, message, host_response |
| `payments` | Incoming payments from renters | booking_id, amount, service_fee (7.5%), commission_amount, host_amount, method (kaspi_pay/card/manual), kaspi_txn_id |
| `payouts` | Outgoing payments to hosts | host_id, amount, booking_ids[], method (kaspi_transfer), kaspi_phone |
| `host_applications` | Landing page signups | name, phone, city, space_type, area, status |

### RLS Policies
- `listings`, `profiles`, `reviews`: public SELECT for all (anon + authenticated)
- `bookings`: renter sees own, host sees bookings for their listings
- `conversations`, `messages`: only guest_id and host_id participants can read/write
- Admin override policies on most tables (profiles.is_admin = true)
- Storage `listings` bucket: anyone can read, authenticated can upload, users can delete own folder

### Triggers
- `handle_new_user()` — auto-creates profile row on auth signup from user_metadata
- `update_listing_rating()` — recalculates listing.rating on new review
- `update_conversation_timestamp()` — bumps conversation.updated_at on new message

## App Routes

| Route | Type | Purpose |
|---|---|---|
| `/` | Static (revalidate 60s) | Landing page + listings grid |
| `/catalog` | Static (revalidate 60s) | Full catalog with filters |
| `/listing/[slug]` | Dynamic | Listing detail page — gallery, amenities, booking sidebar, "Message Host" |
| `/host/[id]` | Dynamic | Public host profile — avatar, join date, all listings, "Message Host" |
| `/login`, `/register` | Static | Auth pages (email/password + role selection) |
| `/reset-password` | Static | Password recovery flow |
| `/dashboard` | Protected | Host dashboard — stats, bookings management, listings |
| `/dashboard/new` | Protected | Create new listing form |
| `/inbox` | Protected | Messaging inbox — conversation list + chat bubbles |
| `/bookings` | Protected | Renter's booking history |
| `/admin` | Protected | Admin panel — revenue, payouts, all bookings |
| `/api/revalidate` | API (POST) | Busts Next.js cache for /, /catalog, /dashboard |

## Business Logic Implemented

### Giggster-style Messaging (not simple scout forms)
- Guests click "Написать хосту" on listing pages → modal with quick-action chips + textarea
- Creates a `conversation` (unique per guest+listing) and first `message`, then redirects to `/inbox`
- Inbox: left sidebar with conversations, right pane with iMessage-style chat bubbles
- Polling every 5s for new messages, read receipts, date separators
- Unread count badge in navbar (both icon and dropdown)
- Exact address hidden from public — shown only as city+district with amber hint box

### Host Public Profiles
- `/host/[id]` shows profile card + grid of all active listings
- Linked from listing detail page (host card is clickable with hover effects)
- "Message Host" button on profile page (creates conversation via first listing)

### Booking Flow
- Booking form in sticky sidebar: date, time, hours, guests, activity type, description
- Price breakdown: hourly rate × hours + 7.5% service fee
- Instant booking vs. request-based (per listing setting)
- Referral system: `?ref=CODE` → 3% commission instead of 15%

### Payments & Payouts
- Payment records created on booking confirmation
- Kaspi Pay integration structure (kaspi_txn_id field)
- Admin panel: view all payments, create/complete payouts to hosts
- Commission tracking: 15% default, 3% for referrals

## Bugs Fixed (Critical)

### 1. Chrome Cookie Auth Failure
- **Symptom**: Login worked once in Chrome, then sessions dropped. Safari was fine.
- **Root cause**: `@supabase/ssr` defaults `Secure: true` on cookies. Chrome strictly enforces this — drops Secure cookies on HTTP localhost.
- **Fix**: All three Supabase clients now set `secure: process.env.NODE_ENV === "production"` and `sameSite: "lax"` explicitly in cookieOptions and in `setAll()`.

### 2. Homepage Logged User Out
- **Symptom**: Navigating to `/` as logged-in user showed "Войти" (logged out state).
- **Root cause**: Two issues:
  1. Client used `createClient` (localStorage sessions) while proxy used `createServerClient` (cookie sessions) → token refresh mismatch
  2. Homepage had its own hardcoded `<nav>` that never checked auth state
- **Fix**: Switched client to `createBrowserClient` from `@supabase/ssr` (cookies). Replaced hardcoded nav with shared `<Navbar />` component. Proxy now copies refreshed cookies onto redirect responses.

### 3. Listings Invisible to Logged-Out Users
- **Symptom**: Incognito users saw no listings.
- **Root cause**: Missing `GRANT SELECT ... TO anon` on listings/profiles tables.
- **Fix**: SQL grants + recreated RLS SELECT policies with `using (true)`.

### 4. Changes Not Visible on Production
- **Symptom**: All code changes worked locally but lokacia.kz showed old version.
- **Root cause**: GitHub Actions deploy failed silently (SSH key issue on server). Server git remote was SSH but had no deploy key.
- **Fix**: Changed server remote to HTTPS, ran `git fetch && git reset --hard origin/main && docker compose up -d --build` manually via SSH.

### 5. Next.js Image Domain Errors
- **Fix**: Added `picsum.photos` and `i.pravatar.cc` to `next.config.ts` remotePatterns.

## Phase 3 — What's Left

### High Priority
- **Calendar/Availability System**: Visual calendar on listing pages showing available/blocked dates. Hosts need a calendar management UI to block dates. Bookings should auto-block the booked time slots.
- **Kaspi Pay Integration**: Actual payment processing (currently just DB records). QR code generation for Kaspi Pay, webhook for payment confirmation, escrow logic.
- **Real-time Messaging**: Replace 5s polling with Supabase Realtime subscriptions for instant message delivery.
- **Email Notifications**: Send emails on new bookings, messages, booking confirmations/rejections (Supabase Edge Functions or external service).

### Medium Priority
- **Search & Filters**: Full-text search, filter by city/space_type/price range/amenities/capacity on catalog page.
- **Map Integration**: 2GIS or Google Maps on catalog and listing pages.
- **SEO**: Sitemap generation, structured data (JSON-LD), meta tags per listing.
- **Image Optimization**: Compress uploads, generate thumbnails, lazy loading gallery.
- **Reviews System UI**: Allow renters to leave reviews after completed bookings.

### Lower Priority
- **Multi-language**: Kazakh language support (kk-KZ).
- **Mobile App**: React Native or PWA.
- **Analytics Dashboard**: Host analytics (views, conversion rates, revenue charts).
- **Referral Dashboard**: UI for hosts to see/share their referral links and track conversions.
- **Contract Generation**: Auto-generate rental agreements in Russian and Kazakh.

## Key File Map

```
proxy.ts                          — Route protection (replaces middleware.ts)
src/lib/supabase.ts               — Browser client (createBrowserClient)
src/lib/supabase-proxy.ts         — Proxy client (cookie-aware)
src/lib/supabase-server.ts        — Server Component client
src/lib/api.ts                    — All Supabase queries (listings, bookings, messages, payments)
src/lib/auth-context.tsx          — React auth provider + useAuth hook
src/lib/types.ts                  — TypeScript interfaces + label maps
src/components/navbar.tsx          — Shared navbar with auth state + inbox badge
src/components/listing-card.tsx    — Reusable listing card component
src/app/listing/[slug]/page.tsx   — Listing detail (Server Component)
src/app/listing/[slug]/booking-sidebar.tsx — Booking form + Message Host modal (Client)
src/app/host/[id]/page.tsx        — Public host profile (Server Component)
src/app/inbox/page.tsx            — Messaging inbox (Client)
src/app/dashboard/page.tsx        — Host dashboard (Client)
src/app/admin/page.tsx            — Admin panel (Client)
.github/workflows/deploy.yml      — CI/CD pipeline
Dockerfile                        — Multi-stage production build
docker-compose.yml                — Single service, port 3000
```

## Deployment Checklist
1. Push to `main` → GitHub Actions auto-deploys
2. If GH Actions fails: `ssh -i ~/.ssh/id_ed25519 root@46.225.230.12`
3. On server: `cd /opt/lokacia && git fetch origin main && git reset --hard origin/main && docker compose up -d --build`
4. Supabase SQL changes must be run manually in Supabase Dashboard → SQL Editor
