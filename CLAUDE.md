# CLAUDE.md

Instructions for Claude Code in this repo. The original challenge brief lives in [docs/CHALLENGE.md](docs/CHALLENGE.md) — this file is the layer of decisions on top of it. Where this file and the brief differ, this file wins (it encodes choices already made). Reference the brief, don't restate it.

## What we're building

A supplier-side pricing tool for food & beverage wholesale: a React frontend talking to an in-memory Node.js backend, letting a supplier search/filter products, select them into a pricing profile, apply a fixed ($) or dynamic (%) adjustment, preview new prices, and save via an API. The centerpiece is the **resolver** — given a customer and a product, it returns the price, the source profile, and why, walking a precedence ladder when multiple profiles collide. Everything else is supporting surface; the resolver is what's being scored.

## Who this is built for

This tool serves the **supplier, not the buyer.** Every judgement call defaults in the supplier's favour. The supplier's goal is to **protect margin**, so **when rules collide we never default to the cheapest price** — that would serve the buyer. This single fact drives the precedence rule below: specificity and intent win, not lowest cost.

## The precedence rule

When more than one profile matches a (customer, product) pair, the resolver walks this ladder top to bottom and stops at the first step that breaks the tie:

- **Step 0 — Active profiles only.** Filter to active profiles first. Profiles may carry optional `validFrom` / `validUntil` dates; **missing dates means always active.** Inactive/expired profiles are out before any comparison.
- **Step 1 — Most specific customer match wins.** A profile targeting a **named customer** beats one targeting a **customer group.**
- **Step 2 — Most specific product match wins.** **Exact product** beats **segment** beats **sub-category** beats **"all products."** (Segment is the *narrower* bucket sitting inside a sub-category in the seed data — e.g. *Sparkling* is a segment within the *Wine* sub-category — so a segment match is more specific than a sub-category match. Ranked this way deliberately; don't flip it back to the everyday-English reading.)
- **Step 3 — Customer specificity outranks product specificity.** When Step 1 and Step 2 point at different profiles, **customer specificity wins.** (A deal struck for *this customer* is more deliberate than one struck for *this product* across everyone.)
- **Step 4 — Most recently created wins.** Final tiebreak: the **latest-created profile** wins — the most recent deal is the one the supplier means.
- **Step 5 — Principle, not a step: never default to cheapest.** If a tie somehow survives, do not fall back to the lowest price. Cheapest serves the buyer; this tool serves the supplier. Surface the ambiguity rather than silently picking the lowest.

### Worked example

**Bondi Cellars** buys **Koyama Methode Brut Nature NV** (base **$120**). Bondi sits in both the "Independent Retailers" and "VIP" groups. Three profiles match:

| Profile | Rule | Targets | Computed price |
|---|---|---|---|
| A | 10% off all Wine | Independent Retailers (group) | $108 |
| B | $15 off all Sparkling | VIP (group) | $105 |
| C | Custom $95 on this exact product | Bondi Cellars (named customer) | $95 |

Walking the ladder:
- **Step 0:** all three active → all stay in.
- **Step 1:** Profile C targets a **named customer** (Bondi Cellars); A and B target **groups**. C is the most specific customer match → **C wins here, ladder stops.**

**Result: $95, source Profile C.** We never reach Steps 2–4. Note the cheapest happens to win here only because C is the most specific — not because it's cheapest. If C were $130, C would still win.

## Edge-case decisions

These are deliberate calls, not oversights:

| Topic | Decision |
|---|---|
| **Rounding** | 2 decimal places, **half-up**, applied **once at the very end**. Never round mid-calculation. |
| **Negative prices** | **Clamp to $0.** Zero is allowed — a supplier may deliberately give a free unit. Never go below zero. |
| **"All products" semantics** | **Dynamic.** A profile scoped to "all products" automatically covers products added later. |
| **Deleted products** | Resolver **skips gracefully** — never crashes on a missing/deleted product. |
| **Validity windows** | **Optional** per profile. Missing `validFrom`/`validUntil` means **always active.** |

## Tech stack and why

- **Backend:** Node + Express + TypeScript + **Zod** (validation at the edges) + **in-memory store behind a repository interface** so it can be swapped for a real DB later without touching the resolver. CRUD endpoints for pricing profiles, exposed via Swagger/OpenAPI.
- **Frontend:** React + **Vite** + TypeScript + **Tailwind v4**.
- **Tests:** **Vitest**, focused on the **resolver** — that's the logic worth covering.
- **No database.** The brief says in-memory is fine; we take it.
- **No Docker during the build.** An optional `docker-compose.yml` may be added at the very end purely for reviewer convenience — not before.

## How to behave in this repo

- **Keep it simple.** This is a 3–4 hour challenge, not a platform.
- **Resolver as pure functions.** The precedence logic should be pure and unit-testable — no I/O, no framework coupling.
- **Explain trade-offs before generating code** on judgement-heavy tasks (anything touching the resolver, precedence, or edge cases). Don't jump straight to code where a decision is involved.
- **Don't scaffold beyond the current step.** Build what's asked, not a speculative future.
- **No heavy abstractions.** No Redux, no NestJS, no ORM. Reach for the smallest thing that works.

## Translation note (discussion only)

When talking through the domain in conversation, wine vocabulary may be substituted with **electronics** for clarity — e.g. *JB Hi-Fi* as a shop, *MacBook 14 2026* as a product. This is a **discussion convenience only.** The **seed data and tests stay on the original wine products** from the brief.
