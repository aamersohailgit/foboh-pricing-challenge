# Fullstack [Pricing] - 2026 update

> 🔔 **Hello**, if you're reading this, then we think you could be a good fit for team FOBOH. Thank you for taking the time to complete this challenge and we hope to talk with you soon!

This challenge is built around a real piece of FOBOH product surface: customer-specific pricing for food and beverage suppliers. It's designed to show us how you build, not whether you can recall syntax.

**Time budget:** 3 to 4 hours.

## AI tools

AI tools (Claude, Cursor, Copilot etc.) are part of how we work at FOBOH. You're encouraged to use them on this challenge. We use them daily. What we care about is how you direct them, what you accept, what you reject and the judgement calls you make along the way.

**Required:** submit your full AI conversation transcripts alongside your code. Most tools support exporting or sharing chats. If you used multiple sessions, include all of them.

**If you didn't use AI:** no transcript needed, just say so in the README.

## The brief

As a supplier, I want to offer bespoke product prices to specific customers, so I can tailor my offer and protect margin.

Build a React frontend talking to a Node.js backend. The supplier should be able to:

- Search and filter products by title, SKU, sub-category, segment, and brand
- Select products into a pricing profile, including select-all
- Apply a fixed ($) or dynamic (%) adjustment, increase or decrease
- Preview the new prices before saving
- Save the profile via an API

### Calculation

Fixed: New = Base [+/-] Adjustment

Dynamic: New = Base [+/-] (Adjustment% × Base)

NOTE: New price must never be negative

### Backend

In-memory store is fine. Types and validation somewhere sensible. CRUD endpoints for pricing profiles. Expose via Swagger or OpenAPI.

### Seed data

| Title | SKU | Brand | Sub-cat | Segment | Price |
|---|---|---|---|---|---|
| High Garden Pinot Noir 2021 | HGVPIN216 | High Garden | Wine | Red | 279.06 |
| Koyama Methode Brut Nature NV | KOYBRUNV6 | Koyama Wines | Wine | Sparkling | 120.00 |
| Koyama Riesling 2018 | KOYNR1837 | Koyama Wines | Wine | Port/Dessert | 215.04 |
| Koyama Tussock Riesling 2019 | KOYRIE19 | Koyama Wines | Wine | White | 215.04 |
| Lacourte-Godbillon Brut Cru NV | LACBNATNV6 | Lacourte-Godbillon | Wine | Sparkling | 409.32 |

### Overlapping profiles

In real F&B wholesale, suppliers run multiple profiles at once and customers sit in more than one. This is where it gets spicy.

Scenario

- **Profile A:** 10% off all Wine, applied to the "Independent Retailers" customer group
- **Profile B:** $15 off all Sparkling Wine, applied to the "VIP" customer group
- **Profile C:** Custom price of $95 on Koyama Methode Brut Nature NV, applied to a single customer "Bondi Cellars"

Bondi Cellars is in both groups. They order Koyama Methode Brut Nature NV. Three profiles match. What do they pay?

What we want

- A precedence rule, in plain English in your README. Specific enough that another engineer could implement it without asking you questions.
- A resolver in your backend that takes customer + product and returns the price, the source profile, and why.
- An endpoint that exposes it. Show it working in the UI or via README examples, your call.

**There's no single correct answer.** AI will hand you a generic one. Your rationale is what we're scoring.

## What we're assessing

Working code is the floor. We're looking at

- **Your precedence rule.** Whether it's implementable without ambiguity, whether the rationale connects to commercial reality, whether your code matches what you wrote.
- **How you direct AI.** Where you pushed back, what you owned, whether the code reads coherent or stitched together.
- **Judgement on the small stuff.** Rounding, negative prices, what "All Products" means over time, deleted products. Pick what to handle and be deliberate.
- **Code basics.** Sensible types, component boundaries, error handling, an API you wouldn't be embarrassed to review.

## Submitting

Public GitHub repo (or shared private). README with setup, trade-offs, and what you'd do next, three paragraphs is plenty. Transcripts in the repo. Email to info@foboh.com.au within 3 business days.

Not expected to be production-ready. Build something you'd be happy to walk us through line by line. Sing out if anything's blocking.

**Design reference:** FOBOH Engineering Challenge | Pricing

---

## Page 4 — UI Mockup Description

The mockup shows the full FOBOH web app with a left sidebar and a multi-step "Setup a Profile" wizard as the main content.

**Left sidebar navigation** (dark, narrow): FOBOH logo, then nav items — Dashboard, Orders, Customers, Products, Pricing (active, left-border highlight), Freight (tagged "NEW"), Integrations, Settings.

**Top bar**: greeting ("Hello, Ekomini"), date, two icon-button avatars, and a user chip ("Ekomini Mark") on the right.

**Breadcrumb**: "Pricing Profile > Setup a Profile" with a subtitle "Setup your pricing profile, select products and assign customers." Cancel and Save as Draft buttons sit top-right.

**Step 1 — Basic Pricing Profile** (status: Completed, green dot): shows a profile name/description field and a "Make Changes" link.

**Step 2 — Select Product Pricing** (in progress): This is the primary build surface.

- Scope selector: radio buttons — One Product / Multiple Products / All Products.
- Search bar: free-text "Search" input, a "Product / SKU" field, and three dropdowns — Category, Segment, Brand.
- Active filter chips displayed below the search row (e.g. "[Product Name or SKU Code] [Brand] [Brand]"), with a results count.
- "Deselect All" and "Select all" controls above the list.
- Product list: each row has a checkbox, a product thumbnail image, product title, SKU, and pack-size/format (e.g. "12 × 375ML, Can Case"). Selected rows show a green filled checkbox; unselected rows show grey. Sample products: HN Half Day Hazy, Crumbl Cookies, Necessaire.
- Selection summary line: "You've selected 3 Products, these will be added [Profile Name]."
- "Based on" dropdown: "Global Wholesale Price."
- Price adjustment mode: radio — Fixed ($) | Dynamic (%).
- Increase/Decrease mode: radio — Increase + | Decrease − (Decrease shown selected).
- Info callout: "The adjusted price will be calculated from Global Wholesale Price selected above."
- "Refresh New Price Table" link/button.
- Preview table columns: Product Title, SKU Code, Category, Global Wholesale Price, Adjustment, New Price. Example rows show base prices of $41–$45, a −$5.00 adjustment, and computed new prices.
- "Your articles are saved automatically" note below the table.
- Back and Next (teal) buttons.

**Step 3 — Assign Customers to Pricing Profile** (status: Not Started, grey dot): "Choose which customers this profile will be applied to."
