# BizPilot AI

AI Business Advisory & Financial Structuring Assistant for Micro-Entrepreneurs — hackathon MVP.

## Architecture

```
User Input (Setup form)
   → Financial Engine   (lib/financialEngine.ts)   — pure deterministic math
   → Risk/Analysis Engine (lib/riskEngine.ts)       — rule-based scoring, alerts
   → AI Advisor          (app/api/advisor/route.ts) — Claude explains, never calculates
   → Dashboard            (app/*)
```

**Golden rule enforced in code:** `financialEngine.ts` and `riskEngine.ts` never call any AI API.
`app/api/advisor/route.ts` never does math — it only receives already-computed numbers as JSON
context and explains them. Swapping Claude for LYRA later = editing one function
(`callModel`/the fetch call) in that one file.

## Run locally

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY to get real AI answers
npm run dev
```

Open http://localhost:3000 — it loads with realistic demo data (a textile trading business)
so the whole product is explorable with zero setup. Without an API key, the AI Advisor
still works end-to-end but returns a clearly-labeled demo response instead of a live Claude answer.

## Deploy

Push to GitHub → import into Vercel → add `ANTHROPIC_API_KEY` as an environment variable → deploy.
No database is required for the current demo (business inputs persist in the browser's
localStorage), so there's nothing else to configure to get a working public demo link.

## Pages / Features implemented

| Page | Route | What it does |
|---|---|---|
| Dashboard | `/` | KPIs, health score, 6-month cash forecast chart, alerts, AI panel |
| Business Setup | `/setup` | Editable form for every raw input (revenue, expenses, receivables, debt, etc.) |
| Financial Analysis | `/analysis` | Full metrics table + health score breakdown by component |
| Cash Flow | `/cash-flow` | 6-month inflow/outflow chart, funding gap, month-by-month table |
| Receivables | `/receivables` | DSO, cash stuck estimate, risk level |
| Inventory | `/inventory` | Turnover days, inventory/revenue ratio, risk level |
| Funding Advisor | `/funding` | Recommended funding amount + illustrative EMI options |
| What-If Simulator | `/simulator` | 5 preset scenarios, baseline vs scenario chart, verdict |
| AI Advisor | `/advisor` | Free-form chat against live metrics + alerts |

## Team split (4 developers, parallel-friendly)

- **Dev 1 — Frontend + Dashboard**: `app/page.tsx`, `components/*`, `app/globals.css`, Tailwind config
- **Dev 2 — Backend + Database**: `app/api/*`, later add Postgres/Neon under `lib/db.ts` (not yet wired — inputs are localStorage-only for the demo)
- **Dev 3 — Financial Engine + Simulator**: `lib/financialEngine.ts`, `lib/riskEngine.ts`, `app/simulator/page.tsx`
- **Dev 4 — Claude AI + LYRA integration**: `app/api/advisor/route.ts`, `lib/aiContext.ts`, `components/AIAdvisorPanel.tsx`

Because the Financial Engine has zero dependency on the AI layer (and vice versa), Devs 3 and 4
can work fully in parallel — Dev 4 only needs the *shape* of `DerivedMetrics` (in `lib/types.ts`),
not the AI code, and Dev 3 never touches the AI route.

## What's intentionally NOT built (per hackathon scope)

Auth, real banking/loan APIs, payments, blockchain, mobile app, OCR, microservices, ML models.
Business data is demo/synthetic and stored in the browser only.

## Next steps to build

1. Wire `DATABASE_URL` (Neon Postgres) so business inputs persist server-side per user instead of localStorage.
2. Add lightweight auth (even a simple shared password) before a public demo link.
3. Replace the preset What-If scenarios with a free-form scenario builder.
4. Add the LYRA swap-in once that model/endpoint is ready (see comment at top of `app/api/advisor/route.ts`).
