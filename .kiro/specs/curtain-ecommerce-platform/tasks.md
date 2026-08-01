# Implementation Plan: Glyde Curtains E-Commerce Platform

## Overview

This plan implements the Phase 1 Glyde Curtains e-commerce platform as a full-stack monolithic application. The backend uses Java 21 with Spring Boot 3.x, H2 embedded database, Spring Security with JWT, and Spring Data JPA. The frontend uses React 18+ with TypeScript, Vite, Redux Toolkit, MUI, Tailwind CSS, and Framer Motion. All images are stored as Base64 in H2. Tasks are ordered for dependency resolution — infrastructure first, then domain modules, then integration.

## Tasks

- [x] 1. Backend project initialization and core infrastructure
  - [x] 1.1 Initialize Spring Boot project with core dependencies
    - Create Maven/Gradle project with Spring Boot 3.x, Java 21
    - Add dependencies: Spring Web, Spring Security, Spring Data JPA, H2, Lombok, Validation, JWT (jjwt)
    - Configure `application.yml` with H2 datasource, JPA DDL-auto, server port
    - Configure CORS for frontend origin (localhost:5173)
    - _Requirements: 17.1, 17.2, 17.7_

  - [x] 1.2 Create global exception handler and API response envelope
    - Implement `ApiResponse<T>` wrapper with status, message, data, timestamp fields
    - Implement `ApiErrorResponse` with status, errorCode, message, fieldErrors, timestamp
    - Implement `PageResponse<T>` wrapper for paginated results
    - Create `GlobalExceptionHandler` with `@ControllerAdvice`
    - Handle: MethodArgumentNotValidException, BusinessException, AccessDeniedException, AuthenticationException, generic Exception
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7_

  - [x] 1.3 Create base entity classes and enums
    - Define enums: UserRole, UserStatus, ProductStatus, OrderStatus, FeedbackStatus, EnquiryStatus, TaskStatus, MetricFormat, PageType, SectionType
    - Create base auditing with `createdAt` and `updatedAt` timestamps
    - _Requirements: 1.1, 5.9, 10.7, 28.1, 29.1, 30.8_

  - [x] 1.4 Implement security configuration and JWT infrastructure
    - Create `JwtTokenProvider` for token generation/validation (HS256, 15-min access, configurable refresh)
    - Create `JwtAuthenticationFilter` extending OncePerRequestFilter
    - Create `SecurityConfig` with filter chain, CSRF (double-submit cookie), security headers
    - Add security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS, CSP
    - Create `RateLimitFilter` with ConcurrentHashMap-based IP tracking (5 attempts / 15 min)
    - _Requirements: 2.1, 2.2, 2.5, 2.6, 18.1, 18.2, 18.3, 18.5, 18.7, 18.8_

  - [x] 1.5 Implement permission evaluator and RBAC infrastructure
    - Create `Permission`, `RolePermission`, `UserPermission` entities
    - Create `PermissionEvaluator` with three-tier resolution: Super Admin bypass → user override → role default → implicit deny
    - Create custom `@RequiresPermission(entity, operation)` annotation
    - Wire evaluator into Spring Security filter chain
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.8, 3.9, 33.1, 33.4, 33.5, 33.6, 33.9_

  - [x] 1.6 Implement input sanitization and validation utilities
    - Create `@Sanitize` annotation and AOP aspect for XSS prevention
    - Integrate OWASP Java HTML Sanitizer for rich text fields
    - Create `ImageCompressor` utility for Base64 compression (max 500KB, min 100x100px)
    - Create `SlugGenerator` utility for URL-friendly slugs
    - _Requirements: 18.1, 18.4, 18.10, 32.3, 32.4_

  - [x] 1.7 Configure i18n message source for backend
    - Create `messages.properties` (English), `messages_hi.properties` (Hindi), `messages_gu.properties` (Gujarati)
    - Implement `LocaleConfig` with AcceptHeaderLocaleResolver
    - Ensure validation errors and system messages return in requested language
    - _Requirements: 37.5, 37.6_

- [x] 2. Checkpoint - Ensure backend compiles and security tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Authentication and user management domain
  - [x] 3.1 Implement User, RefreshToken, PasswordResetToken entities
    - Create `User` entity with all fields (id, name, email, password, role, status, rememberMe, preferredLanguage, createdAt, updatedAt)
    - Create `RefreshToken` entity with token, userId, expiryDate
    - Create `PasswordResetToken` entity with token, userId, expiryDate, used flag
    - Create corresponding JPA repositories
    - _Requirements: 1.1, 2.1, 2.7, 2.8, 4.1, 37.3_

  - [x] 3.2 Implement AuthService and AuthController
    - Implement `register()`: validate fields, check duplicate email (case-insensitive), hash password (BCrypt cost 10), create user with PENDING status
    - Implement `login()`: validate credentials, check status APPROVED, check account lockout (5 attempts / 15 min), issue JWT + refresh token (24h or 30d based on rememberMe)
    - Implement `refreshToken()`: validate refresh token, issue new access token
    - Implement `logout()`: invalidate refresh token
    - Implement `requestPasswordReset()`: generate 15-min token, return generic success regardless of email existence
    - Implement `resetPassword()`: validate token, update password, set `passwordChangedAt`, invalidate sessions
    - Implement password change from profile: validate old password, update to new, set `passwordChangedAt`
    - Create `AuthController` with endpoints: POST /api/auth/register, login, refresh, logout, forgot-password, reset-password, change-password
    - _Requirements: 1.1-1.9, 2.1-2.11, 4.1-4.4, 39.4_

  - [x] 3.3 Implement UserService and UserController
    - Implement user listing with pagination, filtering by name/email/status/role/date
    - Implement approve, reject, suspend, activate, deactivate user flows
    - Implement role change and password reset for users
    - Implement audit logging for all status changes
    - Create `UserController` with endpoints per design: GET/PUT /api/users/*
    - _Requirements: 1.3, 1.4, 1.7, 15.1-15.7_

  - [x] 3.4 Implement PermissionService and PermissionController
    - Implement `getPermissionMatrix()`: return full entity × CRUD grid for all roles
    - Implement `updateRolePermissions()`: update role-level CRUD grants
    - Implement `updateUserPermissions()`: set per-user overrides
    - Implement `getUserPermissions()`: return resolved permission set
    - Implement `getMyPermissions()`: return current user's resolved permissions
    - Create `PermissionController` with endpoints: GET/PUT /api/permissions/*
    - _Requirements: 3.7, 3.8, 3.10, 3.11, 33.2, 33.3, 33.6, 33.7, 33.8, 33.10_

  - [x] 3.5 Write unit tests for auth and permission services
    - Test registration validation (duplicate email, password strength, field validation)
    - Test login flows (approved, pending, rejected, suspended, locked)
    - Test JWT generation and refresh token lifecycle
    - Test permission resolution (super admin bypass, user override, role default, implicit deny)
    - _Requirements: 1.1-1.9, 2.1-2.11, 3.1-3.11, 33.1-33.10_

- [x] 4. Product catalog and category domain
  - [x] 4.1 Implement Product, ProductImage, ProductSpecification, ProductVariant entities
    - Create `Product` entity with all fields per design (name, SKU, barcode, descriptions, category refs, material, pattern, colors JSON, sizes JSON, dimensions, stock, pricing, status flags, tags, SEO fields)
    - Create `ProductImage` entity with base64Data (CLOB), mimeType, isThumbnail, sortOrder
    - Create `ProductSpecification` entity with specKey, specValue, sortOrder
    - Create `ProductVariant` entity with material, size, color, price, stockQuantity
    - Create JPA repositories for all product entities
    - _Requirements: 5.9, 5.10, 31.5_

  - [x] 4.2 Implement Category, SubCategory, Collection entities
    - Create `Category` entity with name, description, iconBase64, imageBase64, sortOrder, isVisible, isActive
    - Create `SubCategory` entity with name, categoryId FK, sortOrder, isActive
    - Create `Collection` entity with name, description, imageBase64, isActive
    - Create JPA repositories
    - _Requirements: 6.1, 6.2, 6.5_

  - [x] 4.3 Implement ProductService and ProductController
    - Implement CRUD: create, update, delete, archive, activate, deactivate products
    - Implement SKU uniqueness enforcement
    - Implement specification key-value CRUD
    - Implement variant pricing matrix CRUD
    - Implement related products (same category) and similar products (shared attributes) queries
    - Implement product flag management (featured, trending, new arrival, best seller, premium)
    - Create `ProductController` with all endpoints per design
    - _Requirements: 5.1-5.12, 31.5, 31.10_

  - [x] 4.4 Implement CategoryService and CategoryController
    - Implement category CRUD with sort order management
    - Implement sub-category CRUD linked to parent categories
    - Implement collection CRUD
    - Implement visibility toggle and active status management
    - Prevent deletion of categories with associated products
    - Create `CategoryController` with all endpoints per design
    - _Requirements: 6.1-6.8_

  - [x] 4.5 Implement SearchService and search endpoint
    - Implement product name search with relevance ordering
    - Implement multi-filter support (category, sub-category, color, size, material, collection, price range, availability)
    - Implement sort options (popularity, newest, price asc/desc, featured)
    - Implement autocomplete suggestions (min 2 chars)
    - Implement recent searches storage (max 10 per authenticated user)
    - Exclude deactivated/archived products from results
    - Search across multi-language content (TranslatedContent table)
    - Create `SearchController` with GET /api/search/products, /autocomplete, /recent
    - _Requirements: 7.1-7.8, 37.10_

  - [x] 4.6 Implement ImageService (MediaService) and ImageController with video support
    - Implement image upload: validate format (JPEG, PNG, WebP, SVG), validate size (max 5MB raw)
    - Implement video upload: validate format (MP4, WebM), validate size (max 10MB), validate duration (max 10 seconds)
    - Implement compression: raster images to max 500KB, min 100x100px; SVG stored as-is; videos compressed
    - Implement Base64 encoding and storage with metadata (mediaType discriminator: IMAGE vs VIDEO, duration field for videos)
    - Implement image/video retrieval with Cache-Control header (max-age 86400)
    - Add `mediaType` enum (IMAGE, VIDEO) and `duration` field to ProductImage entity
    - Implement server-side video duration extraction and validation
    - Create `ImageController` with POST /api/images/upload, POST /api/images/upload-video, GET /{id}, DELETE /{id}
    - _Requirements: 32.1-32.10, 38.6, 38.10_

  - [x] 4.7 Implement TranslatedContent entity and multi-language product support
    - Create `TranslatedContent` entity (entityType, entityId, fieldName, language, content)
    - Extend ProductService to store/retrieve translations for product fields
    - Implement fallback logic: requested language → English default
    - _Requirements: 37.7, 37.8_

  - [x] 4.8 Write unit tests for product and category services
    - Test product CRUD operations and SKU uniqueness
    - Test category deletion prevention when products exist
    - Test search filtering and sorting logic
    - Test image compression and validation
    - _Requirements: 5.1-5.12, 6.1-6.8, 7.1-7.8, 32.1-32.10_

- [x] 5. Checkpoint - Ensure product catalog domain tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Cart, order, and wishlist domain
  - [x] 6.1 Implement Cart and CartItem entities
    - Create `Cart` entity with userId (unique), updatedAt
    - Create `CartItem` entity with cartId, productId, variantId (optional), quantity, unitPrice, addedAt
    - Create JPA repositories
    - _Requirements: 9.1, 34.1, 34.7_

  - [x] 6.2 Implement CartService and CartController
    - Implement `getCart()`: retrieve persisted cart for authenticated user
    - Implement `addItem()`: validate stock, persist item with variant and price snapshot
    - Implement `updateItemQuantity()`: validate stock, recalculate totals
    - Implement `removeItem()`: remove and recalculate
    - Implement `clearCart()`: remove all items
    - Flag unavailable/deactivated products on cart retrieval
    - Auto-remove items older than 90 days
    - Create `CartController` with endpoints per design
    - _Requirements: 9.1-9.10, 34.1-34.7_

  - [x] 6.3 Implement Order, OrderItem, OrderStatusHistory entities
    - Create `Order` entity with orderNumber (auto-generated GC-YYYYMMDD-NNNN), userId, status, subtotal, grandTotal, assignedEmployeeId, timestamps
    - Create `OrderItem` entity with orderId, productId, variantId, productName (snapshot), quantity, unitPrice (snapshot), subtotal
    - Create `OrderStatusHistory` entity with orderId, fromStatus, toStatus, changedBy, changedAt, notes
    - Create JPA repositories
    - _Requirements: 10.7_

  - [x] 6.4 Implement OrderService and OrderController
    - Implement `placeOrder()`: create order from cart, deduct stock, generate order number, clear cart
    - Implement order status lifecycle: Pending → Confirmed → Packed → Dispatched → Delivered
    - Implement `cancelOrder()`: only from Pending/Confirmed, restore stock
    - Implement `getMyOrders()`: paginated customer order history
    - Implement `getAllOrders()`: paginated admin view with filters (status, date range, customer)
    - Implement `assignEmployee()`: assign employee to order
    - Record all status changes in OrderStatusHistory
    - Create `OrderController` with endpoints per design
    - _Requirements: 10.1-10.8, 11.1-11.5_

  - [x] 6.5 Implement WishlistService and WishlistController
    - Create `WishlistItem` entity with userId, productId, addedAt, unique constraint on (userId, productId)
    - Implement add, remove, getWishlist, moveToCart, getCount
    - Create `WishlistController` with endpoints per design
    - _Requirements: 36.1-36.7_

  - [x] 6.6 Write unit tests for cart, order, and wishlist services
    - Test cart persistence and server-side state management
    - Test order placement with stock deduction and cart clearing
    - Test order status transitions (valid and invalid)
    - Test wishlist unique constraint and move-to-cart flow
    - _Requirements: 9.1-9.10, 10.1-10.8, 34.1-34.7, 36.1-36.7_

- [x] 7. Employee, store, feedback, achievements, and enquiry domains
  - [x] 7.1 Implement Employee, Department, Task entities
    - Create `Department` entity with name, description
    - Extend User with employee-specific fields (departmentId, hireDate)
    - Create `Task` entity with title, description, assignedToId, assignedById, status
    - Create JPA repositories
    - _Requirements: 12.1, 12.6, 12.7_

  - [x] 7.2 Implement EmployeeService and EmployeeController
    - Implement employee CRUD with permission assignment
    - Implement employee creation by Super Admin/Admin: set initial password, create as APPROVED, assign role and department (bypasses approval workflow)
    - Implement suspend, activate, delete (soft deactivation)
    - Implement department assignment and task assignment
    - Default: no permissions on creation until Admin explicitly grants
    - Create `EmployeeController` with endpoints per design
    - _Requirements: 12.1-12.8, 3.11, 39.5, 39.6_

  - [x] 7.3 Implement StoreLocation entity, StoreService, and StoreController
    - Create `StoreLocation` entity with name, address, city, state, phone, email, latitude, longitude, operatingHours (JSON), imageBase64, isActive
    - Implement CRUD with validation (required fields, phone/email format)
    - Implement customer search by city/area (case-insensitive partial match on city, state, address)
    - Implement paginated listing (20 per page)
    - Create `StoreController` with endpoints per design
    - _Requirements: 27.1-27.10_

  - [x] 7.4 Implement Feedback entity, FeedbackService, and FeedbackController
    - Create `Feedback` entity with userId, productId (optional), rating (1-5), title, comment, status (PENDING_REVIEW, APPROVED, REJECTED), adminReply, repliedById
    - Implement submit (one per product per customer), approve, reject, reply
    - Implement product feedback listing (approved only, paginated 10/page)
    - Calculate average rating (rounded to 1 decimal)
    - Create `FeedbackController` with endpoints per design
    - _Requirements: 29.1-29.11_

  - [x] 7.5 Implement Achievement entity, AchievementService, and AchievementController
    - Create `Achievement` entity with title, description, iconBase64, year, metricValue, metricFormat, sortOrder, isEnabled
    - Implement CRUD, reorder, toggle visibility
    - Validate field constraints (title max 100, description max 500, icon max 2MB, year 1900-current)
    - Create `AchievementController` with endpoints per design
    - _Requirements: 30.1-30.10_

  - [x] 7.6 Implement Enquiry entity, EnquiryService, and EnquiryController
    - Create `Enquiry` entity with name, email, phone, subject, message, status (NEW, IN_PROGRESS, RESOLVED, CLOSED)
    - Create `EnquiryResponse` entity with enquiryId, responderId, message, createdAt
    - Implement submit with validation, status transitions (New→InProgress→Resolved/Closed)
    - Implement search by name/email/subject, pagination (20/page)
    - Create `EnquiryController` with endpoints per design
    - _Requirements: 28.1-28.10, 25.3_

  - [x] 7.7 Write unit tests for employee, store, feedback, achievement, and enquiry services
    - Test employee permission assignment and default-no-access behavior
    - Test store search case-insensitive partial matching
    - Test feedback one-per-product constraint and rating calculation
    - Test enquiry status transition validations
    - _Requirements: 12.1-12.8, 27.1-27.10, 28.1-28.10, 29.1-29.11, 30.1-30.10_

- [x] 8. CMS, dashboard, and activity logging domain
  - [x] 8.1 Implement CMS entities (HomepageSection, Banner, SiteSettings, StaticPage, ThemePreset)
    - Create `HomepageSection` entity with sectionType enum (19 section types), title, isEnabled, sortOrder, config (JSON)
    - Create `Banner` entity with sectionId, title, subtitle, imageBase64, buttonText, buttonLink, sortOrder, isActive
    - Create `SiteSettings` entity (single row) with logo fields, contact info, socialLinks JSON, announcementBar, activeThemeId
    - Create `StaticPage` entity with title, slug (unique), content, pageType enum, isVisible, versionTimestamp
    - Create `ThemePreset` entity with name, config (JSON), isDefault, isActive
    - Create JPA repositories
    - _Requirements: 13.6, 23.1, 23.6, 24.7, 25.4_

  - [x] 8.2 Implement CmsService and CmsController
    - Implement homepage section management: get enabled, get all, update, reorder
    - Implement banner CRUD (hero and promotional)
    - Implement site settings get/update (logos, favicon, contact, social, announcement)
    - Implement static page CRUD with slug-based access
    - Implement page visibility management (hidden returns 404)
    - Implement scrolling ticker configuration
    - Support multi-language content via TranslatedContent for pages, banners, sections
    - Create `CmsController` with endpoints per design
    - _Requirements: 13.1-13.11, 24.1-24.7, 25.1-25.7, 37.12, 37.13_

  - [x] 8.3 Implement ThemeService within CMS
    - Implement 5 theme presets: Dark Premium (default), Light Elegant, Midnight Blue, Warm Gold, Forest Green
    - Each preset stores JSON config: primaryColor, secondaryColor, accentColor, backgroundColor, textColor, borderRadius, shadowIntensity, glassmorphismOpacity, animationSpeed
    - Implement activate theme, update theme config, preview theme
    - Create theme endpoints within CmsController per design
    - _Requirements: 23.1-23.6_

  - [x] 8.4 Implement ActivityLog entity and logging service
    - Create `ActivityLog` entity with userId, actionType, entityType, entityId, details (JSON), ipAddress, timestamp
    - Create ActivityLogRepository
    - Implement logging for: auth events, admin actions, order lifecycle events
    - Implement paginated log retrieval with filtering (action type, user, date range, module)
    - Create activity-logs endpoint: GET /api/activity-logs
    - _Requirements: 26.1-26.6_

  - [x] 8.5 Implement DashboardService and DashboardController
    - Implement `getSummary()`: total orders, products, users, employees, pending approvals, low stock count, revenue, enquiries
    - Implement `getRecentActivity()`: latest orders, user registrations, product updates, logins
    - Implement chart data: order trends, revenue trends, user trends (7d/30d/90d/1y)
    - Implement `getLowStockProducts()`: products below configurable threshold (default 10)
    - Implement reports: sales, user activity, inventory, profit/loss (placeholder), enquiry
    - Report data in structured JSON format (export placeholder)
    - Create `DashboardController` with endpoints per design
    - _Requirements: 14.1-14.10_

  - [x] 8.6 Implement InvoiceService, InvoiceController, and invoice template
    - Create `InvoiceSettings` entity (single row): companyName, companyAddress, companyPhone, companyEmail, taxRegistrationNumber, footerText, termsText, numberFormat, includeLogoOnInvoice, enableCustomerDownload, nextSequenceNumber
    - Create `GeneratedInvoice` entity: orderId (unique FK), invoiceNumber (unique), pdfBase64 (CLOB), generatedAt, generatedBy
    - Create Thymeleaf invoice HTML template (A4 layout: logo, company info, customer info, line items with variant details, grand total, terms, footer)
    - Implement PDF generation using Flying Saucer (xhtmlrenderer) + OpenPDF: render Thymeleaf template → convert to PDF → encode as Base64
    - Use bundled `logo/logo.jpg` or Admin-uploaded logo in invoice header based on settings
    - Implement `generateInvoice(orderId)`: generate PDF, auto-generate invoice number (INV-YYYYMMDD-NNNN), store as Base64 in DB
    - Implement `getInvoice(orderId)`: return cached PDF if exists, or generate on demand
    - Implement `bulkGenerateInvoices(orderIds)`: generate invoices for multiple orders
    - Implement invoice settings CRUD (get/update)
    - Enforce CRUD_Permission on "invoices" entity for all operations
    - Create `InvoiceController` with endpoints: POST /api/invoices/orders/{orderId}/generate, GET /api/invoices/orders/{orderId}, POST /api/invoices/bulk-generate, GET /api/invoices/settings, PUT /api/invoices/settings
    - _Requirements: 41.1-41.12_

  - [x] 8.7 Write unit tests for CMS, dashboard, invoice, and activity logging
    - Test homepage section reordering and visibility toggling
    - Test static page slug uniqueness and visibility behavior
    - Test theme activation and preview flow
    - Test dashboard summary calculations
    - Test invoice PDF generation and caching
    - Test invoice number sequential generation
    - _Requirements: 13.1-13.11, 14.1-14.10, 23.1-23.6, 26.1-26.6, 41.1-41.12_

- [x] 9. Database seeding
  - [x] 9.1 Implement DataSeeder component
    - Create `@Component` DataSeeder implementing `CommandLineRunner`
    - Seed ONLY one default Super Admin account: email "admin@glydecurtains.com", password "admin123" (BCrypt hashed), status APPROVED, role SUPER_ADMIN — password "admin123" is an exception to normal strength rules for initial seed only
    - Add `passwordChangedAt` field to User entity (nullable) — null indicates password has never been changed
    - Seed categories: Curtains, Curtain Rods, Tracks, Accessories, Blinds Accessories with sub-categories
    - Seed products: 3 curtain, 2 rod, 2 track, 2 accessory products with Base64 sample images, descriptions, specs, variants
    - Seed default permissions for Super Admin role (all granted); add "invoices", "dashboard", and "reports" to managed entity list in permission matrix; grant Admin "Read" on dashboard and reports by default
    - Seed homepage configuration with all sections enabled, sample banners
    - Seed 5 theme presets with complete JSON configs
    - Seed sample store locations, achievements, testimonials
    - Seed default invoice settings (company name "Glyde Curtains", site URL "https://glydecurtains.com", enableCustomerDownload true, includeLogoOnInvoice true, default number format INV-{YYYYMMDD}-{NNNN})
    - Do NOT seed other user accounts (no Admin, Employee, or Customer) — Super Admin creates them post-login
    - Seed sample orders are NOT created (no other users exist yet)
    - Ensure NO references to AI tools in any seeded content
    - _Requirements: 19.1-19.6, 35.1-35.5, 39.1, 39.2, 39.7, 39.8, 41.4_

- [x] 10. Checkpoint - Ensure entire backend compiles and all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Frontend project initialization and core infrastructure
  - [x] 11.1 Initialize React + TypeScript + Vite project
    - Create Vite project with React + TypeScript template
    - Install dependencies: MUI, Tailwind CSS, Framer Motion, Redux Toolkit, React Router v6, Axios, react-i18next, React Hook Form
    - Configure Tailwind with custom theme integration
    - Configure path aliases and project structure per design
    - Copy `logo/logo.jpg` from project root to `public/assets/logo/logo.jpg` as bundled default logo
    - _Requirements: 16.1, 16.3, 40.1_

  - [x] 11.2 Set up Redux store with all slices
    - Create store configuration with all slices: auth, cart, products, orders, wishlist, search, cms, theme, ui, employees, dashboard, storeLocator, feedback, achievements, enquiries, permissions
    - Create typed hooks (useAppDispatch, useAppSelector)
    - Implement localStorage persistence for auth tokens and theme preference
    - _Requirements: 20.1-20.7_

  - [x] 11.3 Configure Axios instance with interceptors
    - Create axiosInstance with base URL configuration
    - Implement request interceptor: attach JWT from Redux store
    - Implement response interceptor: on 401 attempt token refresh, retry original request; on refresh failure redirect to login
    - Implement `Accept-Language` header injection based on selected language
    - Implement global error handling with toast notifications
    - _Requirements: 2.3, 2.5, 17.1, 37.6_

  - [x] 11.4 Set up i18n with react-i18next
    - Create i18n directory structure: locales/en/, locales/hi/, locales/gu/
    - Create translation files: common.json, auth.json, products.json, cart.json, orders.json, admin.json, validation.json for each language
    - Configure i18next with fallback to English, localStorage detection
    - Create LanguageSwitcher component for navigation bar
    - _Requirements: 37.1, 37.2, 37.4, 37.5, 37.9_

  - [x] 11.5 Set up ThemeProvider with MUI + Tailwind integration
    - Create ThemeProvider wrapping MUI ThemeProvider
    - Implement CSS variable injection from active theme config
    - Create 5 theme preset configs matching backend definitions
    - Implement dark/light mode toggle with smooth transition
    - Persist theme preference in localStorage
    - _Requirements: 16.1, 16.2, 23.2, 23.4_

  - [x] 11.6 Set up React Router with route protection
    - Create AppRoutes with all public, customer, and admin routes
    - Create ProtectedRoute component (redirects unauthenticated to login)
    - Create AdminRoute component (checks role/permissions, redirects to 403)
    - Implement route-based code splitting with React.lazy and Suspense
    - _Requirements: 18.6, 21.1_

  - [x] 11.7 Create layout components (Header, Footer, Sidebar, MegaMenu)
    - Create sticky Header with bundled logo (`/assets/logo/logo.jpg` fallback, CMS override if uploaded), mega menu, search bar, cart badge, wishlist icon, language switcher, profile menu
    - Implement logo resolver: check CMS siteSettings for custom logo → fallback to bundled logo.jpg; size header logo 48-56px desktop, 32-40px mobile
    - Create MegaMenu dropdown with categories and sub-categories
    - Create responsive hamburger menu with slide-out drawer for mobile/tablet
    - Create Footer with logo (36-44px, slight opacity), contact info, social links, quick links, category links, newsletter placeholder
    - Create Admin Sidebar with logo (36-44px compact) and role-based navigation links
    - Implement breadcrumb component
    - Apply elegant logo styling: subtle shadow on dark backgrounds, proper spacing, rounded corners if appropriate
    - _Requirements: 16.7, 21.1-21.6, 40.2, 40.3, 40.5, 40.7, 40.8, 40.9_

  - [x] 11.8 Implement MediaPicker component (file/image/video picker)
    - Create MediaPicker component with native file input dialog and drag-and-drop DropZone
    - Implement file type filtering (images: JPEG, PNG, WebP, SVG; videos: MP4, WebM)
    - Implement client-side validation: file format, size (5MB images, 10MB videos), video duration (max 10 seconds via HTMLVideoElement.duration)
    - Implement file preview (image thumbnails, video player preview) before upload confirmation
    - Implement multi-file selection with individual previews and remove buttons
    - Implement drag-and-drop with visual drop zone highlight
    - Implement upload progress indicator during Base64 encoding and server submission
    - Implement MediaGallery for viewing existing uploaded media with reorder, delete, replace
    - Display inline error messages when validation constraints are violated
    - _Requirements: 38.1-38.11_

- [x] 12. Checkpoint - Ensure frontend compiles and renders base layout
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Frontend authentication pages
  - [x] 13.1 Implement Login page
    - Create login form with email, password, remember me checkbox
    - Display bundled logo prominently at top of login card (80-120px, centered)
    - Integrate React Hook Form with validation (email format, password required)
    - Dispatch login async thunk, handle success (store tokens, redirect), handle errors (display messages)
    - Handle account locked state display
    - After successful login, check if `passwordChangedAt` is null — if so, display prominent banner recommending immediate password change (especially for default Super Admin first login)
    - Apply premium dark theme styling with glassmorphism card
    - _Requirements: 1.2, 1.9, 2.1, 2.7, 2.8, 2.9, 2.11, 16.1, 22.1, 22.2, 39.3, 40.4_

  - [x] 13.2 Implement Register page
    - Create registration form with name, email, password, confirm password, preferred language selector
    - Validate: name 1-100 chars, valid email, password strength (8+ chars, upper, lower, digit, special)
    - Display field-specific validation errors from frontend and backend
    - Show success message about pending approval after registration
    - _Requirements: 1.1, 1.5, 1.6, 1.8, 22.1, 22.2, 22.3, 22.4, 37.3_

  - [x] 13.3 Implement Forgot Password and Reset Password pages
    - Create forgot password form with email input
    - Display generic success message regardless of email existence
    - Create reset password form with token (from URL), new password, confirm password
    - Handle expired/invalid token errors
    - _Requirements: 4.1-4.4_

- [x] 14. Frontend product catalog pages
  - [x] 14.1 Implement Product List page with filters and search
    - Create product grid with responsive layout (4 cols desktop, 3 laptop, 2 tablet, 1 mobile)
    - Implement filter sidebar: category, sub-category, color, size, material, collection, price range, availability
    - Implement sort dropdown: popularity, newest, price low-to-high, price high-to-low, featured
    - Implement search bar with autocomplete suggestions (2+ chars)
    - Implement pagination
    - Display recent searches for authenticated users
    - Implement skeleton loading during fetch
    - _Requirements: 7.1-7.8, 8.6, 16.3, 16.5, 37.11_

  - [x] 14.2 Implement ProductCard component with quick-view popup
    - Create ProductCard with image, name, price, discount badge, wishlist heart icon
    - Implement hover quick-view popup (300ms delay trigger, 300ms dismiss delay)
    - Display variant selection (material, size, color) with first available pre-selected
    - Implement dynamic price update on variant selection (<500ms)
    - Display "Price on request" for unconfigured variant combinations
    - Implement Add to Cart button in quick-view
    - Animate popup entrance (scale-up + fade-in 150-300ms) and exit (scale-down + fade-out 150-300ms)
    - Implement premium hover effects (soft glow, smooth shadows)
    - _Requirements: 31.1-31.11, 16.8_

  - [x] 14.3 Implement Product Detail page
    - Display product name, image gallery with thumbnails, price, discount, descriptions
    - Implement image zoom on hover for main image
    - Display specifications table (key-value pairs)
    - Display material, colors, sizes, availability
    - Update availability display on color/size selection
    - Display Related Products and Similar Products sections
    - Implement breadcrumb: Home > Category > Sub-Category > Product Name
    - Display approved feedback/reviews with star ratings
    - Implement lazy loading for images
    - _Requirements: 8.1-8.7, 16.6, 29.7, 29.11_

  - [x] 14.4 Implement Wishlist functionality on product pages
    - Display filled/empty heart icon based on wishlist status
    - Toggle wishlist on heart click
    - Update wishlist badge count in navigation
    - _Requirements: 36.2, 36.5, 36.6_

- [x] 15. Frontend cart and order pages
  - [x] 15.1 Implement Cart page and CartDrawer
    - Create cart page with item list (image, name, variant, quantity selector, unit price, line subtotal)
    - Implement quantity update and item removal
    - Display grand total
    - Flag unavailable items with notification
    - Implement cart badge in navigation showing total item count
    - Synchronize Redux cart state with backend on every operation
    - _Requirements: 9.1-9.10, 34.4_

  - [x] 15.2 Implement Order Placement and Order History pages
    - Create place order flow from cart (confirm → success page with order number)
    - Create My Orders page with paginated order list (status, date, total)
    - Create Order Detail page with line items, status timeline, cancel button (Pending/Confirmed only)
    - Display "Download Invoice" button on order detail when order status is Confirmed or later AND invoiceSettings.enableCustomerDownload is true; trigger PDF download on click
    - _Requirements: 10.1-10.8, 41.2, 41.6_

  - [x] 15.3 Implement Wishlist page
    - Display wishlist items with product image, name, price, availability, date added
    - Implement remove from wishlist
    - Implement "Move to Cart" button
    - _Requirements: 36.1-36.7_

- [x] 16. Frontend customer pages
  - [x] 16.1 Implement Customer Profile page
    - Display and edit user profile (name, email, preferred language)
    - Implement password change form
    - _Requirements: 15.3, 37.3_

  - [x] 16.2 Implement Feedback submission page
    - Create feedback form with star rating (1-5 whole stars), title (3-100 chars), comment (10-2000 chars), optional product reference
    - Validate constraints client-side and display backend validation errors
    - Show success message on submission
    - _Requirements: 29.1, 29.2, 29.9, 29.10, 29.11_

  - [x] 16.3 Implement Store Locator page
    - Display paginated list of active stores (20/page) with name, address, city, state, phone, email, operating hours
    - Implement search by city/area
    - Display "no stores found" message for empty results
    - _Requirements: 27.4, 27.5, 27.6, 27.10_

  - [x] 16.4 Implement static pages (About Us, Contact Us, Terms, Privacy)
    - Create dynamic page renderer from CMS content (by slug)
    - Implement Contact Us form with validation (name, email, phone optional, subject, message)
    - Submit enquiry on Contact Us form submission
    - _Requirements: 25.1-25.7, 28.1, 28.7, 28.8_

- [x] 17. Frontend homepage and CMS-driven content
  - [x] 17.1 Implement Homepage with all CMS sections
    - Render homepage sections dynamically based on CMS configuration and sort order
    - Implement Hero Banner Slider with auto-rotation and navigation
    - Implement Promotional Banner section
    - Implement product sections: Featured, Latest, New Arrivals, Best Selling, Trending, Recently Added, Recommended, Featured Accessories, Seasonal, Premium Collections
    - Implement Popular Categories section with category icons
    - Implement Customer Testimonials section
    - Implement Brand Story section
    - Implement Achievements section with animated counters (count-up on viewport enter, 2s duration)
    - Implement Newsletter placeholder section
    - Implement scrolling ticker/marquee at top (right-to-left continuous scroll, configurable content/speed)
    - Apply Framer Motion page transitions and section animations
    - _Requirements: 13.1-13.11, 16.4, 30.6, 30.9_

  - [x] 17.2 Implement Achievements page
    - Display all active achievements in detailed layout with title, description, icon, year, metric
    - Animate metric values with count-up effect on viewport intersection
    - Support metric formats: numeric suffix, plain text, percentage
    - _Requirements: 30.6, 30.7, 30.8, 30.9_

- [x] 18. Checkpoint - Ensure frontend customer-facing pages render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Frontend admin panel - Dashboard and user management
  - [x] 19.1 Implement Admin Dashboard page
    - Display summary cards: total orders, products, users, employees, pending approvals, low stock, revenue, enquiries
    - Display recent activity feed (orders, registrations, product updates, logins)
    - Implement chart components for order trends, revenue trends, user trends (7d/30d/90d/1y selectors)
    - Display low stock alerts
    - _Requirements: 14.1-14.4_

  - [x] 19.2 Implement Admin Reports page
    - Implement sales report with date range filter
    - Implement user activity report
    - Implement inventory report
    - Implement profit/loss report (placeholder)
    - Implement enquiry report
    - Add export placeholder buttons (structured JSON)
    - _Requirements: 14.5-14.10_

  - [x] 19.3 Implement Admin User Management page
    - Display paginated user list with search (name, email, status)
    - Implement filter by role, status, registration date range
    - Implement approve, reject, suspend, activate, deactivate actions
    - Implement role change dropdown
    - Implement password reset button
    - Display audit log of status changes
    - _Requirements: 15.1-15.7_

  - [x] 19.4 Implement Admin Permission Matrix page
    - Display grid: entities (rows) × CRUD operations (columns) per role
    - Implement toggle controls for each permission cell
    - Implement per-user override interface
    - Show Super Admin as always-granted and non-editable
    - _Requirements: 3.7, 3.10, 33.2, 33.7_

- [x] 20. Frontend admin panel - Product and category management
  - [x] 20.1 Implement Admin Product Management page
    - Display paginated product list with search and filter
    - Implement product creation form with all fields (name, SKU, descriptions, category, pricing, stock, flags, SEO, tags)
    - Implement multi-image and video upload using MediaPicker component with thumbnail selection, sort order, and drag-and-drop
    - Implement specification key-value pair editor (add/remove custom fields)
    - Implement variant pricing matrix editor (material × size × color → price)
    - Implement product status actions: archive, activate, deactivate, delete
    - Implement multi-language content tabs (EN | HI | GU) for product fields
    - _Requirements: 5.1-5.12, 31.10, 37.7, 37.13, 38.1-38.3, 38.7, 38.8, 38.11_

  - [x] 20.2 Implement Admin Category Management page
    - Display category tree with drag-to-reorder
    - Implement category CRUD form (name, description, icon, image)
    - Implement sub-category CRUD linked to parent
    - Implement visibility toggle and active status
    - Implement collection management section
    - _Requirements: 6.1-6.8_

- [x] 21. Frontend admin panel - Orders and employees
  - [x] 21.1 Implement Admin Order Management page
    - Display paginated order list with filters (status, date range, customer)
    - Implement search by order number or customer name
    - Implement order detail view with line items, customer info, status history
    - Implement status update dropdown (Pending → Confirmed → Packed → Dispatched → Delivered)
    - Implement employee assignment to orders
    - Implement "Generate Invoice" button on order detail page (calls POST /api/invoices/orders/{orderId}/generate)
    - Implement bulk invoice generation: checkboxes on order list + "Generate Invoices" bulk action button
    - _Requirements: 11.1-11.5, 41.1, 41.8_

  - [x] 21.2 Implement Admin Employee Management page
    - Display paginated employee list with search and filter
    - Implement employee creation form (name, email, initial password, department, permissions) — account created as APPROVED with assigned role (bypasses approval workflow)
    - Implement permission assignment UI (module-level CRUD toggles)
    - Implement department assignment and task assignment
    - Implement suspend, activate, delete actions
    - _Requirements: 12.1-12.8, 39.5, 39.6_

- [x] 22. Frontend admin panel - CMS, stores, feedback, achievements, enquiries
  - [x] 22.1 Implement Admin CMS Homepage Management page
    - Display all homepage sections with enable/disable toggles
    - Implement drag-to-reorder sections
    - Implement banner management (hero and promotional): add, edit, delete with MediaPicker for image/video upload
    - Implement section config editors (title, content source, visibility)
    - Implement scrolling ticker configuration (speed, content source)
    - Support multi-language content tabs for banners and sections
    - _Requirements: 13.1-13.11, 37.12, 38.1-38.3, 38.7_

  - [x] 22.2 Implement Admin Site Settings page
    - Implement logo management: header, footer, mobile, admin, favicon uploads
    - Implement contact info editor (email, phone, address)
    - Implement social links editor
    - Implement announcement bar editor
    - Validate image formats (PNG, SVG, JPEG, WebP) and size (max 2MB)
    - _Requirements: 24.1-24.7_

  - [x] 22.3 Implement Admin Theme Management page
    - Display available theme presets with preview cards
    - Implement theme activation button
    - Implement theme customization form (colors, border radius, shadows, glassmorphism, animation speed)
    - Implement live preview before applying
    - _Requirements: 23.1-23.6_

  - [x] 22.4 Implement Admin Static Pages Management
    - Display page list with create/edit/delete actions
    - Implement rich text editor for page content
    - Implement slug management and visibility toggle
    - Implement page type selection (About Us, Contact Us, Terms, Privacy Policy, Custom)
    - Support multi-language content tabs
    - _Requirements: 25.1-25.7, 37.12_

  - [x] 22.5 Implement Admin Store Management page
    - Display paginated store list with search by city/state
    - Implement store CRUD form (name, address, city, state, phone, email, operating hours, image)
    - Validate required fields and phone/email formats
    - _Requirements: 27.1-27.3, 27.7-27.9_

  - [x] 22.6 Implement Admin Feedback Management page
    - Display paginated feedback list with filters (status, rating, product)
    - Implement approve, reject actions
    - Implement reply form for admin responses
    - _Requirements: 29.3-29.6_

  - [x] 22.7 Implement Admin Achievement Management page
    - Display achievement list with drag-to-reorder
    - Implement achievement CRUD form (title, description, icon upload, year, metric value, format)
    - Implement enable/disable toggle
    - _Requirements: 30.1-30.5, 30.10_

  - [x] 22.8 Implement Admin Enquiry Management page
    - Display paginated enquiry list with status filter and search
    - Implement enquiry detail view with response history
    - Implement status update (New → In Progress → Resolved/Closed)
    - Implement reply form
    - _Requirements: 28.2-28.6, 28.9, 28.10_

  - [x] 22.9 Implement Admin Invoice Settings page
    - Create invoice settings form: company name, address, phone, email, tax registration number, footer text, terms text, invoice number format, include logo toggle, enable customer download toggle
    - Display preview of invoice template with current settings
    - Save settings via PUT /api/invoices/settings
    - _Requirements: 41.4, 41.5, 41.6, 41.10_

- [x] 23. Checkpoint - Ensure admin panel pages render and interact with backend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 24. Frontend polish - animations, responsiveness, and premium UI
  - [x] 24.1 Implement Framer Motion page transitions and UI animations
    - Add fade and slide page transitions between routes
    - Add skeleton loading screens for all data-fetching pages
    - Add smooth hover effects on product cards, buttons, interactive elements
    - Add soft glowing effects and smooth shadows on hover
    - Implement premium typography with consistent font hierarchy
    - _Requirements: 16.4, 16.5, 16.8, 16.9_

  - [x] 24.2 Implement responsive design across all breakpoints
    - Verify and fix layouts for desktop (1200px+), laptop (992-1199px), tablet (768-991px), mobile (<768px)
    - Ensure navigation adapts (mega menu → hamburger + drawer)
    - Ensure product grids adapt column counts
    - Ensure admin sidebar collapses appropriately
    - _Requirements: 16.3, 21.6_

  - [x] 24.3 Implement glassmorphism and premium dark theme effects
    - Apply frosted glass effect to cards, modals, and panels
    - Apply soft gradients and matte black backgrounds
    - Ensure glassmorphism adapts across all theme presets
    - Verify premium appearance in both dark and light modes
    - _Requirements: 16.1, 16.2_

- [x] 25. Integration, validation, and final wiring
  - [x] 25.1 Wire frontend permission-based UI rendering
    - Conditionally render navigation items based on user permissions
    - Conditionally render admin sidebar links based on granted modules
    - Hide Dashboard link when user lacks "Read" permission on "dashboard" entity
    - Hide Reports link when user lacks "Read" permission on "reports" entity
    - Hide/show CRUD action buttons based on entity-level permissions
    - Implement permission-based route guards for all admin pages
    - _Requirements: 3.7, 3.9, 33.8, 44.5_

  - [x] 25.2 Wire form validation with backend error mapping
    - Ensure all forms use React Hook Form with client-side validation on blur and submit
    - Map backend field errors to form fields
    - Display toast notifications for success/error operations across all pages
    - _Requirements: 22.1-22.5_

  - [x] 25.3 Implement logout and state cleanup flow
    - Clear all user-specific Redux state (auth, cart, orders, wishlist) on logout
    - Clear localStorage tokens on logout
    - Redirect to login page
    - Implement session timeout handling (30 min inactivity for non-Remember Me)
    - _Requirements: 20.5, 18.9_

  - [x] 25.4 Final AI attribution audit
    - Scan all frontend code, comments, and content for AI tool references
    - Scan all backend code, comments, and seeded data for AI attribution
    - Remove any references to "Kiro", "AI-generated", "AI-assisted", or similar
    - Verify no HTML meta tags or hidden elements reference AI tools
    - _Requirements: 35.1-35.5_

  - [x] 25.5 Implement Dockerfiles, docker-compose, and environment configurations
    - Create backend Dockerfile (multi-stage: Maven build + JRE 21 alpine runtime)
    - Create frontend Dockerfile (multi-stage: Node build + Nginx alpine runtime)
    - Create Nginx `default.conf` with SPA fallback routing, API proxy to backend, gzip, cache headers, security headers, server_name for glydecurtains.com
    - Create `docker-compose.yml` for development/INT (backend + frontend services, health checks, environment variable injection)
    - Create `docker-compose.prod.yml` with production overrides (resource limits, restart policies, log drivers)
    - Create `.env.example` documenting all required environment variables
    - Create `application-int.yml` (H2 console enabled, debug logging, relaxed CORS, seed-data true)
    - Create `application-qa.yml` (H2 console disabled, INFO logging, CORS for qa.glydecurtains.com, seed-data true)
    - Create `application-prod.yml` (H2 console disabled, WARN logging, CORS for glydecurtains.com only, secure cookies, HTTPS enforcement, seed-data false)
    - Implement `/api/health` endpoint returning version, environment, uptime
    - Create `Makefile` with commands: build, run, test, docker-build, docker-up, docker-down
    - _Requirements: 42.1-42.14, 45.1-45.7_

  - [x] 25.6 Implement version control and CI/CD pipeline configuration
    - Create `.gitignore` (exclude target/, node_modules/, .env, *.h2.db, IDE files, dist/)
    - Create `README.md` with project overview, tech stack, prerequisites, local setup, Docker deployment, default credentials (admin@glydecurtains.com / admin123), environment guide, branching strategy
    - Create `CHANGELOG.md` with initial v1.0.0 release notes following Keep a Changelog format
    - Create `VERSION` file with "1.0.0"
    - Set Maven pom.xml version to 1.0.0, package.json version to 1.0.0
    - Create `.github/workflows/ci.yml` GitHub Actions pipeline: build-test → docker-build → deploy-int (develop) / deploy-qa (release/*) / deploy-prod (main, manual gate)
    - Configure Docker image tagging with Git SHA and semantic version
    - _Requirements: 43.1-43.7_

  - [x] 25.7 Enforce report and dashboard permissions
    - Add "dashboard" and "reports" to the permission entity list in backend PermissionEvaluator
    - Apply `@RequiresPermission(entity="reports", operation=READ)` to all report endpoints in DashboardController
    - Apply `@RequiresPermission(entity="dashboard", operation=READ)` to dashboard summary, charts, and activity endpoints
    - Update DataSeeder to grant "Read" on "dashboard" and "reports" to Admin role by default; deny to Employee by default (Admin must explicitly grant)
    - _Requirements: 44.1-44.7_

  - [x] 25.8 Write integration tests for critical flows
    - Test complete login → browse → add to cart → place order flow
    - Test admin product creation with image upload flow
    - Test permission change enforcement flow
    - Test multi-language content display flow
    - Test Docker container health check endpoints
    - _Requirements: 2.1-2.3, 9.1-9.4, 10.1, 33.3, 37.2, 42.6_

- [x] 26. Final checkpoint - Ensure all tests pass and full application works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 27. Inventory Management Implementation
  - [x] 27.1 Create StockAdjustment entity and repository
    - Create `StockAdjustment` entity with fields: id (Long, PK, auto-generated), productId (Long, FK → Product, not null), adjustmentType (AdjustmentType enum, not null), quantity (Integer, not null), resultingStock (Integer, not null, >= 0), reason (String, not null, max 500), performedBy (Long, FK → User, not null), createdAt (LocalDateTime, auto-set)
    - Create `AdjustmentType` enum with values: ADD, REMOVE, SET
    - Add `lowStockThreshold` field (Integer, default 5, >= 0) to `Product` entity
    - Create `StockAdjustmentRepository` extending JpaRepository with `findByProductId(Long productId, Pageable pageable)` ordered by createdAt desc
    - _Requirements: 46.1, 46.2, 46.3_

  - [x] 27.2 Implement InventoryService and InventoryController
    - Implement `InventoryServiceImpl` with `adjustStock()`: validate product exists, calculate new stock using AdjustmentType switch (ADD → current + qty, REMOVE → current - qty, SET → qty), reject if resulting stock < 0, persist StockAdjustment record, update product stockQuantity
    - Implement `getAdjustmentHistory()`: return paginated adjustment history for a product
    - Implement `updateLowStockThreshold()`: validate threshold >= 0, update product's lowStockThreshold field
    - Implement `bulkAdjustStock()`: process list of StockAdjustmentRequest atomically within single transaction, rollback all if any fails
    - Implement `bulkAdjustFromCsv()`: parse CSV file (columns: productId, adjustmentType, quantity, reason), validate all rows, process atomically
    - Create `InventoryController` with endpoints: POST `/api/inventory/adjust`, GET `/api/inventory/history/{productId}`, PUT `/api/inventory/threshold/{productId}`, POST `/api/inventory/bulk-adjust`, POST `/api/inventory/bulk-csv`
    - Add `@RequiresPermission(entity="inventory", operation=CREATE)` to adjust/bulk endpoints, `@RequiresPermission(entity="inventory", operation=READ)` to history, `@RequiresPermission(entity="inventory", operation=UPDATE)` to threshold
    - Create request/response DTOs: `StockAdjustmentRequest`, `ThresholdUpdateRequest`, `StockAdjustmentResponse`
    - _Requirements: 46.1, 46.2, 46.3, 46.4, 46.5, 46.6_

  - [x] 27.3 Update DataSeeder for inventory permissions and demo customer account
    - Add `"inventory"` to the entities array in `seedPermissions()` method in `DataSeeder.java`
    - Ensure Admin role is granted CRUD operations on "inventory" entity by default
    - Create `seedDemoCustomer()` method: seed user with email `dk@glydecurtains.com`, password "dk" (BCrypt encoded), name "DK", role CUSTOMER, status APPROVED
    - Call `seedDemoCustomer()` from `run()` method after `seedSuperAdmin()`
    - _Requirements: 46.4, 47.1, 47.2, 47.3_

  - [x] 27.4 Enforce cart quantity limit of 10 per line item
    - Add `MAX_QUANTITY_PER_ITEM = 10` constant to `CartServiceImpl`
    - Validate on `addItem()`: `request.quantity() <= 10` AND if existing cart item `existingQty + request.quantity() <= 10`, throw BusinessException with descriptive message including current cart quantity
    - Validate on `updateItemQuantity()`: `1 <= quantity <= 10`, throw BusinessException if out of range
    - Update frontend `QuantitySelector` component to enforce min=1, max=10 range via props
    - Show "Max 10 per item" error message when user reaches the limit on frontend
    - Handle backend `CART_QUANTITY_LIMIT_EXCEEDED` error in cart Redux thunks
    - _Requirements: 49.1, 49.2, 49.3, 49.4, 49.5_

  - [x] 27.5 Implement Admin Inventory Management page (frontend)
    - Create `src/pages/admin/InventoryManagementPage.tsx` with stock adjustment form (product autocomplete, adjustment type radio, quantity input, reason textarea), adjustment history table (paginated), threshold configuration panel, bulk CSV upload with drag-and-drop
    - Create `inventorySlice.ts` in Redux store with state: adjustmentHistory, isLoading, error, bulkResults; async thunks for all inventory API calls
    - Add `/admin/inventory` route to `AppRoutes.tsx`
    - Add "Inventory" navigation item to AdminSidebar, permission-gated by `inventory:READ`
    - _Requirements: 46.1, 46.2, 46.3, 46.5, 46.6_

- [x] 28. Backend Unit Tests
  - [x]* 28.1 Write AuthService tests
    - Test login success with valid credentials, login with invalid password, login with non-existent user, login with non-approved user, register success, register duplicate email, token refresh, token expired
    - Use JUnit 5 with `@ExtendWith(MockitoExtension.class)` and `@InjectMocks`/`@Mock` pattern
    - _Requirements: 48.1, 48.2_

  - [x]* 28.2 Write UserService tests
    - Test get users paginated, approve user, reject user, suspend user, role change, update profile, get by ID not found
    - _Requirements: 48.1, 48.2_

  - [x]* 28.3 Write PermissionService tests
    - Test three-tier resolution: Super Admin bypass, user override, role default, implicit deny; get permissions for role, update user permission override
    - _Requirements: 48.1, 48.2_

  - [x]* 28.4 Write ProductService tests
    - Test create product success, duplicate SKU rejection, update product, delete/archive product, activate/deactivate, filter by category, filter by status, non-existent category
    - _Requirements: 48.1, 48.2_

  - [x]* 28.5 Write CategoryService tests
    - Test create category, create with duplicate name, delete category in use (should fail), reorder categories, toggle visibility
    - _Requirements: 48.1, 48.2_

  - [x]* 28.6 Write SearchService tests
    - Test search by keyword, search with filters, search empty results, search with pagination
    - _Requirements: 48.1, 48.2_

  - [x]* 28.7 Write CartService tests (including quantity limit enforcement)
    - Test add item success, add duplicate item (increment qty), update quantity, remove item, clear cart, add exceeding max quantity (10), update exceeding max quantity, add to existing item exceeding combined max
    - _Requirements: 48.1, 48.2, 49.1, 49.2, 49.3_

  - [x]* 28.8 Write OrderService tests
    - Test place order success, place order with empty cart, update status valid transition, update status invalid transition, cancel order, get order by ID not found
    - _Requirements: 48.1, 48.2_

  - [x]* 28.9 Write WishlistService tests
    - Test add to wishlist, add duplicate (idempotent), remove from wishlist, move to cart, get wishlist paginated
    - _Requirements: 48.1, 48.2_

  - [x]* 28.10 Write EmployeeService tests
    - Test create employee, update employee, delete employee, get employees paginated, assign tasks, update task status
    - _Requirements: 48.1, 48.2_

  - [x]* 28.11 Write StoreService tests
    - Test create store location, update store, delete store, get all stores, toggle visibility
    - _Requirements: 48.1, 48.2_

  - [x]* 28.12 Write FeedbackService tests
    - Test submit feedback, approve feedback, reject feedback, product average rating calculation, get pending feedback
    - _Requirements: 48.1, 48.2_

  - [x]* 28.13 Write AchievementService tests
    - Test create achievement, update achievement, delete achievement, reorder achievements, toggle visibility
    - _Requirements: 48.1, 48.2_

  - [x]* 28.14 Write EnquiryService tests
    - Test create enquiry, update status, assign to employee, get enquiries paginated, filter by status
    - _Requirements: 48.1, 48.2_

  - [x]* 28.15 Write CmsService tests
    - Test create page, update page, publish/unpublish page, get page by slug, duplicate slug rejection
    - _Requirements: 48.1, 48.2_

  - [x]* 28.16 Write ThemeService tests
    - Test get active theme, update theme settings, switch theme preset, get all presets
    - _Requirements: 48.1, 48.2_

  - [x]* 28.17 Write DashboardService tests
    - Test get summary stats, get revenue chart data, get recent activity, get low stock products
    - _Requirements: 48.1, 48.2_

  - [x]* 28.18 Write InvoiceService tests
    - Test generate invoice, generate for non-existent order, bulk generate invoices, get invoice by order ID
    - _Requirements: 48.1, 48.2_

  - [x]* 28.19 Write ActivityLogService tests
    - Test log activity, get activity paginated, filter by entity type, filter by user
    - _Requirements: 48.1, 48.2_

  - [x]* 28.20 Write TranslationService tests
    - Test get translations by locale, update translation, create translation key, get supported locales
    - _Requirements: 48.1, 48.2_

  - [x]* 28.21 Write ImageService tests
    - Test upload image (Base64 encode), compress image exceeding max size, validate image dimensions, delete image
    - _Requirements: 48.1, 48.2_

  - [x]* 28.22 Write InventoryService tests
    - Test adjust stock ADD/REMOVE/SET, remove exceeds stock (should fail), bulk adjust success, bulk adjust partial failure (rollback all), threshold update success, threshold update invalid (negative), CSV import valid file, CSV import invalid format
    - _Requirements: 46.1, 46.2, 48.1, 48.2_

- [x] 29. Checkpoint - Ensure all inventory and unit tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical boundaries
- Backend tasks (1-10) should be completed before frontend tasks (11-25) for API availability
- The design uses Java (Spring Boot) for backend and TypeScript (React) for frontend — no language selection needed
- All images use Base64 storage in H2; no external file system or cloud dependencies
- No property-based tests are included as the design has no Correctness Properties section
- Unit tests validate service layer logic; integration tests validate end-to-end flows

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2", "1.4", "1.6", "1.7"] },
    { "id": 2, "tasks": ["1.5"] },
    { "id": 3, "tasks": ["3.1", "4.1", "4.2"] },
    { "id": 4, "tasks": ["3.2", "3.3", "4.3", "4.4", "4.6"] },
    { "id": 5, "tasks": ["3.4", "4.5", "4.7", "3.5"] },
    { "id": 6, "tasks": ["4.8", "6.1", "7.1"] },
    { "id": 7, "tasks": ["6.2", "6.3", "6.5", "7.2", "7.3", "7.4", "7.5", "7.6"] },
    { "id": 8, "tasks": ["6.4", "7.7"] },
    { "id": 9, "tasks": ["6.6", "8.1"] },
    { "id": 10, "tasks": ["8.2", "8.3", "8.4", "8.6"] },
    { "id": 11, "tasks": ["8.5", "8.7"] },
    { "id": 12, "tasks": ["9.1"] },
    { "id": 13, "tasks": ["11.1"] },
    { "id": 14, "tasks": ["11.2", "11.4", "11.5"] },
    { "id": 15, "tasks": ["11.3", "11.6", "11.7", "11.8"] },
    { "id": 16, "tasks": ["13.1", "13.2", "13.3"] },
    { "id": 17, "tasks": ["14.1", "14.3", "14.4"] },
    { "id": 18, "tasks": ["14.2", "15.1", "15.2", "15.3"] },
    { "id": 19, "tasks": ["16.1", "16.2", "16.3", "16.4", "17.1", "17.2"] },
    { "id": 20, "tasks": ["19.1", "19.2", "19.3", "19.4"] },
    { "id": 21, "tasks": ["20.1", "20.2", "21.1", "21.2"] },
    { "id": 22, "tasks": ["22.1", "22.2", "22.3", "22.4", "22.5", "22.6", "22.7", "22.8", "22.9"] },
    { "id": 23, "tasks": ["24.1", "24.2", "24.3"] },
    { "id": 24, "tasks": ["25.1", "25.2", "25.3", "25.4", "25.5", "25.6", "25.7"] },
    { "id": 25, "tasks": ["25.8"] },
    { "id": 26, "tasks": ["27.1"] },
    { "id": 27, "tasks": ["27.2", "27.3", "27.4"] },
    { "id": 28, "tasks": ["27.5"] },
    { "id": 29, "tasks": ["28.1", "28.2", "28.3", "28.4", "28.5", "28.6", "28.7", "28.8", "28.9", "28.10", "28.11", "28.12", "28.13", "28.14", "28.15", "28.16", "28.17", "28.18", "28.19", "28.20", "28.21", "28.22"] }
  ]
}
```
