---
name: Glyde Curtains
description: Blue-precision e-commerce storefront and admin console for a manufacturer-direct curtain hardware brand.
colors:
  signal-blue:
    value: "#0f4fe6"
  signal-blue-light:
    value: "#5c8aff"
  signal-blue-dark:
    value: "#0b2e8a"
  ledger-navy:
    value: "#1e3a8a"
  pale-sky:
    value: "#dbeafe"
  ink-navy:
    value: "#0f172a"
  frost-bg:
    value: "#f4f8ff"
  paper-white:
    value: "#ffffff"
  hairline-blue:
    value: "#dfe7ff"
  slate-gray:
    value: "#475569"
  confirm-green:
    value: "#16a34a"
  alert-amber:
    value: "#f59e0b"
  stop-red:
    value: "#dc2626"
  info-blue:
    value: "#2563eb"
typography:
  display:
    fontFamily: "'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontWeight: 600
    letterSpacing: "0.01em"
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
components:
  button-primary:
    backgroundColor: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.md}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)"
  card-product:
    backgroundColor: "{colors.paper-white}"
    rounded: "{rounded.lg}"
---

# Design System: Glyde Curtains

## Overview

**Creative North Star: "By Ashish"**

Glyde Curtains sells its own curtain hardware direct to homeowners and trade buyers, backed by a real physical store network — the visual system's job is to read as precise, confident, and personally accountable, the way a manufacturer who stands behind their own product should. It is not trying to be a boutique fabric-and-drapery brand; it is a clean, blue-anchored, engineering-adjacent storefront where trust is communicated through consistency and restraint rather than ornament.

The system is deliberately unfussy: one saturated signal-blue accent, white paper surfaces, soft ambient shadows at rest, and a single confident lift-plus-glow response on hover. Motion is used sparingly and purposefully (fade-and-rise entrances, a hover lift) rather than for decoration. This is the incumbent, committed identity of a live business — extend it, don't reinvent it.

**Key Characteristics:**
- Deep signal-blue (`#0f4fe6`) as the one recurring accent, carried mostly through gradient buttons and interactive states, not as a background wash.
- Paper-white cards on a faint frost-blue page background (`#f4f8ff`), never fully white behind the fold.
- Bold, tight-tracked Inter headlines (`-0.02em` letter-spacing, weight 700) against slate-gray body copy.
- 12px rounding as the system default; product cards go slightly rounder (16px) to feel more tactile.
- Flat at rest, lifted-with-glow on hover — depth is a response to interaction, not a permanent decoration.

## Colors

A single-accent system: one saturated signal blue carries all primary action and brand recognition; everything else is white, frost, or ink-navy neutrals plus standard semantic feedback colors.

### Primary
- **Signal Blue** (`#0f4fe6`): The one recurring brand accent — primary buttons (as a gradient with `#2563eb`), active nav states, links, focus rings. Reserved for actionable and brand-bearing elements only.
- **Signal Blue Light** (`#5c8aff`): Lighter gradient stop and lighter-emphasis accents (e.g. icon tints, hover glows).
- **Signal Blue Dark** (`#0b2e8a`): Deepest accent stop, used for pressed/active states and high-contrast accent text.

### Secondary
- **Ledger Navy** (`#1e3a8a`): Secondary-role accent — used sparingly where a second, cooler blue distinguishes from the primary action color (e.g. secondary buttons, badges).
- **Pale Sky** (`#dbeafe`): Secondary-light tint — soft chip/badge backgrounds, subtle highlighted rows.

### Neutral
- **Ink Navy** (`#0f172a`): Primary text and near-black headline color; also the base of the page's dark end (e.g. AppBar text).
- **Slate Gray** (`#475569`): Secondary/body text, captions, muted labels.
- **Frost Background** (`#f4f8ff`): The page canvas — a top-to-bottom gradient from `#eef5ff` to `#f7faff`/`#f8fbff`, never a flat white behind content.
- **Paper White** (`#ffffff`): Card, AppBar, Drawer, and Paper surfaces — the "raised" surface color against the frost canvas.
- **Hairline Blue** (`#dfe7ff`): Dividers and hairline borders; a tinted line, never neutral gray.

### Semantic
- **Confirm Green** (`#16a34a`), **Alert Amber** (`#f59e0b`), **Stop Red** (`#dc2626`), **Info Blue** (`#2563eb`): standard success/warning/error/info roles, used only for system feedback (stock states, form validation, order status) — never as decorative accents.

### Named Rules
**The One Accent Rule.** Signal Blue is the only saturated hue allowed to carry brand meaning. Every other color in the system is a neutral, a tint of blue, or a semantic feedback color — never a second unrelated brand hue.

## Typography

**Display Font:** Inter (with SF Pro Display, system-ui fallback)
**Body Font:** Inter (with system-ui, -apple-system fallback)
**Label/Mono Font:** JetBrains Mono / Fira Code (declared as a token; used sparingly, mainly for SKUs/codes if needed)

**Character:** A single confident sans-serif family carries the whole system — bold, tight-tracked headlines paired with relaxed 1.6 line-height body copy. There's no serif or display-face contrast; hierarchy comes entirely from weight and size, not from mixing families.

### Hierarchy
- **Display/H1** (700, `3rem` / `--text-5xl`, 1.2 line-height, `-0.02em` tracking): Page-level hero headlines.
- **H2** (700, `2.25rem`): Section headlines.
- **H3** (700, `1.875rem`): Sub-section headlines, card group titles.
- **Title/H5–H6** (600, `1.25rem`–`1.125rem`): Card titles, dialog titles, panel headers.
- **Body** (400, `1rem`, 1.6 line-height): Default copy; slate-gray (`#475569`) for secondary/supporting text.
- **Label** (600, `0.01em` tracking, no uppercase transform): Button text and form labels — Material's default all-caps button transform is explicitly disabled (`textTransform: 'none'`).

### Named Rules
**The No-Shout Rule.** Buttons and labels never use uppercase transform. Emphasis comes from weight (600) and letter-spacing, not from shouting in caps.

## Layout

A standard responsive container scales through four breakpoints: mobile (`<768px`), tablet (`768–991px`), laptop (`992–1199px`), desktop (`1200px+`). The content container caps at `960px` (laptop), `1140px` (desktop), and `1320px` at `1400px+`, with horizontal padding growing from `1rem` to `2rem` as the viewport widens. Product grids and card layouts reflow rather than reflowing text — cards keep their internal padding and radius at every breakpoint; only the column count changes.

## Elevation & Depth

Hybrid: the system is flat at rest — Paper, AppBar, and Card surfaces carry no default shadow beyond a faint ambient ring — and depth appears only as a response to interaction. The signature move is a **dual shadow on hover**: a neutral ambient shadow stacked with a soft colored glow, so elevation reads as "this is now active," not as permanent chrome.

### Shadow Vocabulary
- **Ambient Soft** (`0 1px 2px rgba(15, 23, 42, 0.06)`): Resting-state ambient shadow for subtle surfaces.
- **Ambient Elevated** (`0 4px 12px rgba(15, 23, 42, 0.08)`): Slightly raised resting surfaces (e.g. AppBar at `0 8px 24px rgba(29, 78, 216, 0.08)`).
- **Card Hover Lift** (`0 12px 40px rgba(0,0,0,0.12), 0 0 20px rgba(99,102,241,0.08)`): Product card hover — a dark ambient shadow plus a signal-blue-tinted glow, paired with a `translateY(-6px)` lift.

### Named Rules
**The Response-Only Depth Rule.** Shadows exist to signal "this element just became interactive," not to decorate a resting layout. A card, button, or panel with a permanent heavy shadow at rest is off-system.

## Shapes

Corners are consistently rounded, never sharp and never fully pill-shaped except where MUI's native chip/badge shape calls for it. The system default is 12px (buttons, inputs, dialogs, the global `theme.shape.borderRadius`); product cards round slightly more at 16px (`borderRadius: 2` in the MUI spacing scale) to feel more tactile and separate them visually from functional chrome (buttons, inputs). No hard edges, no visible borders on primary surfaces except the intentional 1px hairline-blue divider/border on cards and inputs.

## Components

### Buttons
- **Shape:** 12px rounded (`borderRadius: '12px'`), no default shadow.
- **Primary:** filled with a diagonal gradient (`linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)`), white text, 600 weight, no uppercase transform.
- **Hover:** the gradient shifts one stop darker (`linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)`) — no shadow added, the color shift alone signals interactivity.
- **Ghost/Text/Outlined:** inherit the same radius and weight; rely on MUI's default outlined/text treatments layered on the same palette.

### Cards / Containers
- **Corner Style:** 16px on product cards, 12px on generic Paper/Card surfaces.
- **Background:** Paper White (`#ffffff`) against the Frost Background page canvas.
- **Shadow Strategy:** flat at rest (a faint ambient shadow, `0 12px 36px rgba(37,99,235,0.08)`, plus a 1px `rgba(96,165,250,0.18)` border); on hover, product cards lift 6px and gain the Card Hover Lift shadow (see Elevation).
- **Border:** a faint blue-tinted 1px border (`rgba(96,165,250,0.18)`) on generic MuiCard; product cards rely on shadow/overflow-hidden instead of a visible border.
- **Internal Padding:** standard MUI CardContent padding; discount/status chips are absolutely positioned at 8px insets.
- **Motion:** cards fade and rise into view on mount (`opacity 0→1`, `y: 20→0`, 0.3s) — a Framer Motion pattern used consistently for grid entrances, not just product cards.

### Chips
- **Style:** filled, small size, 600 weight label; semantic-colored variants (e.g. `color="error"` for discount badges) rather than a single neutral chip style.
- **State:** absolutely positioned badge usage (discount %, stock status) is as common as inline filter/selection chips.

### Inputs / Fields
- **Style:** white background, 1px slate/blue-tinted border, rounded to the system default.
- **Focus:** border tightens to a darker neutral (`#64748b`) with a soft 3px focus ring (`rgba(100,116,139,0.12)`) — a glow, not a hard outline.

### Navigation
- **Style:** white AppBar (no gradient), ink-navy text/icons, soft ambient shadow (`0 8px 24px rgba(29,78,216,0.08)`) rather than a hard border — the shadow is tinted signal-blue even at rest, unlike other resting surfaces.
- **Mobile:** collapses into a MobileDrawer (white Paper background, same ink-navy text) triggered from a hamburger icon; desktop nav carries a MegaMenu for category browsing.

## Do's and Don'ts

### Do:
- **Do** keep Signal Blue as the only saturated accent hue; introduce new colors only as neutrals, blue tints, or semantic feedback colors.
- **Do** use the fade-and-rise Framer Motion entrance (`opacity 0→1`, `y: 20→0`, 0.3s) for grid/card content appearing on mount.
- **Do** reserve heavier shadows and glow for hover/active states; keep resting surfaces flat or near-flat.
- **Do** keep button and label text un-transformed (no uppercase) — emphasis comes from weight, not case.

### Don't:
- **Don't** add a second unrelated brand hue (e.g. an orange or green "accent") outside the semantic feedback palette.
- **Don't** give a resting card, button, or panel a permanent heavy shadow — depth is earned by interaction, not applied at rest.
- **Don't** fabricate store locations, achievement metrics, or review content anywhere in the UI — per `PRODUCT.md`, these must stay real, business-supplied figures.
- **Don't** mix in a second display typeface; hierarchy is carried entirely by Inter's weight and size range.
