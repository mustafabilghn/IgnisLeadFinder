# Ignis Lead Finder

Internal tool that answers one question: **which company should I contact first for Ignis, and what evidence makes it worth contacting?**

It discovers real businesses in a location/industry, does a lightweight scan of their public website, extracts Ignis-relevant signals (B2B, dealer network, custom/technical orders, WhatsApp/ERP, etc.), computes a deterministic **Ignis Fit Score (0–100)**, and ranks leads so you know who to research first — with every signal traceable back to VERIFIED / INFERRED / UNKNOWN evidence, never invented.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. It works immediately with **zero API keys** — a built-in mock provider returns realistic sample businesses (clearly labeled "MOCK DATA MODE" in the header) so the full pipeline (discovery → website scan → signals → score → AI summary/outreach) is testable end to end offline.

Try the three preset searches on the home page (Beylikdüzü/Aluminum, İkitelli/Industrial Distributor, Esenyurt/Metal Manufacturer) for the richest sample data, or type any other location/industry — a procedural generator produces plausible businesses for anything not in the curated set.

## Going live

Copy `.env.example` → `.env.local` and fill in what you have. Each is independent:

| Variable | Effect when set |
|---|---|
| `BUSINESS_PROVIDER=google_places` + `GOOGLE_PLACES_API_KEY` | Real business discovery via Google's Places API (New) instead of mock data |
| `ANTHROPIC_API_KEY` (+ optional `ANTHROPIC_MODEL`) | Real AI-generated lead summaries/discovery questions/outreach messages instead of template fallback text |
| `APP_ACCESS_TOKEN` | Requires an `x-ignis-token` header on mutating API routes — optional, for anything beyond localhost use |

Nothing here is ever sent to the browser — all provider calls happen server-side (Next.js Route Handlers).

## How scoring works

`src/lib/scoringEngine.ts` is a plain, auditable rules table — **no LLM involved** in the score itself. Each of the 5 weighted categories (B2B fit, order complexity, operational complexity, channel complexity, automation opportunity) sums points for specific VERIFIED/INFERRED signals, capped at its max, summing to exactly 100. AI is only used afterward, to turn the already-computed evidence into a short grounded explanation, discovery questions, and an outreach message — the system prompt (`src/lib/aiClient.ts`) explicitly forbids inventing facts, names, or claiming manual research was done.

Every signal in `src/lib/signalDefinitions.ts` is either:
- **VERIFIED** — an exact phrase (English + Turkish) found on a scanned page, with the source URL and a quoted snippet
- **INFERRED** — a conclusion derived from a combination of VERIFIED signals (clearly labeled as such)
- **UNKNOWN** — not found; never silently treated as "no"

## Architecture

```
src/
  lib/
    providers/businessDiscovery/   BusinessDiscoveryProvider interface + mock & Google Places implementations
    websiteAnalyzer.ts             Fetches homepage + a couple of relevant sub-pages (dealer/about/contact), bounded & timeboxed
    signalExtractor.ts             Raw text -> evidence log (SignalEvidence[])
    scoringEngine.ts               Evidence -> deterministic Ignis Fit Score
    aiLeadAnalyzer.ts               "Why this lead" + discovery questions (grounded LLM calls, template fallback)
    outreachGenerator.ts           Personalized outreach message (same grounding rules)
    leadRepository.ts              SQLite (node:sqlite) persistence + filtering
    searchPipeline.ts              Orchestrates discovery -> upsert -> analysis, with cost-control (new leads only)
  app/
    page.tsx                       Search
    leads/page.tsx                 Ranked results + filters + CSV export
    leads/[id]/page.tsx            Evidence, score breakdown, AI sections, status/notes
    api/                           Route handlers backing all of the above
```

No ORM, no queue, no auth system beyond an optional shared-secret header — this is a small internal tool, kept that way on purpose.

## Storage

SQLite via Node's built-in `node:sqlite` (no native compilation required — this avoided a real dependency-install failure with `better-sqlite3` on this machine, which needs a C++ toolchain Windows doesn't ship by default). The database file lives at `data/ignis.sqlite` (configurable via `DATABASE_PATH`) and is git-ignored.

Re-running a search that rediscovers an already-known lead only refreshes its raw discovery fields (name/address/phone/rating) — it does **not** re-scan the website or re-score, to avoid burning API calls on data you already have. Use the **Rescan** button on a lead's detail page to force a fresh analysis.

## What's intentionally not here

Per the project brief: no automated sending (email/WhatsApp/LinkedIn), no CRM integration, no billing/multi-tenant/teams, no heavy crawling. Lead management is just a status enum (New/Contacted/Interested/Meeting/Won/Lost) + a free-text note — enough to track who you've reached out to, not a CRM.
