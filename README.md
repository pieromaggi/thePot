# Pot Tracker

Track a shared pot with participant contributions, shared expenses, and net balances.

## Getting Started

1. Create a Supabase project and apply the SQL in `supabase/migrations/0001_init.sql`.
2. Copy `.env.example` to `.env.local` and fill in Supabase keys.
3. Run the dev server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Vercel Deployment

1. Push this repo to GitHub.
2. Create a new Vercel project from the repo.
3. Set the following environment variables in Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (optional; publishable/anon is enough if RLS is off)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy.
