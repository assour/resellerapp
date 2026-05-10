# Supabase Setup

This app still starts in demo mode by default. Supabase mode turns on only when `VITE_DEMO_MODE=false` and both Supabase keys are present.

## 1. Create A Supabase Project

1. Go to [Supabase](https://supabase.com/).
2. Create a new project.
3. Open **Project Settings > API**.
4. Copy the project URL and anon public key.

## 2. Create Tables And Policies

Open the Supabase SQL editor and run:

```sql
-- Copy and run the contents of supabase/schema.sql
```

The schema creates:

- `profiles`
- `products`
- `marketplace_connections`
- `activity`
- `settings`
- a public `product-photos` storage bucket
- row level security policies so users can only access their own data

## 3. Update `.env`

Copy `.env.example` to `.env`, then fill in:

```bash
VITE_DEMO_MODE=false
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_SUPABASE_STORAGE_BUCKET=product-photos
```

Restart the local dev server after editing `.env`.

## 4. Test Supabase Mode

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

You should see a sign-in screen. Create an account, then test:

- Add a product.
- Upload a photo.
- Save as draft.
- Publish a listing.
- Connect/disconnect marketplace cards.
- Mark a listing as sold.
- Refresh the browser and confirm data persists from Supabase.

## Notes

- The frontend uses the anon key only. Never put service-role keys in Vite.
- Real marketplace OAuth token exchange should happen on a backend or Supabase Edge Function, not directly in the browser.
- If Supabase is not configured, the app falls back to demo mode.
