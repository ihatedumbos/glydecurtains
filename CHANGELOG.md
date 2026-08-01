# Changelog

All notable changes to the Glyde Curtains E-Commerce Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
