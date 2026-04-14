# CT Energy Compare

Compare Connecticut electricity supplier rates against Eversource/UI standard service.
Data auto-loaded from the OCC monthly fact sheets (portal.ct.gov) — no manual updates needed.

## Stack

- **Next.js 14** (App Router) — frontend + API routes
- **Clerk** — auth (email, Google, etc.)
- **Supabase** — Postgres database (saved comparisons, user prefs)
- **Anthropic API** — PDF extraction from OCC fact sheets
- **Vercel** — hosting (free tier)

---

## Deploy in ~20 minutes

### 1. Get your API keys (all free tiers)

**Anthropic**
1. Go to https://console.anthropic.com
2. Create an API key → copy it

**Clerk**
1. Go to https://dashboard.clerk.com → Create application
2. Copy "Publishable key" and "Secret key" from API Keys tab

**Supabase**
1. Go to https://app.supabase.com → New project
2. Settings → API → copy "Project URL" and "anon public" key and "service_role" key
3. Go to SQL Editor → paste the contents of `supabase-schema.sql` → Run

**Vercel** (for hosting)
1. Go to https://vercel.com → sign up with GitHub

---

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create ct-energy-compare --public --push
# or manually create on github.com and push
```

---

### 3. Deploy on Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Add Environment Variables (Settings → Environment Variables):

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/compare
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/compare
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

4. Click Deploy → done. Vercel gives you a free `.vercel.app` URL instantly.

---

### 4. Configure Clerk redirect URLs

In your Clerk dashboard → Domains → add your Vercel URL (e.g. `https://ct-energy-compare.vercel.app`)

---

### 5. (Optional) Custom domain

In Vercel → Settings → Domains → add your domain.
Update Clerk allowed origins to match.

---

## Local development

```bash
cp .env.local.example .env.local
# fill in your keys

npm install
npm run dev
# → http://localhost:3000
```

---

## How data stays current

On every `/compare` page load, the app calls `/api/fetch-rates` which:
1. Generates candidate OCC PDF URLs working backwards from today's date
2. Tries each URL until one responds (OCC publishes ~6 weeks after the data month)
3. Uses the Anthropic API to extract text from the PDF
4. Parses out: Eversource rate, UI rate, next announced rate, top 5 cheapest supplier offers
5. Returns structured JSON to the frontend

The OCC has published these monthly since 2014. No manual updates ever needed.

---

## Data sources

- OCC Electric Supplier Market Fact Sheets: https://portal.ct.gov/occ/electricity
- PURA Docket 06-10-22 compliance filings
- EnergizeCT Rate Board: https://www.energizect.com/rate-board/compare-energy-supplier-rates

Not affiliated with PURA, OCC, Eversource, or UI.
