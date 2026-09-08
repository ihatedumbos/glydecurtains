---
target: Home page (frontend/src/pages/public/HomePage.tsx)
total_score: 17
max_score: 32
na_heuristics: 7,10
p0_count: 2
p1_count: 2
target_identity: "file:/Users/shalininayak/Documents/NIS/glyde/glydecurtains/frontend/src/pages/public/HomePage.tsx"
target_fingerprint: "sha256:63d44bd4257e344000ea39641eb93e37408063f18191d548f39623a5555ce87e"
target_path: /Users/shalininayak/Documents/NIS/glyde/glydecurtains/frontend/src/pages/public/HomePage.tsx
timestamp: 2026-09-08T20-59-18Z
slug: frontend-src-pages-public-homepage-tsx
closed: true
---
# Design Critique — Glyde Curtains Home Page

**Method: dual-agent (A: aef4d6e2a90bc7500 · B: a3b05e5ae74346ac3)**

Target: frontend/src/pages/public/HomePage.tsx and everything it renders (CMS sections, ProductCard, Header/MegaMenu/MobileDrawer/Footer).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Generic top-level spinner while child sections have their own inconsistent loading language |
| 2 | Match Between System & Real World | 1 | Fabric/décor copy ("curtains, blinds, window treatments") throughout, for a business PRODUCT.md defines as a hardware manufacturer |
| 3 | User Control and Freedom | 2 | Hero slider's prev/next controls are hover-only (moot anyway — hero never renders, see below) |
| 4 | Consistency and Standards | 3 | Token discipline is strong; one hardcoded off-token gray background, copy tone breaks DESIGN.md's own rule |
| 5 | Error Prevention | 2 | Newsletter signup fakes success locally with no real API call |
| 6 | Recognition Rather Than Recall | 3 | Persistent nav, labeled category icons — solid |
| 7 | Flexibility and Efficiency | n/a | Landing/persuade surface — no power-user path expected |
| 8 | Aesthetic and Minimalist Design | 3 | Clean at the component level, one off-token deviation |
| 9 | Error Recovery | 1 | Every failed fetch silently renders nothing — no retry, no message |
| 10 | Help and Documentation | n/a | Not applicable to a landing page |
| **Total** | | **17/32** | **Acceptable (53%)** |

## Design Specificity Verdict

**LLM assessment**: Fails the specificity test in a concrete, traceable way rather than a vibes-based one. The visual system (blue accent, Inter, radius scale, hover-only shadows) is genuinely brand-specific — but the actual content layer describes a fabric/décor retailer, not the hardware manufacturer PRODUCT.md and DESIGN.md both describe. Seeded hero copy, ticker fallback text, BrandStory's defaults, and the footer tagline all say "curtains, blinds, window treatments" with zero mention of track runners, ceiling/wall fittings, or the trade channel. There is no on-page acknowledgment at all of the second named-equal audience (trade/bulk buyers).

**Deterministic scan**: detect.mjs returned a clean scan — 0 findings, exit code 0 — across HomePage.tsx, all 9 files in components/cms/, ProductCard.tsx, Header.tsx, MegaMenu.tsx, MobileDrawer.tsx, and Footer.tsx. No false positives to weigh, because there were no hits at all. This is the most important place the two assessments diverge: the mechanical detector is pattern/markup-based and has no way to see functional or content bugs — it can't know a filter array silently drops a rendered section, or that a component's default props are fabricated business stats. Every substantive P0/P1 issue below came from Assessment A's source trace, not from the deterministic scan; the clean scan should be read as "no slop-pattern hits," not "no problems."

**Visual overlays**: Not available. No browser automation, screenshot, or DOM-read tool is exposed in this session, so there is no live-page injection to report. Confirmed independently by both assessments.

## Overall Impression

The design system (tokens, components, motion) is well-built and genuinely on-brand — but a filter bug means the actual shipped homepage never shows the hero banner or the CMS ticker content, and a hardcoded fallback component (BrandStory) fabricates business stats that directly violate the product's own "never fabricate" constraint. The single biggest opportunity: fix the section filter first — several of the other findings (missing hero, missing trust content, tonal flatness) are downstream symptoms of that one array missing two entries.

## What's Working

1. Token discipline — ThemeProvider.tsx and index.css consistently apply the single-accent-blue rule, 12px radius, no-uppercase buttons — a well-maintained system at the component level.
2. AchievementsSection and CustomerTestimonials source real data from the backend rather than hardcoding numbers — exactly the pattern the "never fabricate" constraint requires, correctly implemented in these two components.
3. Resilient fetch architecture — Promise.allSettled and per-section try/catch mean one failing endpoint can't blank the whole page, even though the resulting silence needs UX work.

## Priority Issues

- [P0] PRIORITY_SECTION_TYPES filter silently drops seeded, enabled sections. HomePage.tsx line 35-39 excludes HERO_BANNER and SCROLLING_TICKER from the render allowlist, even though both are seeded and enabled in DataSeeder.java. Fix: add HERO_BANNER (and look up SCROLLING_TICKER from the unfiltered sections list, not enabledSections). Suggested command: /impeccable harden.
- [P0] BrandStory.tsx hardcodes fabricated stats as component defaults. Lines 28-39 default to "10+ Years Experience," "5000+ Happy Customers," "1000+ Products" whenever no CMS config is supplied. Fix: render nothing when config is unset, matching AchievementsSection's correct pattern. Suggested command: /impeccable harden.
- [P1] Home page copy contradicts the brand's own hardware-manufacturer positioning. Fix: rewrite default/seeded copy around the real product and both audiences. Suggested command: /impeccable clarify.
- [P1] No trade/bulk-buyer content anywhere on the home page. Fix: add a compact home-page module for trade buyers; surface the store locator on-page. Suggested command: /impeccable layout then /impeccable clarify.
- [P2] Silent failure states everywhere, no retry affordance. Fix: distinguish "empty" from "failed"; add inline retry at least for product sections. Suggested command: /impeccable harden.
- [P3] MegaMenu has no keyboard/focus entry point. Fix: add focus/blur handlers and ARIA state. Suggested command: /impeccable audit.

## Persona Red Flags

**Jordan (Confused First-Timer)**: Lands on a page with no h1 and no hero in the shipped state — the first content after the ticker is "Popular Categories," assuming Jordan already knows what to shop for.

**Riley (Deliberate Stress Tester)**: Discovers that the "no sections configured" fallback branch is more complete than the real happy path — it has a headline, subhead, two CTAs, and an image, everything the live path is missing because of the filter bug.

**Casey (Distracted Mobile User)**: With the hero unreachable, Casey's first meaningful content on mobile is category icons and product tiles with no persuasive framing — high bounce risk.

**"Ketan" (trade/bulk hardware dealer, project-specific persona)**: Nothing distinguishes a bulk/trade path from retail browsing; footer category links don't match the real category tree; store network is buried in footer Quick Links only.

## Minor Observations

- Founding-year inconsistency: footer says "since 2010," seeded Achievement implies 2015.
- AppBar uses a translucent/blurred background not specified in DESIGN.md's "white AppBar, no gradient" spec.
- ScrollingTicker uses the same generic alt="Featured product" for every image.
- ProductSection.tsx hardcodes bg-[#f7f8fa] instead of a themed token.

## Questions to Consider

1. If the hero and ticker-config sections have been silently dead, has anyone on the content side actually seen their CMS edits reflected live?
2. BrandStory's hardcoded stats sit right next to AchievementsSection's correctly-sourced real metrics — was BrandStory built before the "never fabricate" rule existed?
3. Should the trade/bulk-buyer audience get a visible on-page fork, not just product-page copy?
