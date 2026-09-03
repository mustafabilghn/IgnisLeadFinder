# Ignis Lead Finder

Internal tool that answers one question: **which company should I contact first for Ignis, and what evidence makes it worth contacting?**

It discovers real businesses in a location/industry, does a lightweight scan of their public website, extracts Ignis-relevant signals (B2B, dealer network, custom/technical orders, WhatsApp/ERP, etc.), computes a deterministic **Ignis Fit Score (0–100)**, and ranks leads so you know who to research first — with every signal traceable back to VERIFIED / INFERRED / UNKNOWN evidence, never invented.

## Real data only — no silent fallback

**Normal use requires real credentials.** There is no "works out of the box with fake data" mode. If `GOOGLE_MAPS_API_KEY` isn't set, the app does not invent businesses — the Search button is disabled and shows exactly why. If `ANTHROPIC_API_KEY` isn't set, the "Generate" buttons on a lead's detail page are disabled the same way. Nothing ever silently substitutes mock businesses, fake ratings/reviews, or template AI text for the real thing — every failure is a visible, actionable error.

The header always shows the true state: **🟢 REAL DATA MODE** / **🔴 REAL DATA UNAVAILABLE** for business discovery, **✓ AI ENABLED** / **✗ AI UNAVAILABLE** for AI generation. The search page also has a small **System Status** panel with the same two checks.

## Quick start

```bash
npm install
cp .env.example .env.local
# edit .env.local: add GOOGLE_MAPS_API_KEY and ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

| Variable | Required for | Where to get it |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | Business discovery (Google Places API, New) | Google Cloud Console → enable "Places API (New)" → create an API key |
| `ANTHROPIC_API_KEY` | AI lead summary / discovery questions / outreach message | console.anthropic.com |
| `ANTHROPIC_MODEL` (optional) | — | Defaults to `claude-haiku-4-5-20251001` (cheap, sufficient for grounded summarization) |
| `APP_ACCESS_TOKEN` (optional) | Basic API protection beyond localhost | Any secret string you choose; required as an `x-ignis-token` header on mutating routes when set |

Nothing here is ever sent to the browser — all provider calls happen server-side (Next.js Route Handlers). Restart `npm run dev` after editing `.env.local`.

### One real test search

```text
Country:  Turkey
City:     Istanbul
District: Beylikdüzü
Category: Aluminum Manufacturer
Max:      10
```

With `GOOGLE_MAPS_API_KEY` set, this returns actual aluminum manufacturers in Beylikdüzü — check a couple of names/addresses against Google Maps yourself to confirm. Fields Google doesn't provide (no website, no rating) show **"Unknown / Not available"**, never a generated placeholder.

### Developer/test mode (mock data)

For UI development without burning API calls, set `BUSINESS_PROVIDER=mock` in `.env.local`. This is an explicit, isolated opt-in — never the default, never silent. The header switches to **🧪 MOCK DATA MODE**, and every mock business is clearly a sample (fake ratings included) meant only for exercising the discovery → scan → score → rank pipeline offline. AI generation still requires a real `ANTHROPIC_API_KEY` even in mock mode — there is no fake-AI mode for text generation, ever.

## How scoring works

`src/lib/scoringEngine.ts` is a plain, auditable rules table — **no LLM involved** in the score itself. Each of the 5 weighted categories (B2B fit, order complexity, operational complexity, channel complexity, automation opportunity) sums points for specific VERIFIED/INFERRED signals, capped at its max, summing to exactly 100. AI is only used afterward, to turn the already-computed evidence into a short grounded explanation, discovery questions, and an outreach message — and only when `ANTHROPIC_API_KEY` is set; the system prompt (`src/lib/aiClient.ts`) explicitly forbids inventing facts, names, assuming a WhatsApp icon means WhatsApp orders, or claiming manual research was done.

Every signal in `src/lib/signalDefinitions.ts` is either:
- **VERIFIED** — an exact phrase (English + Turkish) found on a scanned page, with the source URL and a quoted snippet
- **INFERRED** — a conclusion derived from a combination of VERIFIED signals (clearly labeled as such)
- **UNKNOWN** — not found; never silently treated as "no"

## Architecture

```
src/
  lib/
    config.ts                      isGoogleConfigured / isAnthropicConfigured — single source of truth for real-vs-blocked state
    errors.ts                      NotConfiguredError + shared 503-vs-502 route error mapping
    providers/businessDiscovery/   BusinessDiscoveryProvider interface + mock & Google Places implementations
    websiteAnalyzer.ts             Fetches homepage + a couple of relevant sub-pages (dealer/about/contact), bounded & timeboxed
    signalExtractor.ts             Raw text -> evidence log (SignalEvidence[])
    scoringEngine.ts               Evidence -> deterministic Ignis Fit Score
    aiLeadAnalyzer.ts               "Why this lead" + discovery questions (grounded LLM calls — throws if not configured)
    outreachGenerator.ts           Personalized outreach message (same grounding rules)
    leadRepository.ts              SQLite (node:sqlite) persistence + filtering
    searchPipeline.ts              Orchestrates discovery -> upsert -> analysis, with cost-control (new leads only)
  app/
    page.tsx                       Search + System Status diagnostics panel
    leads/page.tsx                 Ranked results + filters + CSV export
    leads/[id]/page.tsx            Evidence, score breakdown, AI sections, status/notes
    api/                           Route handlers backing all of the above (search/AI routes return 503 when not configured)
```

No ORM, no queue, no auth system beyond an optional shared-secret header — this is a small internal tool, kept that way on purpose.

## Storage

SQLite via Node's built-in `node:sqlite` (no native compilation required — this avoided a real dependency-install failure with `better-sqlite3` on this machine, which needs a C++ toolchain Windows doesn't ship by default). The database file lives at `data/ignis.sqlite` (configurable via `DATABASE_PATH`) and is git-ignored.

Re-running a search that rediscovers an already-known lead only refreshes its raw discovery fields (name/address/phone/rating) — it does **not** re-scan the website or re-score, to avoid burning API calls on data you already have. Use the **Rescan** button on a lead's detail page to force a fresh analysis.

## What's intentionally not here

Per the project brief: no automated sending (email/WhatsApp/LinkedIn), no CRM integration, no billing/multi-tenant/teams, no heavy crawling. Lead management is just a status enum (New/Contacted/Interested/Meeting/Won/Lost) + a free-text note — enough to track who you've reached out to, not a CRM.
