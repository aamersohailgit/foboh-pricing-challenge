# FOBOH Pricing Challenge

Customer-specific pricing for F&B suppliers: a React frontend talking to a Node/Express backend. A supplier can search and filter products, build a pricing profile (who it's for, what it covers, how the price changes), preview the new prices, and save it. The centerpiece is the **resolver** — given a customer and a product, it returns the price, the source profile, and *why*, walking a precedence ladder when multiple profiles overlap.

The original brief is transcribed in [docs/CHALLENGE.md](docs/CHALLENGE.md); the decisions layered on top of it (stack, precedence rule, edge-case calls) live in [CLAUDE.md](CLAUDE.md). This README is the operator's guide — setup, the rule in plain English, and the trade-offs I made.

## Setup

Two independent apps. Backend first (the frontend proxies to it):

```bash
cd backend && npm install && npm run dev     # API + Swagger UI on http://localhost:3001
cd frontend && npm install && npm run dev     # UI on http://localhost:5173 (proxies /api → :3001)
```

Open `http://localhost:5173` for the app, or `http://localhost:3001/docs` for the Swagger UI (raw spec at `/openapi.json`). Run the tests with `npm test` in either folder — the backend's are focused on the resolver (`backend/src/resolver/`) plus an API smoke suite; the frontend's cover the product filter. No database or Docker is required: the store is in-memory and seeded on boot from [backend/src/data/seed.ts](backend/src/data/seed.ts) with the brief's five wines plus a few extras.

## The precedence rule

This tool serves the **supplier, not the buyer**, so when profiles collide we never default to the cheapest price — specificity and intent win. The resolver walks this ladder top to bottom and stops at the first step that breaks the tie: **(0)** keep only active profiles (optional validity windows; missing dates = always active); **(1)** most specific *customer* match — a named customer beats a customer group; **(2)** most specific *product* match — exact product > segment > sub-category > all products (a segment like *Sparkling* is the narrower bucket *inside* a sub-category like *Wine*); **(3)** when customer and product specificity disagree, *customer* specificity wins; **(4)** final tiebreak — the most recently created profile wins (the latest deal is the one the supplier means).

**Worked example.** Bondi Cellars (in both "Independent Retailers" and "VIP") buys Koyama Methode Brut Nature NV, base $120. Three profiles match: A (10% off all Wine → $108, Independent Retailers group), B ($15 off all Sparkling → $105, VIP group), and C (custom $95 on this exact product, Bondi specifically). Walking the ladder: all three are active (Step 0), but C targets a **named customer** while A and B target groups — so C wins at **Step 1**. **Bondi pays $95 via Profile C**, and the resolver never needs Steps 2–4. Note C wins on *specificity*, not because it's cheapest: if C were $130, C would still win. You can see this live in the app's **Price Checker** tab, or via `GET /api/resolve-price?customerId=cust_bondi_cellars&productId=prod_koyama_brut`.

## Trade-offs and judgement calls

The biggest call was the **single-scope model**: a profile carries one rule-based scope (one product / segment / sub-category / all) rather than an arbitrary list of hand-picked products. This keeps the resolver's specificity ranking unambiguous and matches the overlapping-profiles scenario, at the cost of reinterpreting the mockup's "Multiple Products" as the by-segment / by-sub-category rules. Related: a **custom flat price (override) is only offered when the scope is a single product** — a flat price smeared across many products is nonsensical, so the UI guards it. On the small stuff (per the brief): prices round to 2dp half-up **once at the end**, negative results **clamp to $0** (zero is allowed — a supplier may give a free unit), "all products" is **dynamic** (new products are covered automatically), and **soft-deleted products** are hidden at the store boundary so the catalogue and resolver never surface them (the resolver also defends against being handed one directly). The preview math runs **server-side** (`POST /api/preview` reuses the same `applyPricing` the resolver uses) so the preview can't drift from what's saved.

Architecturally I kept things deliberately small for a 3–4 hour build: **in-memory store behind a repository interface** (swappable for a real DB without touching the resolver), **no Docker** (the brief says in-memory is fine; an optional `docker-compose.yml` could be added for reviewer convenience), and **no Redux/router/ORM** — plain React hooks, a tiny fetch client, and a Vite dev proxy for CORS. The domain is **Zod-first**: schemas are the single source of truth, validating request bodies at the edges and generating the OpenAPI component schemas. The resolver itself is a set of **pure functions** (no I/O, no clock) so it's trivially testable; the API layer reads `new Date()` at the edge and passes it in.

## What I'd do next

Persistence is the obvious first step — swap the in-memory `ProfileStore` for a real database behind the existing repository interface (no resolver changes needed), with profile audit history. I'd add server-side product search/filter and pagination (currently client-side, fine for ~10 products), authentication scoped to a supplier, and a richer profile editor — possibly per-product line items if the business genuinely needs hand-picked baskets with individual prices, which would mean extending the scope model and the precedence rule. Finally I'd broaden test coverage to the API error paths and add a couple of frontend component/integration tests around the builder's save flow and the Price Checker.


