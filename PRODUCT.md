# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, roughly equal in importance:

- **Homeowner/consumer shoppers** — browse and buy curtain hardware and accessories online for their own home, often supported by a nearby physical Glyde store where they can see and touch product before buying.
- **Trade/bulk buyers** (installers, dealers) — source hardware in volume; product pages carry "contact us for installation and bulk pricing" language for this channel.

## Product Purpose

Glyde Curtains' e-commerce site (glydecurtains.com) sells curtain running hardware and accessories — track runners, ceiling/wall fittings, end caps, ripple systems, curtain tapes — direct to both retail and trade buyers, backed by a full admin back-office for catalogue, inventory, order, and content management.

## Positioning

Manufacturer-direct plus a real physical store network: Glyde sells its own hardware directly (cutting out middlemen) and backs the online catalogue with genuine brick-and-mortar locations customers can visit, rather than being a pure online reseller of third-party curtain hardware.

## Operating Context

- Public storefront: home, category/subcategory browsing (Accessories → Track Runners, Ceiling Fittings, Wall Fittings, End Caps, Curtain Tapes), product detail, search, cart, checkout, order history, wishlist, feedback, store locator, achievements/milestones showcase, CMS-managed static pages (About, Contact, etc.), i18n in English, Hindi, and Gujarati.
- Admin back-office: dashboard, product/category/inventory management, orders, invoices, employees, users, role/permission management, activity logs, reports, CMS/site settings (including per-variant logo uploads), store management, achievements management, enquiries, feedback moderation.
- Product media (images/videos) for the seeded official catalogue is served as static files from the backend (`/products/accessories/**`, `/assets/logo/**`), proxied through nginx in production — a genuine infra constraint for any future asset routing changes.

## Capabilities and Constraints

- Existing stack: Spring Boot 3 / Java 21 backend (JWT auth, role-based `@RequiresPermission`), React 18 + TypeScript + Vite + MUI + Redux Toolkit frontend.
- Real product catalogue is seeded from what's actually published at glydecurtains.com/products — not placeholder data.
- Store Locator must show only genuine Glyde store addresses — never placeholder or fabricated locations.
- Achievements/milestones metrics (install counts, satisfaction %, nationwide reach, etc.) must reflect real business figures — never invented numbers.

## Brand Commitments

- Name: **Glyde Curtains**, brand mark: **GLYDE** (used as `product.brand` on every catalogue item).
- Existing logo/poster assets at `backend/src/main/resources/static/assets/logo/` (`logo.jpg`, `poster.png`) are the current committed identity.

## Evidence on Hand

- Live catalogue reference: glydecurtains.com/products (source of truth the seeder imports from).
- Achievements page displays real, business-supplied metrics — absence of a confirmed figure means it must not be invented.
- Store Locator entries must be real, confirmed store locations only.

## Product Principles

1. Serve retail and trade buyers from the same catalogue without making either feel like an afterthought.
2. Let the manufacturer-direct, real-store-network positioning show up in product and trust content, not just claimed in copy.
3. Never fabricate the numbers or locations that carry the site's credibility (achievements metrics, store addresses, reviews).
4. Keep the admin back-office scannable and consistent — it's the daily tool for running the business, not a showcase.
