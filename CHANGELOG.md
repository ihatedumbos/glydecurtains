# Changelog

All notable changes to the Glyde Curtains E-Commerce Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Product listing filters (sub-category, color, size, material, price) were silently ignored on
  `/products/public` and mis-bound on `/search/products` because the product "size" filter and
  Spring's `Pageable` page-size query param both used `size`. Filters are now applied via a JPA
  `Specification` and the color/size filter fields were renamed (`colors`/`sizes`, comma-separated)
  to remove the collision and support multi-select.
- Added a visible "Clear All" action next to the active filter chips on the product listing page,
  and the chips now reflect every active filter (sub-category, collection, size, material), not
  just category/color/price.
- Category breadcrumb links (`/categories/:id?sub=:subId`) resulted in "No products in this
  category yet." because `CategoryPage` only matched categories/sub-categories by slug and ignored
  the `sub` query param. It now also matches by numeric ID and reads `sub` as a fallback.
- "Add to Cart" was not wired up anywhere in the storefront (the `addCartItem` thunk was never
  dispatched). Added a working Add to Cart button with quantity selector on the product detail
  page and wired the quick-view "Add to Cart" action on product cards (listing, category, related
  and similar product sections) to actually add items to the cart, with success/error toasts.
- Product cards no longer sit inside a wrapping `<Link>`, which could swallow clicks meant for the
  Add to Cart button; navigation is now handled via an explicit `onClick` so cart actions and
  navigation no longer conflict.
- Product list/category cards now show color and size chips so shoppers can see available
  attributes before opening a product.
- Product images and videos (listing cards, product detail gallery, related/similar products,
  wishlist) now render at a consistent 1:1 square aspect ratio instead of mismatched fixed heights.

### Changed

- Rebranded the app-wide color system: replaced the previous earthy brown/cream palette with a
  premium white / deep-charcoal (`#2F3E46`) / terracotta (`#C27D56`) palette in
  `frontend/src/theme/ThemeProvider.tsx`, and swapped every remaining hardcoded hex reference to
  the old palette (across admin pages, CMS sections, auth pages, customer pages, dashboard charts,
  and `index.css`) so storefront and admin share one consistent theme.
- Removed two admin-only color outliers that previously used stock MUI blue/green/gray instead of
  theme colors: `ProductManagementPage.tsx` thumbnail selection borders and
  `InvoiceManagementPage.tsx` invoice preview background/logo placeholder.

## [1.0.0] - 2025-01-15

### Added

- Full-stack e-commerce platform for Glyde Curtains
- Spring Boot 3.x backend with Java 21 and H2 embedded database
- React 18 frontend with TypeScript, Vite, Redux Toolkit, MUI, and Tailwind CSS
- JWT-based authentication with role-based access control (Super Admin, Admin, Sales Rep, Customer)
- Three-tier permission system: Super Admin bypass → user override → role default
- Product catalog with categories, collections, and advanced filtering
- Shopping cart and order management with status tracking
- Customer enquiry system with assignment workflow
- Admin dashboard with real-time metrics and activity logs
- Employee management with gamification (achievements, leaderboard)
- CMS for banners, pages, and store information
- Invoice generation with PDF export
- Wishlist functionality for customers
- Global search across products, orders, and customers
- Rate limiting and XSS protection
- CORS configuration for frontend-backend communication
- Docker multi-stage build for containerized deployment
- Responsive design with mobile-first approach
- Framer Motion animations and transitions
- Base64 image storage with compression (max 500KB)

### Security

- JWT authentication with 15-minute access tokens
- CSRF protection with double-submit cookie pattern
- Security headers: X-Content-Type-Options, X-Frame-Options, HSTS, CSP
- Input sanitization with OWASP HTML Sanitizer
- Rate limiting: 5 failed login attempts per 15 minutes per IP
- Password hashing with BCrypt

[1.0.0]: https://github.com/glydecurtains/platform/releases/tag/v1.0.0
