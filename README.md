# ResellSync

ResellSync is a polished demo MVP for an all-in-one reseller platform. It lets a seller create one product listing, simulate cross-posting across multiple marketplaces, track inventory and orders, run a fake checkout, and automatically deactivate duplicate listings when an item sells.

This is a **Next.js + TypeScript + Tailwind CSS** web app. It uses a local mock database in `localStorage` so the full demo works without production API credentials.

## Features Completed

- Email/password demo login
- Google, Facebook, and Apple mock OAuth buttons
- Demo login button
- Marketplace connection page with mock OAuth permission flow
- Marketplace cards for eBay, Facebook Marketplace, Depop, TikTok Shop, Mercari, Poshmark, and Etsy
- Listing creation form
- Listing templates for sneakers, hoodies, vintage tees, electronics, and collectibles
- AI listing helper actions for title, description, pricing, hashtags, and SEO keywords
- Live profit calculator with fees, shipping, cost of goods, and ad spend
- Sync Preview before publishing, with auto-sync/manual-only channels, missing fields, and fee estimates
- Mock image upload
- Auto-generate description
- Auto-generate pricing suggestion
- Save draft flow
- Publish to selected marketplaces
- Duplicate listing flow
- Inventory location tracking with SKU, bin, rack, shelf, quantity, and low-stock threshold
- Marketplace adapter files for every supported channel
- Inventory tracking
- Listings table with marketplace status
- Sync Status / Error Center with failed syncs, manual-required tasks, retry actions, and suggested fixes
- Bulk Import demo CSV flow with sample rows and column mapping
- Activity Log / Audit Trail for listing, sync, sale, auto-delisting, and manual export events
- Mark-as-sold flow
- Automatic deactivation of the same item on other marketplaces
- Sync logs
- Demo buyer checkout
- Fake card / DemoPay payment success
- Orders page with fees and net profit
- Analytics page with revenue, conversion, fees, unsold inventory, top products, and sales by marketplace
- Responsive SaaS-style sidebar UI
- Toast notifications, loading states, empty states, and error-safe demo defaults

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- React
- lucide-react icons
- localStorage mock database
- Supabase-ready schema/docs
- Stripe-test-ready payment structure
- Server-side OAuth routes and encrypted local token vault for approved real integrations
- Marketplace adapter architecture under `src/adapters/`
- Centralized sync engine under `src/lib/syncEngine.ts`
- Service layer under `src/services/`
- Mock production-ready auth/session structure under `src/auth/`

## How To Run Locally

```powershell
npm install
npm run dev
```

Open:

[http://localhost:3000](http://localhost:3000)

Production build:

```powershell
npm run build
npm run start
```

## Demo Account

Use the **Demo login** button, or:

```text
Email: demo@resellsync.app
Password: demo1234
```

The social login buttons are realistic mock OAuth flows for demo purposes.

## Mocked Integrations

All marketplace integrations are sandboxed:

- eBay
- Facebook Marketplace
- Depop
- TikTok Shop
- Mercari
- Poshmark
- Etsy

The app does **not** scrape marketplaces and does **not** bypass marketplace rules. The adapters behave like real API integrations so the UI and business logic work, but production access requires official API credentials and marketplace approvals.

The Connect Accounts page also shows **Production API readiness**. Those links call real server routes under `/api/oauth/...` and report which server credentials or approvals are missing.

Adapter files live in:

```text
src/adapters/
```

Each adapter implements:

- `connect()`
- `disconnect()`
- `validateListing()`
- `publishListing()`
- `delistListing()`
- `syncInventory()`
- `getStatus()`

The older `src/lib/adapters/` mock files are retained only as compatibility references. The active architecture uses `src/adapters/`.

## MVP Architecture

```text
src/adapters/
  ebay/
  etsy/
  depop/
  facebook/
  mercari/
  poshmark/
  tiktok/
src/auth/AuthProvider.tsx
src/lib/syncEngine.ts
src/lib/environment.ts
src/services/
  analyticsService.ts
  authService.ts
  inventoryService.ts
  listingsService.ts
  localDatabase.ts
  syncService.ts
```

The service layer keeps UI pages from owning backend-style work. Today it talks to `localStorage` and mock adapters; later it can be swapped to Supabase, API routes, Edge Functions, or a full backend.

## Where To Add Real Credentials

Copy `.env.example` to `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

Then fill in the relevant values:

```text
APP_URL=http://localhost:3000
RESELLSYNC_TOKEN_ENCRYPTION_KEY=generate_a_long_random_secret

EBAY_ENV=sandbox
EBAY_CLIENT_ID=
EBAY_CLIENT_SECRET=
EBAY_REDIRECT_URI=

ETSY_CLIENT_ID=
ETSY_REDIRECT_URI=

META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=

DEPOP_CLIENT_ID=
DEPOP_CLIENT_SECRET=
DEPOP_AUTH_URL=
DEPOP_TOKEN_URL=
DEPOP_REDIRECT_URI=

TIKTOK_SHOP_CLIENT_KEY=
TIKTOK_SHOP_CLIENT_SECRET=
TIKTOK_SHOP_MERCHANT_ID=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=
```

Sensitive secrets, refresh tokens, Stripe secret keys, and marketplace token exchange logic must live on server routes, Supabase Edge Functions, or another backend. Do not put private keys in `NEXT_PUBLIC_` variables.

## Server-Side OAuth Routes

These routes are implemented:

```text
GET    /api/integrations/status?userId=demo
GET    /api/oauth/[marketplace]/start?userId=demo
GET    /api/oauth/[marketplace]/callback
GET    /api/oauth/[marketplace]/tokens?userId=demo
DELETE /api/oauth/[marketplace]/tokens?userId=demo
POST   /api/oauth/[marketplace]/refresh?userId=demo
```

Supported real token exchange paths:

- eBay authorization-code OAuth
- Etsy OAuth with PKCE
- Meta commerce OAuth structure, only for approved Meta commerce surfaces
- Depop partner OAuth structure, only after Depop provides auth/token URLs
- TikTok Shop merchant token refresh structure, only after Partner Center approval

Mercari and Poshmark remain manual because no public seller-listing API is wired.

Local token storage:

```text
.resellsync-token-vault.json
```

That file is ignored by Git and encrypted with `RESELLSYNC_TOKEN_ENCRYPTION_KEY`. In local development only, the app can use a dev fallback key; production requires a real encryption key.

## How To Replace Mock Adapters With Real APIs

1. Pick one marketplace first, usually eBay or Etsy.
2. Create the official developer app.
3. Add OAuth client IDs and redirect URIs to `.env.local`.
4. Add server-side token exchange.
5. Replace the matching adapter in `src/lib/adapters/`.
6. Keep the adapter function names the same so the UI does not need to change.
7. Store marketplace IDs, listing IDs, sync errors, and token metadata in a database.

Production notes:

- eBay has the clearest official listing API path.
- Etsy has an official Open API.
- Depop and TikTok Shop may require partner approval.
- Facebook Marketplace, Mercari, and Poshmark should remain manual/import-export channels unless official access is granted.
- Do not build scraping or browser automation for unsupported marketplaces.

## Supabase

The demo currently uses localStorage so it runs immediately.

Supabase setup files are included:

```text
supabase/schema.sql
docs/supabase-setup.md
```

Use Supabase when you are ready for real users, saved inventory, photo storage, and account data.

## Stripe / Payments

The checkout flow uses `DemoPay`.

The Stripe-ready structure is in:

```text
src/lib/payments.ts
```

For production, create Stripe Checkout Sessions or PaymentIntents on the server, then record successful payments after webhook confirmation.

## Deploy To Vercel

1. Push this repo to GitHub.
2. Go to [Vercel](https://vercel.com/).
3. Create a new project from the GitHub repo.
4. Add environment variables if needed.
5. Deploy.

Vercel build command:

```text
npm run build
```

Vercel output framework:

```text
Next.js
```

## Known Limitations

- Marketplace integrations are mocked.
- Payments are simulated.
- Demo auth is local and not production auth.
- localStorage data is browser-specific.
- Real OAuth/token routes are scaffolded, but you still need official developer approvals and credentials.
- Stripe checkout still needs server-side PaymentIntent or Checkout Session routes.
- Unsupported marketplaces should use manual workflows unless official API approval is obtained.

## Push To GitHub

```powershell
git add .
git commit -m "Build ResellSync demo app"
git push
```
