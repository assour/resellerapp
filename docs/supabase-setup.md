# Supabase Setup

This app starts with a local mock database by default. Supabase files are included so the demo can later become a real multi-user app.

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

## 3. Update `.env.local`

Copy `.env.example` to `.env.local`, then fill in:

```bash
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=product-photos
```

Restart the local dev server after editing `.env`.

## 4. Test Supabase Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You should see a sign-in screen. Create an account, then test:

- Add a product.
- Upload a photo.
- Save as draft.
- Publish a listing.
- Connect/disconnect marketplace cards.
- Mark a listing as sold.
- Refresh the browser and confirm data persists from Supabase.

## Notes

- The frontend uses the anon key only. Never put service-role keys in Next public environment variables.
- Real marketplace OAuth token exchange should stay on backend routes, Supabase Edge Functions, or another trusted server. Do not put marketplace secrets in public browser variables.
- If Supabase is not configured, the app falls back to demo mode.
