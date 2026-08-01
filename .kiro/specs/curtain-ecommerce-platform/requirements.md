# Requirements Document

## Introduction

This document specifies **Phase 1** requirements for "Glyde Curtains" — an enterprise-grade e-commerce web application for selling curtains, blinds, and curtain accessories (tracks, rods, brackets, rings, hooks, finials, holders, and related home furnishing products). The platform supports four user roles (Super Admin, Admin, Employee, Customer), features a premium dark-themed UI with glassmorphism effects, and provides complete product catalog management, order processing, CMS capabilities, store locator, feedback system, achievements showcase, product hover quick-view with dynamic pricing, and granular role-based access control.

**Phase 1 Scope:** Phase 1 uses an H2 embedded database with all data bundled within the application. All images (product images, banners, logos, category icons, store images, achievement icons) are stored as Base64-encoded compressed strings directly in the H2 database — no external file system or cloud storage is used. No external services are required (no email service, no payment gateway, no cloud storage). Future phases will introduce external databases, cloud image storage, email services, payment gateway integrations, and other external dependencies.

The backend uses Java 21+ with Spring Boot 3.x, and the frontend uses React 18+ with TypeScript.

## Glossary

- **Platform**: The complete Glyde Curtains e-commerce web application system
- **Backend_API**: The Spring Boot REST API server handling business logic, data persistence, and security
- **Frontend_App**: The React TypeScript single-page application providing the user interface
- **Auth_Service**: The authentication and authorization module managing JWT tokens, login, signup, and session management
- **Product_Service**: The module responsible for product CRUD operations, inventory, and catalog management
- **Order_Service**: The module responsible for order placement, status tracking, and order lifecycle management
- **Cart_Service**: The module responsible for persistent shopping cart operations and price calculations
- **Search_Service**: The module responsible for product search, filtering, autocomplete, and suggestions
- **CMS_Service**: The content management module allowing Admins to manage homepage sections, banners, pages, and site settings without code changes
- **User_Service**: The module responsible for user registration, approval workflows, role assignment, and account management
- **Employee_Service**: The module responsible for employee CRUD, permission assignment, department management, and task assignment
- **Dashboard_Service**: The module providing analytics cards, charts, statistics, reports, and activity feeds for the admin panel
- **Store_Service**: The module responsible for managing store locations, coordinates, operating hours, and search
- **Feedback_Service**: The module responsible for customer feedback submission, rating, Admin review, and display
- **Achievement_Service**: The module responsible for managing company achievements and milestones
- **Notification_Service**: The module responsible for in-app notifications, alerts, and activity feeds
- **Super_Admin**: A user role with full unrestricted control over all platform features; cannot be restricted
- **Admin**: A user role that manages products, homepage content, users, employees, orders, categories, and all CMS features
- **Employee**: A user role with access to assigned modules, inventory updates, order processing, and reports based on granted permissions
- **Customer**: A user role that can browse products, search, manage wishlist, cart, place orders, submit feedback, and manage profile
- **JWT**: JSON Web Token used for stateless authentication
- **Refresh_Token**: A long-lived token used to obtain new JWT access tokens without re-authentication
- **CMS**: Content Management System allowing non-technical content updates
- **SKU**: Stock Keeping Unit, a unique product identifier
- **SEO**: Search Engine Optimization metadata fields
- **Theme_Preset**: A pre-configured set of colors, styles, and visual parameters that define the platform appearance
- **Scrolling_Ticker**: A horizontally scrolling marquee banner at the top of the homepage displaying newly added products or promotional messages
- **Activity_Log**: A persistent record of all significant actions performed on the platform for audit and compliance purposes
- **Enquiry**: A customer-submitted message through the Contact Us form requiring Admin review and response
- **Static_Page**: An admin-managed content page (About Us, Contact Us, Terms, Privacy Policy, or custom) that does not require code changes to update
- **Permission_Matrix**: A configurable mapping of roles to feature-level access rights, editable by Super_Admin and Admin
- **Wishlist**: A customer-maintained list of favorite products for future purchase consideration
- **Store_Locator**: The feature enabling customers to search and find physical store locations by city or area
- **Feedback**: A customer-submitted review or rating for the platform or a specific product, subject to Admin moderation
- **Achievement**: A company milestone or statistic (e.g., "10,000+ Happy Customers") displayed on the homepage and achievements page
- **Product_Variant**: A unique combination of material, size, and color for a product, each potentially having a distinct price
- **Quick_View_Popup**: An animated hover popover on product cards displaying product details and variant selection with dynamic pricing
- **Base64_Image**: An image stored as a Base64-encoded compressed string directly in the H2 database, served via data URIs
- **CRUD_Permission**: A granular Create, Read, Update, or Delete access right configurable per entity per role
- **Entity**: Any managed resource in the system (products, categories, orders, users, employees, CMS pages, banners, store locations, feedback, achievements, enquiries, reports, settings, themes, logos, inventory)
- **Inventory_Service**: The module responsible for stock adjustment operations, stock audit logging, low-stock threshold management, and bulk stock updates, separate from product catalog management
- **Stock_Adjustment**: A record of a stock quantity change (add, remove, or set) for a product, including the reason, performer, and timestamp
- **Low_Stock_Threshold**: A configurable per-product quantity below which the system generates a low-stock alert
- **Demo_Customer**: A seeded customer account (dk@glydecurtains.com) used for demonstration and testing purposes with an exception to password strength rules

## Requirements

### Requirement 1: User Registration and Approval Workflow

**User Story:** As a Customer, I want to register an account on the platform, so that I can browse and purchase curtain products after Admin approval.

#### Acceptance Criteria

1. WHEN a visitor submits a registration form with a name (between 1 and 100 characters), a valid email address, and a password meeting strength requirements, THE Auth_Service SHALL create a new user account with status "Pending Approval"
2. WHEN a user with status "Pending Approval" attempts to log in, THE Auth_Service SHALL reject the login attempt and return a message indicating the account is awaiting approval
3. WHEN an Admin approves a pending user account, THE User_Service SHALL update the user status to "Approved", allow the user to log in, and send a notification to the user's registered email indicating approval
4. WHEN an Admin rejects a pending user account, THE User_Service SHALL update the user status to "Rejected", prevent the user from logging in, and send a notification to the user's registered email indicating rejection
5. IF a registration request contains an email that already exists in the system (compared case-insensitively), THEN THE Auth_Service SHALL reject the registration and return a duplicate email error regardless of the existing account's status
6. THE Auth_Service SHALL validate that the password meets minimum strength requirements (minimum 8 characters, at least one uppercase letter, one lowercase letter, one digit, and one special character)
7. WHEN an Admin suspends an approved user account, THE User_Service SHALL update the user status to "Suspended" and invalidate all active sessions for that user
8. IF a registration form is submitted with a missing or invalid name (empty, exceeds 100 characters), or a malformed email address, THEN THE Auth_Service SHALL reject the registration and return a message indicating which fields failed validation
9. WHEN a user with status "Rejected" or "Suspended" attempts to log in, THE Auth_Service SHALL reject the login attempt and return a message indicating the account status

### Requirement 2: JWT Authentication and Session Management

**User Story:** As a registered user, I want to securely authenticate and maintain my session, so that I can access platform features appropriate to my role.

#### Acceptance Criteria

1. WHEN a user with status "Approved" submits valid credentials, THE Auth_Service SHALL issue a JWT access token with a validity period of 15 minutes and a Refresh_Token
2. WHEN a request includes a valid non-expired JWT access token, THE Backend_API SHALL authorize the request based on the roles encoded in the token
3. WHEN a JWT access token expires, THE Auth_Service SHALL allow the client to obtain a new access token using a valid Refresh_Token
4. WHEN a user logs out, THE Auth_Service SHALL invalidate the Refresh_Token and remove the session
5. IF a request includes an invalid or expired JWT token and no valid Refresh_Token is available, THEN THE Backend_API SHALL return HTTP 401 Unauthorized
6. THE Auth_Service SHALL hash all passwords using BCrypt with a minimum cost factor of 10 before storing them in the database
7. WHEN a user selects "Remember Me" during login, THE Auth_Service SHALL issue a Refresh_Token with an extended validity period of 30 days
8. WHEN a user does not select "Remember Me" during login, THE Auth_Service SHALL issue a Refresh_Token with a standard validity period of 24 hours
9. IF a user with status "Approved" submits invalid credentials, THEN THE Auth_Service SHALL reject the login attempt and return an error message indicating invalid credentials without specifying which field is incorrect
10. IF a client attempts to obtain a new access token using an invalidated or expired Refresh_Token, THEN THE Auth_Service SHALL reject the request and return HTTP 401 Unauthorized
11. IF a user with status "Approved" submits 5 consecutive failed login attempts, THEN THE Auth_Service SHALL lock the account for 15 minutes and reject subsequent login attempts with a message indicating the account is temporarily locked

### Requirement 3: Role-Based Authorization and Permission Control

**User Story:** As a platform administrator, I want to enforce role-based access control with configurable permissions, so that users can only access features appropriate to their assigned role and granted permissions.

#### Acceptance Criteria

1. THE Backend_API SHALL enforce role-based access control on all API endpoints based on the authenticated user's role and granted permissions
2. WHEN a Super_Admin makes any API request, THE Backend_API SHALL grant access without restriction regardless of the endpoint
3. WHEN an Admin accesses management endpoints (products, homepage, users, employees, orders, categories, CMS, reports, store locations, feedback, achievements), THE Backend_API SHALL grant access
4. WHEN an Employee accesses an endpoint, THE Backend_API SHALL grant access only if the Employee has been assigned the specific CRUD_Permission (view, create, edit, or delete) for the corresponding module; IF the Employee has module access but lacks the specific CRUD_Permission for the requested operation, THEN THE Backend_API SHALL return HTTP 403 Forbidden
5. WHEN a Customer accesses endpoints beyond browsing, searching, cart, wishlist, orders, feedback submission, and profile management, THE Backend_API SHALL return HTTP 403 Forbidden
6. IF an unauthenticated user attempts to access a protected endpoint, THEN THE Backend_API SHALL return HTTP 401 Unauthorized
7. WHEN an authenticated user logs in or refreshes their session, THE Backend_API SHALL provide the user's complete permission set (role and granted module-level CRUD_Permissions) and THE Frontend_App SHALL render navigation menus, pages, and UI elements showing only the features the user is permitted to access
8. WHEN a Super_Admin or Admin configures the Permission_Matrix, THE User_Service SHALL persist the permission assignments and enforce them on the target user's next API request without requiring re-login or token reissuance
9. THE Backend_API SHALL enforce feature-level access control where each management module (products, orders, users, employees, CMS, reports, dashboard, enquiries, settings, store locations, feedback, achievements) can be independently granted or revoked per role
10. THE User_Service SHALL provide a permissions management UI where Admin can toggle individual module access (view, create, edit, delete) for each Employee and for the Employee role as a whole
11. WHEN an Employee account is created and no explicit permissions are assigned, THE User_Service SHALL grant no module access by default, requiring an Admin to explicitly assign permissions before the Employee can access any management endpoint

### Requirement 4: Password Recovery

**User Story:** As a registered user, I want to reset my forgotten password, so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN a user requests a password reset with a valid registered email, THE Auth_Service SHALL generate a time-limited password reset token (valid for 15 minutes) and provide the reset link
2. WHEN a user submits a new password with a valid reset token, THE Auth_Service SHALL update the password, invalidate the reset token, and invalidate all existing sessions
3. IF a user submits a password reset request with an email not registered in the system, THEN THE Auth_Service SHALL return a generic success message without revealing whether the email exists
4. IF a user submits a new password with an expired or invalid reset token, THEN THE Auth_Service SHALL reject the request and return an error indicating the token is invalid

### Requirement 5: Product Catalog Management

**User Story:** As an Admin, I want to manage the product catalog with full CRUD operations, so that I can maintain an up-to-date inventory of curtains and accessories.

#### Acceptance Criteria

1. WHEN an Admin creates a new product with all required fields (name, SKU, category, price, stock quantity, at least one image), THE Product_Service SHALL persist the product and return the created product details
2. WHEN an Admin updates an existing product's fields, THE Product_Service SHALL persist the changes and return the updated product details
3. WHEN an Admin deletes a product, THE Product_Service SHALL remove the product from the active catalog
4. WHEN an Admin archives a product, THE Product_Service SHALL set the product status to "Archived" and hide the product from the customer-facing catalog while retaining the data
5. WHEN an Admin sets a product as "Featured", "Trending", "New Arrival", "Best Seller", or "Premium Collection", THE Product_Service SHALL update the corresponding visibility flags and include the product in the respective homepage sections
6. THE Product_Service SHALL enforce unique SKU values across all products
7. IF a product creation or update request contains a duplicate SKU, THEN THE Product_Service SHALL reject the request and return a duplicate SKU error
8. WHEN an Admin deactivates a product, THE Product_Service SHALL set the product visibility to hidden and exclude the product from search results and catalog listings
9. THE Product_Service SHALL store the complete product model including: name, SKU, barcode, short description, long description, category, sub-category, brand, collection, material, pattern, colors (multiple), sizes (multiple), length, width, height, weight, stock quantity, availability status, images (thumbnail and gallery), price, discount percentage, offer price, status, tags, and SEO fields (meta title, meta description, meta keywords)
10. THE Product_Service SHALL support dynamic key-value specification pairs for each product (examples: Material: Aluminium, Finish: Ivory, Length: 6 Meter, Application: Residential, Warranty: 10 Years) allowing Admins to add any number of custom specification fields per product
11. WHEN an Admin adds or updates product specifications, THE Product_Service SHALL persist the specification key-value pairs and the Frontend_App SHALL display the specifications in a formatted table on the product detail page
12. WHEN an Admin activates a previously archived or deactivated product, THE Product_Service SHALL set the product visibility to active and include the product in catalog listings and search results

### Requirement 6: Category and Collection Management

**User Story:** As an Admin, I want to manage product categories, sub-categories, and collections, so that products are organized for easy customer navigation.

#### Acceptance Criteria

1. WHEN an Admin creates a new category with name and optional icon/image, THE Product_Service SHALL persist the category and make it available for product assignment
2. WHEN an Admin creates a sub-category with a parent category reference, THE Product_Service SHALL persist the sub-category linked to the specified parent category
3. WHEN an Admin updates the sort order of categories, THE Product_Service SHALL persist the new ordering and reflect the updated order in all category listings
4. WHEN an Admin sets a category visibility to hidden, THE Product_Service SHALL exclude that category and its products from the customer-facing navigation and catalog
5. WHEN an Admin creates or updates a collection, THE Product_Service SHALL persist the collection details and allow products to be associated with it
6. THE Product_Service SHALL prevent deletion of a category that has associated products and return an error indicating the category is in use
7. WHEN an Admin enables or disables a category, THE Product_Service SHALL update the category active status and the Frontend_App SHALL show or hide the category accordingly
8. WHEN an Admin edits category details (name, icon, image, description), THE Product_Service SHALL persist the changes and reflect updates across all product listings referencing that category

### Requirement 7: Product Search and Filtering

**User Story:** As a Customer, I want to search and filter products by multiple criteria, so that I can find the curtains and accessories that match my preferences.

#### Acceptance Criteria

1. WHEN a Customer submits a search query by product name, THE Search_Service SHALL return products whose names contain the search term, ordered by relevance
2. WHEN a Customer applies filters (category, sub-category, color, size, material, collection, price range, availability), THE Search_Service SHALL return only products matching all applied filter criteria
3. WHEN a Customer selects a sort option (popularity, newest, price low-to-high, price high-to-low, featured), THE Search_Service SHALL return results ordered by the selected criteria
4. WHEN a Customer types in the search field, THE Search_Service SHALL provide autocomplete suggestions after the user has typed at least 2 characters
5. THE Search_Service SHALL exclude deactivated and archived products from all search results
6. WHEN a Customer submits a search query that matches no products, THE Search_Service SHALL return an empty result set with a count of zero
7. THE Search_Service SHALL store and display the user's recent searches (up to 10 most recent) for authenticated customers
8. WHEN a Customer clears search filters, THE Search_Service SHALL reset all applied filters and return the unfiltered paginated product listing

### Requirement 8: Product Detail Display

**User Story:** As a Customer, I want to view detailed product information with high-quality images, so that I can make informed purchasing decisions.

#### Acceptance Criteria

1. WHEN a Customer navigates to a product detail page, THE Frontend_App SHALL display the product name, images (with gallery), price, discount, description, specifications table, material, available colors, available sizes, and availability status
2. WHEN a Customer selects a product image thumbnail, THE Frontend_App SHALL display the selected image in the main viewing area with zoom capability on hover
3. WHEN a Customer views a product detail page, THE Frontend_App SHALL display a "Related Products" section with products from the same category
4. WHEN a Customer views a product detail page, THE Frontend_App SHALL display a "Similar Products" section with products sharing similar attributes
5. WHEN a Customer selects color and size options, THE Frontend_App SHALL update the displayed availability based on the selected combination
6. THE Frontend_App SHALL display product images using lazy loading to optimize page load performance
7. THE Frontend_App SHALL display breadcrumb navigation on the product detail page showing Home > Category > Sub-Category > Product Name

### Requirement 9: Persistent Shopping Cart

**User Story:** As a Customer, I want my shopping cart to persist across sessions, so that my selected items are still available when I log back in.

#### Acceptance Criteria

1. WHEN a Customer adds a product to the cart with a selected quantity, THE Cart_Service SHALL persist the item to the backend database and return the updated cart contents
2. WHEN a Customer updates the quantity of a cart item, THE Cart_Service SHALL update the quantity in the backend and recalculate the cart totals
3. WHEN a Customer removes an item from the cart, THE Cart_Service SHALL remove the item from the backend and recalculate the cart totals
4. THE Cart_Service SHALL calculate and display the subtotal for each line item (unit price multiplied by quantity) and the grand total for all items
5. THE Frontend_App SHALL display a cart badge on the navigation bar showing the total number of items in the cart
6. WHEN a Customer adds a quantity exceeding available stock, THE Cart_Service SHALL reject the addition and return an insufficient stock error
7. WHEN a Customer logs in, THE Cart_Service SHALL retrieve the persisted cart from the backend and restore the cart state in the Frontend_App
8. WHEN a Customer logs out and logs back in, THE Cart_Service SHALL return the same cart contents that existed before logout
9. THE Frontend_App SHALL synchronize the Redux cart state with the backend on every cart operation to ensure data consistency
10. WHEN a product in the cart becomes unavailable or is deactivated, THE Cart_Service SHALL flag the item and notify the Customer upon next cart retrieval

### Requirement 10: Order Placement and Lifecycle

**User Story:** As a Customer, I want to place orders and track their status, so that I can purchase products and monitor delivery progress.

#### Acceptance Criteria

1. WHEN a Customer places an order with items in the cart, THE Order_Service SHALL create an order with status "Pending", deduct stock quantities, and return the order confirmation with an order number
2. WHEN an Admin confirms a pending order, THE Order_Service SHALL update the order status to "Confirmed"
3. WHEN an Admin updates an order status through the lifecycle (Pending → Confirmed → Packed → Dispatched → Delivered), THE Order_Service SHALL persist the status change with a timestamp
4. WHEN an Admin or Customer cancels an order that is in "Pending" or "Confirmed" status, THE Order_Service SHALL update the status to "Cancelled" and restore the deducted stock quantities
5. IF a Customer attempts to cancel an order that is in "Packed", "Dispatched", or "Delivered" status, THEN THE Order_Service SHALL reject the cancellation request
6. WHEN a Customer views their order history, THE Order_Service SHALL return all orders for that customer with current status, ordered by date descending
7. THE Order_Service SHALL store order details including: order number, customer reference, line items (product, quantity, unit price), subtotal, grand total, status, timestamps for each status change, and assigned employee reference
8. WHEN an order is placed, THE Cart_Service SHALL clear the customer's cart

### Requirement 11: Admin Order Management

**User Story:** As an Admin, I want to manage all customer orders with search, filter, and assignment capabilities, so that orders are processed efficiently.

#### Acceptance Criteria

1. WHEN an Admin views the order management page, THE Order_Service SHALL return a paginated list of all orders with filtering options by status, date range, and customer
2. WHEN an Admin searches orders by order number or customer name, THE Order_Service SHALL return matching orders
3. WHEN an Admin assigns an Employee to an order, THE Order_Service SHALL persist the assignment and make the order visible in the Employee's assigned tasks
4. WHEN an Admin views order details, THE Order_Service SHALL display all order information including line items, customer details, status history, and assigned employee
5. WHEN an Admin generates an orders report with a date range filter, THE Dashboard_Service SHALL return aggregated order statistics (total orders, revenue, status breakdown) for the specified period

### Requirement 12: Employee Management

**User Story:** As an Admin, I want to manage employees with role assignments, department allocation, and granular permissions, so that staff can access only the modules relevant to their responsibilities.

#### Acceptance Criteria

1. WHEN an Admin creates a new employee with name, email, department, and assigned permissions, THE Employee_Service SHALL create the employee account and grant access to the specified modules
2. WHEN an Admin updates an employee's permissions, THE Employee_Service SHALL persist the changes and immediately reflect the updated access in subsequent requests
3. WHEN an Admin suspends an employee, THE Employee_Service SHALL set the employee status to "Suspended" and revoke all access
4. WHEN an Admin deletes an employee, THE Employee_Service SHALL deactivate the employee account and revoke all access while retaining historical records
5. THE Employee_Service SHALL allow assignment of granular permissions including: view inventory, update inventory, process orders, view reports, manage products, view dashboard, manage store locations, and view enquiries
6. WHEN an Admin assigns an employee to a department, THE Employee_Service SHALL persist the department assignment and associate the employee with department-level tasks
7. WHEN an Admin assigns tasks to an employee, THE Employee_Service SHALL persist the task assignment and make it visible in the employee's task list
8. WHEN an Admin activates a previously suspended employee, THE Employee_Service SHALL restore the employee status and re-enable access based on previously assigned permissions

### Requirement 13: CMS Homepage Management

**User Story:** As an Admin, I want to manage all homepage sections through a CMS interface without code changes, so that I can keep the storefront content fresh and relevant.

#### Acceptance Criteria

1. WHEN an Admin adds a new hero banner with image, title, subtitle, and button configuration, THE CMS_Service SHALL persist the banner and display it in the homepage slider
2. WHEN an Admin enables or disables a homepage section, THE CMS_Service SHALL update the section visibility and the Frontend_App SHALL show or hide the section accordingly
3. WHEN an Admin reorders homepage sections by changing sort positions, THE CMS_Service SHALL persist the new order and the Frontend_App SHALL render sections in the updated order
4. WHEN an Admin updates text, images, or button links for any homepage section, THE CMS_Service SHALL persist the changes and the Frontend_App SHALL reflect the updates on the next page load
5. WHEN an Admin deletes a hero banner or promotional banner, THE CMS_Service SHALL remove the banner from the homepage display
6. THE CMS_Service SHALL support management of the following homepage sections: Hero Banner Slider, Promotional Banner, Featured Products, Latest Products, New Arrivals, Popular Categories, Premium Collections, Seasonal Collections, Best Selling, Recommended, Featured Accessories, Trending Products, Recently Added, Customer Testimonials, Brand Story, Achievements, Newsletter placeholder, and Footer content
7. WHEN an Admin updates site settings (logo, favicon, contact information, social links, announcement bar, newsletter placeholder), THE CMS_Service SHALL persist the settings and the Frontend_App SHALL reflect the changes
8. THE Frontend_App SHALL display a scrolling ticker/marquee at the top of the homepage showing newly added products, scrolling continuously from right to left
9. WHEN an Admin enables or disables the scrolling ticker section, THE CMS_Service SHALL update the ticker visibility accordingly
10. WHEN an Admin configures the scrolling ticker speed and content source (new arrivals, promotions, or custom text), THE CMS_Service SHALL persist the configuration and the Frontend_App SHALL reflect the changes
11. WHEN an Admin adds, edits, or deletes a promotional banner, THE CMS_Service SHALL persist the change and the Frontend_App SHALL update the promotional display area

### Requirement 14: Admin Dashboard and Reporting

**User Story:** As an Admin, I want a comprehensive dashboard with key metrics, charts, and downloadable reports, so that I can monitor platform health, sales performance, and business intelligence at a glance.

#### Acceptance Criteria

1. WHEN an Admin navigates to the dashboard, THE Dashboard_Service SHALL display summary cards showing: total orders, total products, total users, total employees, pending approval count, low stock product count, total revenue placeholder, and total enquiries
2. WHEN an Admin views the dashboard, THE Dashboard_Service SHALL display recent activity including latest orders, recent user registrations, recent product updates, and recent login activity
3. THE Dashboard_Service SHALL provide chart data for order trends, revenue trends, and user registration trends over configurable time periods (7 days, 30 days, 90 days, 1 year)
4. WHEN an Admin views the low stock alert, THE Dashboard_Service SHALL display products with stock quantity below a configurable threshold (default: 10 units)
5. WHEN an Admin requests a sales report with date range filter, THE Dashboard_Service SHALL return sales data including total orders, total revenue, average order value, and top-selling products for the specified period
6. WHEN an Admin requests a user activity report, THE Dashboard_Service SHALL return login frequency, repeated logins by user, active sessions, and new registrations for the specified period
7. WHEN an Admin requests an inventory report, THE Dashboard_Service SHALL return stock levels for all products, out-of-stock items, low-stock items, and stock movement history
8. WHEN an Admin requests a profit/loss report with date range filter, THE Dashboard_Service SHALL return revenue, cost of goods (placeholder), and calculated profit/loss figures
9. WHEN an Admin requests an enquiry report, THE Dashboard_Service SHALL return enquiry counts, response rates, and trending enquiry topics
10. THE Dashboard_Service SHALL provide report data in a format suitable for export (structured JSON) with export placeholder functionality

### Requirement 15: User Account Management

**User Story:** As an Admin, I want to manage user accounts with search, filter, and status control, so that I can maintain platform security and user access.

#### Acceptance Criteria

1. WHEN an Admin searches users by name, email, or status, THE User_Service SHALL return matching user accounts with pagination
2. WHEN an Admin changes a user's role, THE User_Service SHALL update the role and the change SHALL take effect on the user's next authentication
3. WHEN an Admin activates a previously deactivated user, THE User_Service SHALL update the status to "Approved" and allow the user to log in
4. WHEN an Admin deactivates an approved user, THE User_Service SHALL update the status to "Deactivated" and prevent the user from logging in
5. WHEN an Admin resets a user's password, THE User_Service SHALL generate a temporary password reset link and invalidate any existing sessions
6. THE User_Service SHALL maintain an audit log of all user status changes including the Admin who made the change and the timestamp
7. WHEN an Admin filters users by role, status, or registration date range, THE User_Service SHALL return matching user accounts with pagination

### Requirement 16: Frontend Premium UI and Responsiveness

**User Story:** As a Customer, I want a premium, elegant shopping experience with smooth animations and responsive design, so that I can comfortably browse and shop on any device.

#### Acceptance Criteria

1. THE Frontend_App SHALL implement a dark premium theme with glassmorphism effects, frosted glass, soft gradients, and matte black appearance as the default theme
2. THE Frontend_App SHALL support theme switching between dark mode and light mode with persisted user preference
3. THE Frontend_App SHALL render responsive layouts that adapt to desktop (1200px+), laptop (992px-1199px), tablet (768px-991px), and mobile (below 768px) viewports
4. THE Frontend_App SHALL implement smooth page transitions using Framer Motion with fade and slide animations
5. THE Frontend_App SHALL display skeleton loading screens during data fetching operations
6. THE Frontend_App SHALL implement lazy loading for product images and route-based code splitting for page components
7. THE Frontend_App SHALL include a sticky navigation header with mega menu, search bar, cart icon with badge, wishlist icon, and profile menu
8. THE Frontend_App SHALL implement premium hover effects on product cards, buttons, and interactive elements including soft glowing effects and smooth shadows
9. THE Frontend_App SHALL implement premium typography with consistent font hierarchy and appropriate spacing throughout all pages

### Requirement 17: API Design and Error Handling

**User Story:** As a developer, I want consistent, well-structured REST APIs with proper error handling, so that the frontend can reliably consume backend services.

#### Acceptance Criteria

1. THE Backend_API SHALL return all successful responses in a consistent JSON structure containing: status, message, data, and timestamp fields
2. THE Backend_API SHALL return all error responses in a consistent JSON structure containing: status, error code, message, field errors (if applicable), and timestamp fields
3. THE Backend_API SHALL support pagination on all list endpoints with page number, page size, total elements, and total pages in the response
4. THE Backend_API SHALL validate all request inputs using Bean Validation annotations and return HTTP 400 with field-specific error messages for invalid requests
5. IF an unexpected server error occurs, THEN THE Backend_API SHALL log the full error details internally and return HTTP 500 with a generic error message without exposing internal details
6. THE Backend_API SHALL implement global exception handling that catches all unhandled exceptions and returns appropriate HTTP status codes
7. THE Backend_API SHALL use proper HTTP status codes: 200 (OK), 201 (Created), 204 (No Content), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict), 500 (Internal Server Error)

### Requirement 18: Security Protections

**User Story:** As a platform operator, I want comprehensive security measures, so that the platform is protected against common web vulnerabilities.

#### Acceptance Criteria

1. THE Backend_API SHALL sanitize all user inputs to prevent Cross-Site Scripting (XSS) attacks
2. THE Backend_API SHALL use parameterized queries through Spring Data JPA to prevent SQL Injection attacks
3. THE Backend_API SHALL include security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Strict-Transport-Security, Content-Security-Policy) in all responses
4. THE Backend_API SHALL validate file uploads by checking file type, file size (maximum 5MB), and file content headers before accepting uploads
5. THE Backend_API SHALL implement rate limiting on authentication endpoints to prevent brute force attacks (maximum 5 failed attempts per 15 minutes per IP)
6. THE Frontend_App SHALL implement protected routes that redirect unauthenticated users to the login page
7. THE Backend_API SHALL never include sensitive information (passwords, tokens, internal stack traces) in API error responses
8. THE Backend_API SHALL implement CSRF protection for all state-changing endpoints
9. THE Backend_API SHALL enforce session timeout after 30 minutes of inactivity for non-Remember Me sessions
10. THE Backend_API SHALL validate and sanitize all input parameters to prevent injection attacks across all endpoints

### Requirement 19: Database Seeding with Sample Data

**User Story:** As a developer, I want the application to start with sample data, so that I can demonstrate and test all features without manual data entry.

#### Acceptance Criteria

1. WHEN the application starts with an empty database, THE Platform SHALL seed the database with sample data including: 3 curtain products, 2 curtain rod products, 2 track products, and 2 accessories with realistic names, descriptions, images, and pricing
2. WHEN the application starts with an empty database, THE Platform SHALL create default user accounts: one Super_Admin, one Admin, one Employee, and one Customer (all with status "Approved")
3. WHEN the application starts with an empty database, THE Platform SHALL create default categories (Curtains, Curtain Rods, Tracks, Accessories, Blinds Accessories) with sub-categories
4. WHEN the application starts with an empty database, THE Platform SHALL create default homepage configuration with all sections enabled and sample banners
5. WHEN the application starts with an empty database, THE Platform SHALL create default permissions, sample store locations, sample achievements, and sample testimonials
6. WHEN the application starts with an empty database, THE Platform SHALL create sample orders in various statuses to demonstrate the order lifecycle

### Requirement 20: State Management

**User Story:** As a frontend developer, I want centralized state management with Redux Toolkit, so that application state is predictable, consistent, and efficiently synchronized across components.

#### Acceptance Criteria

1. THE Frontend_App SHALL manage authentication state (token, user profile, roles, permissions) in a dedicated Redux auth slice
2. THE Frontend_App SHALL manage cart state (items, quantities, totals) in a dedicated Redux cart slice synchronized with the backend on every operation
3. THE Frontend_App SHALL manage product catalog state (product list, filters, pagination, sort) in a dedicated Redux products slice
4. THE Frontend_App SHALL manage global UI state (theme, loading indicators, toast notifications, sidebar visibility, modal state) in dedicated Redux slices
5. WHEN a user logs out, THE Frontend_App SHALL clear all user-specific state (auth, cart, orders, wishlist) from Redux and redirect to the login page
6. THE Frontend_App SHALL manage homepage CMS state, search state, order state, employee state, notification state, and filter state in dedicated Redux slices
7. THE Frontend_App SHALL persist theme preference and authentication tokens in browser localStorage for session continuity

### Requirement 21: Navigation and Layout

**User Story:** As a user, I want intuitive navigation with clear information architecture, so that I can efficiently access all platform features relevant to my role.

#### Acceptance Criteria

1. THE Frontend_App SHALL display a sticky top navigation bar with logo, mega menu for categories, search bar, cart icon with badge, wishlist icon, and user profile menu
2. WHEN a Customer hovers over the categories menu, THE Frontend_App SHALL display a mega menu dropdown showing all visible categories with sub-categories and optional category images
3. THE Frontend_App SHALL display breadcrumb navigation on all pages below the top-level home page
4. THE Frontend_App SHALL display a footer with contact information, social links, quick links, category links, and newsletter placeholder
5. WHEN an Admin or Employee is authenticated, THE Frontend_App SHALL display an admin sidebar navigation with links to all accessible management modules based on permissions
6. THE Frontend_App SHALL adapt navigation from horizontal mega menu (desktop) to hamburger menu with slide-out drawer (mobile and tablet) with smooth open/close animation

### Requirement 22: Form Validation and User Feedback

**User Story:** As a user, I want immediate feedback on form inputs and actions, so that I can correct errors before submission and confirm successful operations.

#### Acceptance Criteria

1. THE Frontend_App SHALL validate all form fields on blur and display field-specific error messages using React Hook Form
2. THE Frontend_App SHALL validate all form fields on submission and prevent submission when validation errors exist
3. THE Backend_API SHALL validate all incoming request bodies and return field-specific error messages for each invalid field
4. WHEN the Frontend_App receives validation errors from the Backend_API, THE Frontend_App SHALL map the errors to corresponding form fields and display the messages
5. THE Frontend_App SHALL display toast notifications for successful operations (create, update, delete) and for server errors

### Requirement 23: Multi-Theme Management

**User Story:** As an Admin, I want to switch between multiple pre-built theme presets without developer intervention, so that the platform appearance can be refreshed to match seasons, promotions, or brand preferences.

#### Acceptance Criteria

1. THE CMS_Service SHALL provide at least 5 theme presets: Dark Premium (default), Light Elegant, Midnight Blue, Warm Gold, and Forest Green
2. WHEN an Admin selects a theme preset from the theme management page, THE CMS_Service SHALL persist the selected theme and the Frontend_App SHALL apply the theme globally on next page load
3. WHEN an Admin customizes a theme preset by modifying primary color, secondary color, accent color, background color, and text color, THE CMS_Service SHALL persist the custom values and apply them as overrides to the selected preset
4. THE Frontend_App SHALL apply the active theme configuration to all pages including navigation, cards, buttons, backgrounds, typography, and component styling
5. WHEN an Admin previews a theme before applying, THE CMS_Service SHALL return the preview configuration and the Frontend_App SHALL display a live preview without persisting changes
6. THE CMS_Service SHALL store theme configuration as structured data (JSON) allowing full customization of color palette, border radius, shadow intensity, glassmorphism opacity, and animation speed

### Requirement 24: Logo and Branding Management

**User Story:** As an Admin, I want to upload and manage logos and branding assets for various placements across the platform, so that branding can be updated without developer involvement.

#### Acceptance Criteria

1. WHEN an Admin uploads a primary logo (header), THE CMS_Service SHALL persist the image and the Frontend_App SHALL display the uploaded logo in the navigation header
2. WHEN an Admin uploads a secondary logo (footer, email, invoice), THE CMS_Service SHALL persist the image and apply the logo to the corresponding placements
3. WHEN an Admin uploads a favicon, THE CMS_Service SHALL persist the image and the Frontend_App SHALL update the browser favicon
4. WHEN an Admin uploads a mobile logo (compact version for small screens), THE CMS_Service SHALL persist the image and the Frontend_App SHALL use the mobile logo on viewports below 768px
5. WHEN an Admin uploads an admin panel logo, THE CMS_Service SHALL persist the image and display the logo in the admin sidebar and admin login page
6. THE CMS_Service SHALL validate uploaded logo images for acceptable formats (PNG, SVG, JPEG, WebP) and maximum file size (2MB)
7. THE CMS_Service SHALL store fallback default logos that display when no custom logo has been uploaded

### Requirement 25: Static Pages CMS (About Us, Contact Us, and Custom Pages)

**User Story:** As an Admin, I want to create and manage static pages (About Us, Contact Us, Terms, Privacy Policy, and custom pages) through the CMS, so that all site content is admin-controlled without developer changes.

#### Acceptance Criteria

1. WHEN an Admin creates or updates the About Us page content (rich text, images, team members, company story), THE CMS_Service SHALL persist the content and the Frontend_App SHALL render the updated About Us page
2. WHEN an Admin creates or updates the Contact Us page (address, phone, email, map embed placeholder, contact form fields), THE CMS_Service SHALL persist the content and the Frontend_App SHALL render the updated Contact Us page
3. WHEN a visitor submits the Contact Us form with name, email, phone, subject, and message, THE Platform SHALL store the enquiry and make it available in the Admin enquiry management section
4. WHEN an Admin creates a custom static page with title, slug, content, and visibility setting, THE CMS_Service SHALL persist the page and make it accessible at the configured URL slug
5. WHEN an Admin updates the visibility of a static page to "Hidden", THE CMS_Service SHALL remove the page from navigation and return HTTP 404 for direct URL access
6. THE CMS_Service SHALL support rich text editing with formatting, image embedding, and link insertion for all static page content
7. WHEN an Admin manages Terms & Conditions or Privacy Policy pages, THE CMS_Service SHALL persist the content with a version timestamp for compliance purposes

### Requirement 26: Activity Logging and Audit Trail

**User Story:** As an Admin, I want comprehensive activity logging and audit trails, so that I can track all significant platform actions for security, compliance, and troubleshooting.

#### Acceptance Criteria

1. THE Platform SHALL log all authentication events (login success, login failure, logout, password reset, token refresh) with user identifier, timestamp, IP address, and outcome
2. THE Platform SHALL log all administrative actions (user approval/rejection, product create/update/delete, order status changes, CMS updates, employee changes, role changes, permission changes) with the acting Admin identifier and timestamp
3. THE Platform SHALL log all order lifecycle events (placement, confirmation, status changes, cancellation) with user identifier and timestamp
4. WHEN an Admin views the activity log, THE Dashboard_Service SHALL return paginated log entries with filtering by action type, user, date range, and module
5. THE Platform SHALL implement application-level logging using SLF4J with structured log output for all service-layer operations including: method entry/exit for key business operations, error details with stack traces, and request correlation IDs
6. IF a critical error occurs (database connection failure, authentication service failure, unhandled exception), THEN THE Platform SHALL log the error at ERROR level with full context and the application SHALL continue operating for unaffected features

### Requirement 27: Store Locator

**User Story:** As a Customer, I want to search and find physical store locations by city or area, so that I can visit a nearby store to see products in person.

#### Acceptance Criteria

1. WHEN an Admin creates a new store location with name (maximum 100 characters), address (maximum 200 characters), city (maximum 50 characters), state (maximum 50 characters), phone, email, map coordinates placeholder, and operating hours, THE Store_Service SHALL persist the store location and make it available for customer search
2. WHEN an Admin updates an existing store location's details, THE Store_Service SHALL persist the changes and reflect the updated information in customer-facing store listings
3. WHEN an Admin deletes a store location, THE Store_Service SHALL remove the store from the active listings and exclude it from search results
4. WHEN a Customer searches for stores by city name, THE Store_Service SHALL perform a case-insensitive partial match against the city field and return all active store locations matching the specified city, ordered alphabetically by store name
5. WHEN a Customer searches for stores by area or partial address, THE Store_Service SHALL perform a case-insensitive partial match against city, state, and address fields, and return matching active store locations ordered alphabetically by store name
6. WHEN a Customer views the store locator page, THE Frontend_App SHALL display a paginated list (20 stores per page) of all active stores with name, address, city, state, phone, email, and operating hours
7. IF a store creation or update request is missing any required field (name, address, city, state, phone), THEN THE Store_Service SHALL reject the request and return a validation error indicating which required fields are missing
8. IF a store creation or update request contains an invalid phone number or email format, THEN THE Store_Service SHALL reject the request and return a validation error indicating which fields have invalid format
9. WHEN an Admin views the store management page, THE Store_Service SHALL return a paginated list (20 items per page) of all store locations with search and filter capabilities by city and state
10. IF a Customer search for stores returns no matching results, THEN THE Store_Service SHALL return an empty result set and THE Frontend_App SHALL display a message indicating no stores were found for the given search term

### Requirement 28: Contact Us Enquiry Management

**User Story:** As an Admin, I want to manage customer enquiries submitted through the Contact Us form with status tracking and response capability, so that all customer communications are handled efficiently.

#### Acceptance Criteria

1. WHEN a visitor or Customer submits the Contact Us form with name, email, phone, subject, and message, THE Platform SHALL create an Enquiry with status "New" and persist it in the database with the submission timestamp
2. WHEN an Admin views the enquiry management page, THE Platform SHALL display a paginated list of all enquiries showing 20 enquiries per page with filtering by status (New, In Progress, Resolved, Closed), ordered by submission date descending
3. WHEN an Admin opens an enquiry, THE Platform SHALL display the full enquiry details including customer name, email, phone, subject, message, submission date, current status, and response history
4. WHEN an Admin updates an enquiry status, THE Platform SHALL only allow transitions from "New" to "In Progress", from "In Progress" to "Resolved" or "Closed", and from "Resolved" to "Closed", and SHALL persist the status change with a timestamp and the Admin identifier
5. WHEN an Admin responds to an enquiry with a reply message of 1 to 5000 characters, THE Platform SHALL persist the response, associate it with the enquiry and the Admin identifier, record the response timestamp, and update the status to "In Progress" if currently "New"
6. WHEN an Admin marks an enquiry as "Resolved" or "Closed", THE Platform SHALL persist the status change and record the resolution timestamp
7. WHEN a visitor or Customer submits the Contact Us form, THE Platform SHALL validate that the submission includes name (1 to 100 characters), email (valid email format, up to 254 characters), subject (1 to 200 characters), and message (1 to 5000 characters), with phone as optional (up to 20 characters)
8. IF a Contact Us form submission contains missing required fields or an invalid email format, THEN THE Platform SHALL reject the submission and return field-specific validation errors indicating which fields failed and why
9. WHEN an Admin searches enquiries by customer name, email, or subject keyword with a search term of at least 2 characters, THE Platform SHALL return matching enquiries with pagination of 20 results per page ordered by submission date descending
10. IF an Admin attempts an invalid status transition, THEN THE Platform SHALL reject the update and indicate that the requested status transition is not permitted

### Requirement 29: Customer Feedback and Rating System

**User Story:** As a Customer, I want to submit feedback and ratings for products or the platform, so that I can share my experience and help other customers make informed decisions.

#### Acceptance Criteria

1. WHEN an authenticated Customer submits feedback with a rating (1-5 stars), a title (between 3 and 100 characters), a comment (between 10 and 2000 characters), and an optional product reference, THE Feedback_Service SHALL persist the feedback with status "Pending Review"
2. IF an authenticated Customer attempts to submit more than one feedback entry for the same product, THEN THE Feedback_Service SHALL reject the submission and return a validation error indicating that feedback has already been submitted for that product
3. WHEN an Admin views the feedback management page, THE Feedback_Service SHALL display a paginated list (20 entries per page) of all feedback entries with filtering by status (Pending Review, Approved, Rejected), rating, and product reference
4. WHEN an Admin approves a feedback entry, THE Feedback_Service SHALL update the status to "Approved" and make the feedback visible on the public-facing product page or testimonials section
5. WHEN an Admin rejects a feedback entry, THE Feedback_Service SHALL update the status to "Rejected" and exclude the feedback from public display
6. WHEN an Admin responds to a feedback entry with a reply, THE Feedback_Service SHALL persist the response and associate it with the original feedback
7. WHEN a Customer views a product detail page, THE Frontend_App SHALL display approved feedback entries for that product (paginated at 10 per page, ordered by most recent submission date first) showing rating, title, comment, customer first name, and submission date
8. THE Feedback_Service SHALL calculate and display the average rating for each product based on all approved feedback entries, rounded to one decimal place with half-star precision in display
9. THE Feedback_Service SHALL validate that the rating value is an integer between 1 and 5 (inclusive), that the title is between 3 and 100 characters, and that the comment is between 10 and 2000 characters
10. IF a feedback submission contains an invalid rating or fields that do not meet length requirements, THEN THE Feedback_Service SHALL reject the submission and return validation errors indicating which fields failed and why
11. THE Frontend_App SHALL display a star rating component for feedback submission (whole stars only) and for average rating display (half-star precision)

### Requirement 30: Company Achievements and Milestones Display

**User Story:** As an Admin, I want to manage and showcase company achievements and milestones, so that customers can see the company's credibility and track record.

#### Acceptance Criteria

1. WHEN an Admin creates a new achievement with title (max 100 characters), description (max 500 characters), icon (Base64 image, max 2MB), year (between 1900 and the current year inclusive), and metric value (max 50 characters), THE Achievement_Service SHALL persist the achievement
2. IF an Admin submits an achievement creation or update request with any required field missing or exceeding its defined length or size limit, THEN THE Achievement_Service SHALL reject the request and return an error message indicating which fields are invalid
3. WHEN an Admin updates an existing achievement's details, THE Achievement_Service SHALL persist the changes and reflect the updated information in the display sections
4. WHEN an Admin deletes an achievement, THE Achievement_Service SHALL remove the achievement from all display sections
5. WHEN an Admin sets the display order of achievements, THE Achievement_Service SHALL persist the sort order and the Frontend_App SHALL render achievements in the specified order
6. WHEN a Customer views the homepage, THE Frontend_App SHALL display the achievements section showing all active achievements with animated counter effects for metric values
7. WHEN a Customer navigates to the achievements page, THE Frontend_App SHALL display all achievements in a detailed layout with title, description, icon, year, and metric value
8. THE Achievement_Service SHALL support metric display formats including numeric with suffix (e.g., "10,000+"), plain text, and percentage values
9. WHEN the achievements section scrolls into the browser viewport, THE Frontend_App SHALL animate achievement metric values using a count-up animation that completes within 2 seconds
10. WHEN an Admin enables or disables an achievement, THE Achievement_Service SHALL update the visibility and the Frontend_App SHALL show or hide the achievement accordingly

### Requirement 31: Product Hover Quick-View with Dynamic Pricing

**User Story:** As a Customer, I want to quickly preview product details and select options with live price updates by hovering over product cards, so that I can compare variants without navigating to separate pages.

#### Acceptance Criteria

1. WHEN a Customer hovers over a product card in the catalog grid for at least 300ms, THE Frontend_App SHALL display a popup/popover showing the product quick-view with product name, image, base price, and variant selection options (material, size, color), with the first available option in each variant category pre-selected by default
2. WHEN a Customer selects a material option in the quick-view popup, THE Frontend_App SHALL update the displayed price within 500ms based on the selected material and current size/color combination
3. WHEN a Customer selects a size option in the quick-view popup, THE Frontend_App SHALL update the displayed price within 500ms based on the selected size and current material/color combination
4. WHEN a Customer selects a color option in the quick-view popup, THE Frontend_App SHALL update the displayed price within 500ms based on the selected color and current material/size combination
5. THE Product_Service SHALL support variant-level pricing where each unique combination of material, size, and color for a product can have a distinct price
6. WHEN a Customer selects a variant combination that has no configured price, THE Frontend_App SHALL display the base product price with a "Price on request" indicator
7. THE Frontend_App SHALL animate the quick-view popup entrance with a scale-up and fade-in transition lasting between 150ms and 300ms, and exit with a scale-down and fade-out transition lasting between 150ms and 300ms
8. WHEN a Customer clicks "Add to Cart" in the quick-view popup, THE Cart_Service SHALL add the product with the selected variant (material, size, color) and the corresponding variant price to the cart, and THE Frontend_App SHALL display a confirmation indicator acknowledging the item was added
9. WHEN the Customer moves the cursor away from the product card area and the quick-view popup, THE Frontend_App SHALL dismiss the quick-view popup after a 300ms delay to prevent flickering
10. WHEN an Admin manages a product, THE Product_Service SHALL provide a variant pricing matrix interface where the Admin can set, update, and remove prices for each material-size-color combination
11. IF the price calculation or retrieval fails when a Customer selects a variant option, THEN THE Frontend_App SHALL display the last known price with an indicator that the price could not be updated and retain the Customer's current variant selections

### Requirement 32: Base64 Compressed Image Storage

**User Story:** As a platform operator, I want all images stored as Base64-encoded compressed data directly in the H2 database, so that Phase 1 deployment requires no external file system or cloud storage dependencies.

#### Acceptance Criteria

1. WHEN an Admin uploads an image (product image, banner, logo, category icon, store image, achievement icon), THE Backend_API SHALL compress the image, encode it as a Base64 string, and persist it in the H2 database
2. WHEN the Frontend_App requests an image resource, THE Backend_API SHALL return the Base64-encoded image data and the Frontend_App SHALL render the image using a data URI (data:image/{format};base64,{data})
3. THE Backend_API SHALL compress uploaded raster images (JPEG, PNG, WebP) to a maximum of 500KB after compression while preserving minimum dimensions of 100x100 pixels, and SHALL store SVG images as their original UTF-8 text encoded to Base64 without lossy compression
4. IF a raster image cannot be compressed to 500KB or below without reducing dimensions below 100x100 pixels, THEN THE Backend_API SHALL reject the upload and return an error indicating the image cannot meet storage constraints
5. THE Backend_API SHALL validate uploaded image formats (JPEG, PNG, WebP, SVG) and reject unsupported formats with a validation error
6. THE Backend_API SHALL validate uploaded image file size (maximum 5MB before compression) and reject oversized uploads with a size limit error
7. THE Backend_API SHALL store image metadata (original filename, MIME type, width and height in pixels, upload timestamp, associated entity reference) alongside the Base64 data
8. WHEN the database is seeded with sample data, THE Platform SHALL include sample product images, category icons, and banner images as pre-encoded Base64 data
9. THE Frontend_App SHALL include Cache-Control headers with a max-age of 86400 seconds (24 hours) on image responses to minimize repeated Base64 data transfers for previously loaded images
10. IF an image upload fails compression or encoding, THEN THE Backend_API SHALL reject the upload and return an error indicating the failure reason

### Requirement 33: Enhanced Granular Role-Based Permissions per Entity

**User Story:** As a Super_Admin or Admin, I want to configure CRUD permissions (Create, Read, Update, Delete) independently for every entity in the system per role, so that access control is precise and tailored to organizational needs.

#### Acceptance Criteria

1. THE Backend_API SHALL enforce CRUD_Permission checks (Create, Read, Update, Delete) independently for each entity type: products, categories, orders, users, employees, CMS pages, banners, store locations, feedback, achievements, enquiries, reports, settings, themes, and logos
2. WHEN a Super_Admin or Admin configures permissions for a role, THE User_Service SHALL provide a Permission_Matrix UI showing a grid of all entities (rows) against CRUD operations (columns) with toggle controls
3. WHEN an Admin updates the Permission_Matrix for a role, THE User_Service SHALL persist the permission changes and enforce them on all subsequent API requests for users of that role within 5 seconds of the change being saved, including requests from currently active sessions
4. WHEN an Employee, Customer, or Admin makes an API request, THE Backend_API SHALL check the entity-specific CRUD permission for the user's role (and any per-user overrides) before processing the request
5. IF a user attempts an operation (Create, Read, Update, or Delete) on an entity for which the user's role lacks the corresponding permission and no per-user override grants it, THEN THE Backend_API SHALL return HTTP 403 Forbidden with an error message indicating insufficient permissions for the specific entity and operation
6. THE Permission_Matrix SHALL support per-user overrides where a Super_Admin or Admin can grant or deny specific CRUD permissions to an individual user that override their role-level defaults, where a deny override takes precedence over a role-level grant, and a grant override takes precedence over a role-level deny
7. WHEN a Super_Admin views the Permission_Matrix, THE User_Service SHALL display the complete matrix for all roles with the ability to modify permissions for Admin, Employee, and Customer roles
8. WHEN an authenticated user requests their permission set, THE Backend_API SHALL return the complete resolved permission set (combining role-level and per-user overrides) for that user within 500 milliseconds, enabling the Frontend_App to render UI elements conditionally based on granted permissions
9. THE Super_Admin role SHALL always have full CRUD access to all entities regardless of Permission_Matrix configuration and SHALL NOT be restrictable
10. WHEN a new role is created, THE User_Service SHALL assign no CRUD permissions (all denied) by default for all entities until a Super_Admin or Admin explicitly grants permissions via the Permission_Matrix

### Requirement 34: Server-Side Cart Persistence on Re-login

**User Story:** As a Customer, I want my shopping cart fully stored on the server so that when I log back in from any device, my cart is completely restored without dependency on browser localStorage.

#### Acceptance Criteria

1. THE Cart_Service SHALL persist all cart data (items, quantities, selected variants, prices, timestamps) exclusively in the H2 database associated with the authenticated customer's account
2. WHEN a Customer logs in from any device or browser, THE Cart_Service SHALL retrieve the complete cart state from the H2 database and return it to the Frontend_App for display
3. WHEN a Customer adds, updates, or removes a cart item, THE Cart_Service SHALL immediately persist the change to the H2 database before returning the response to the Frontend_App
4. THE Frontend_App SHALL NOT use localStorage or sessionStorage as the primary data store for cart contents; Redux state is synchronized from the backend and serves as a read-through cache only
5. WHEN a Customer logs out and logs back in on a different device, THE Cart_Service SHALL return the identical cart contents that existed before logout
6. WHEN a Customer has items in the cart and the browser localStorage is cleared, THE Cart_Service SHALL still return the complete cart upon next API request using only the authenticated session
7. THE Cart_Service SHALL store cart item timestamps to support "added X days ago" display and to allow automatic removal of items older than a configurable threshold (default: 90 days)

### Requirement 35: No AI Tool Attribution

**User Story:** As a platform operator, I want the application to contain no references to AI tools or code generation tools, so that the platform presents as a professionally developed custom application.

#### Acceptance Criteria

1. THE Platform SHALL NOT contain any reference to "Kiro", "AI-generated", "AI-assisted", "code generation tool", or any similar AI attribution in any user-facing UI text, page content, footer, header, or about section
2. THE Platform codebase SHALL NOT contain comments, annotations, metadata, or configuration values referencing AI tools, code generators, or automated code creation
3. THE Platform SHALL NOT include any HTML meta tags, headers, or hidden elements that reference AI tools or code generation
4. THE Platform build artifacts SHALL NOT contain any AI attribution markers in compiled assets, bundle metadata, or deployment descriptors
5. WHEN the database is seeded with sample data, THE Platform SHALL NOT include any references to AI tools in sample content, placeholder text, or default CMS page content

### Requirement 36: Wishlist Management

**User Story:** As a Customer, I want to save products to a wishlist, so that I can easily find and purchase them later.

#### Acceptance Criteria

1. WHEN an authenticated Customer adds a product to the wishlist, THE Platform SHALL persist the wishlist entry in the H2 database associated with the customer's account
2. WHEN a Customer views the wishlist page, THE Frontend_App SHALL display all wishlist items with product name, image, price, availability status, and date added
3. WHEN a Customer removes a product from the wishlist, THE Platform SHALL delete the wishlist entry and update the display
4. WHEN a Customer clicks "Move to Cart" on a wishlist item, THE Cart_Service SHALL add the product to the cart and THE Platform SHALL remove the item from the wishlist
5. THE Frontend_App SHALL display a filled heart icon on product cards and product detail pages for products already in the customer's wishlist
6. WHEN a Customer adds or removes a wishlist item, THE Frontend_App SHALL update the wishlist icon badge count in the navigation bar
7. THE Platform SHALL persist wishlist data server-side in the H2 database so that the wishlist is fully available on re-login from any device

### Requirement 37: Internationalization and Multi-Language Support

**User Story:** As a Customer, I want to browse the platform in my preferred language (English, Hindi, or Gujarati), so that I can comfortably understand product information and navigate the platform in my native language.

#### Acceptance Criteria

1. THE Frontend_App SHALL support three languages: English (en), Hindi (hi), and Gujarati (gu), with English as the default language
2. WHEN a visitor or Customer selects a language from the language switcher in the navigation bar, THE Frontend_App SHALL immediately render all UI labels, buttons, navigation text, form labels, error messages, and static content in the selected language
3. WHEN a Customer registers, THE Platform SHALL allow the customer to select their preferred language, and THE User_Service SHALL persist this preference to the user profile
4. WHEN a Customer logs in, THE Frontend_App SHALL load the platform in the customer's saved preferred language
5. THE Frontend_App SHALL implement internationalization using a resource bundle / i18n library (e.g., react-i18next) with separate translation files for each supported language
6. THE Backend_API SHALL return validation error messages and system messages in the language specified by the Accept-Language header or a language query parameter
7. WHEN an Admin manages product content (name, description, specifications), THE Product_Service SHALL support storing translations for each supported language, and THE Frontend_App SHALL display product content in the customer's selected language
8. WHEN a translated product field is not available in the selected language, THE Frontend_App SHALL fall back to the English version of that field
9. THE Frontend_App SHALL persist the selected language preference in the browser (localStorage) for unauthenticated visitors so that the preference is retained across page reloads
10. WHEN a Customer searches for products, THE Search_Service SHALL search across all language variants of product names and descriptions to return relevant results regardless of the language the query is written in
11. WHEN a Customer applies filters or sorts products, THE Frontend_App SHALL display filter labels, sort options, and category names in the selected language
12. THE CMS_Service SHALL support multi-language content for homepage sections, banners, static pages, and navigation menus, allowing Admins to provide translations for each supported language
13. WHEN an Admin manages CMS content, THE CMS_Service SHALL provide a language tab interface allowing the Admin to enter content in each supported language independently


### Requirement 38: File and Media Picker for Image and Video Upload

**User Story:** As an Admin, I want a dedicated file/image picker UI to browse and select images and short videos from my device, so that media is uploaded through a controlled interface rather than relying on external or unknown sources.

#### Acceptance Criteria

1. THE Frontend_App SHALL provide a file picker component (file input dialog) that allows Admins to browse and select image files (JPEG, PNG, WebP, SVG) and short video files (MP4, WebM, maximum 10 seconds duration) from their local device
2. WHEN an Admin clicks an upload button or drag-and-drop zone in any media upload area (product images, banners, logos, category icons, store images, achievement icons), THE Frontend_App SHALL open the native file picker dialog filtered to accept only supported image and video formats
3. WHEN an Admin selects a file through the picker, THE Frontend_App SHALL display a preview of the selected image or video before upload, allowing the Admin to confirm or cancel the selection
4. THE Frontend_App SHALL validate selected files client-side before upload: image files must be JPEG, PNG, WebP, or SVG with maximum size 5MB; video files must be MP4 or WebM with maximum size 10MB and maximum duration 10 seconds
5. IF an Admin selects a file that does not meet format, size, or duration constraints, THEN THE Frontend_App SHALL display an inline error message specifying which constraint was violated and SHALL NOT submit the upload
6. WHEN an Admin uploads a video file, THE Backend_API SHALL validate the video duration (maximum 10 seconds), format (MP4, WebM), and size (maximum 10MB), compress the video, encode it as Base64, and persist it in the H2 database
7. THE Frontend_App SHALL support drag-and-drop file upload as an alternative to the file picker button, with visual feedback (drop zone highlight) when a file is dragged over the upload area
8. WHEN an Admin uploads multiple product images, THE Frontend_App SHALL allow selecting multiple files in a single picker operation and display all selected files with individual preview thumbnails and remove buttons
9. THE Frontend_App SHALL display an upload progress indicator during the Base64 encoding and server persistence process
10. THE Backend_API SHALL validate all uploaded media server-side (format, size, duration for videos) regardless of client-side validation and return appropriate validation errors for rejected files
11. WHEN an Admin views media already uploaded for a product or entity, THE Frontend_App SHALL display existing media in a gallery grid with options to reorder, delete, or replace individual items

### Requirement 39: Default Super Admin Credentials and Initial Login

**User Story:** As the platform operator performing first-time setup, I want a pre-configured Super Admin account with known default credentials, so that I can log in immediately after deployment and configure the platform.

#### Acceptance Criteria

1. WHEN the application starts with an empty database, THE Platform SHALL create a default Super Admin account with email "admin@glydecurtains.com" and password "admin123" (hashed with BCrypt), status "Approved", and role "SUPER_ADMIN"
2. THE default Super Admin account SHALL be the only account that can log in immediately after initial deployment without any approval workflow
3. WHEN the default Super Admin logs in for the first time, THE Frontend_App SHALL display a prominent notification recommending an immediate password change for security purposes
4. THE Super Admin SHALL be able to change their password from the profile settings page at any time
5. WHEN the Super Admin creates Employee accounts, THE User_Service SHALL allow the Super Admin to set an initial password for the employee, and THE Employee SHALL be able to change this password after their first login
6. WHEN the Super Admin or Admin creates Employee or Admin accounts, THE User_Service SHALL create the account with status "Approved" (bypassing the approval workflow) and assign the specified role and password
7. THE Platform SHALL NOT create any other default accounts (no default Admin, Employee, or Customer accounts) — the Super Admin creates all additional accounts after initial login
8. THE default Super Admin password "admin123" SHALL meet an exception to the normal password strength requirements for initial seeding only; all subsequent password changes SHALL enforce the standard strength requirements (minimum 8 characters, uppercase, lowercase, digit, special character)


### Requirement 40: Bundled Logo Usage Across Platform

**User Story:** As a platform operator, I want the application to use the bundled logo file (`logo/logo.jpg`) across all relevant placements (header, footer, admin panel, login page, invoices, favicon area), so that branding is consistent and available immediately without requiring Admin upload.

#### Acceptance Criteria

1. THE Platform SHALL include the file `logo/logo.jpg` as a bundled static asset in the frontend project, and THE Frontend_App SHALL use this logo as the default logo across all placements until an Admin uploads a replacement via the CMS
2. THE Frontend_App SHALL display the bundled logo in the navigation header at an appropriate size for desktop (height 48-56px) and a compact version for mobile (height 32-40px)
3. THE Frontend_App SHALL display the bundled logo in the footer at a smaller size (height 36-44px) with appropriate opacity or styling to match the footer design
4. THE Frontend_App SHALL display the bundled logo on the login and registration pages as a prominent brand element (centered, larger size, height 80-120px)
5. THE Frontend_App SHALL display the bundled logo in the admin panel sidebar at an appropriate compact size (height 36-44px)
6. THE Backend_API SHALL use the bundled logo when generating PDF invoices, placing it in the invoice header area
7. WHEN an Admin uploads a custom logo via the CMS Site Settings, THE Platform SHALL override the bundled logo with the uploaded logo for the corresponding placement (header, footer, mobile, admin, or favicon)
8. IF no custom logo has been uploaded for a specific placement, THEN THE Platform SHALL fall back to the bundled `logo/logo.jpg` for that placement
9. THE Frontend_App SHALL render the logo with appropriate CSS styling to ensure it looks elegant and premium across both dark and light themes (e.g., subtle shadow, rounded corners if appropriate, proper spacing)

### Requirement 41: Invoice Generation Controlled by Admin

**User Story:** As an Admin, I want to generate professional PDF invoices for customer orders with customizable invoice settings, so that customers receive formal purchase documentation and the business has proper sales records.

#### Acceptance Criteria

1. WHEN an Admin views an order detail page and clicks "Generate Invoice", THE Backend_API SHALL generate a PDF invoice for that order containing: company logo, company name and address, invoice number (auto-generated), invoice date, customer name and address, order number, line items (product name, quantity, unit price, subtotal), grand total, and any applicable notes
2. WHEN a Customer views their order detail page for an order with status "Confirmed" or later, THE Frontend_App SHALL display a "Download Invoice" button that triggers invoice PDF generation and download
3. THE Backend_API SHALL generate invoices using a server-side PDF library (e.g., iText, OpenPDF, or Thymeleaf HTML-to-PDF) with the bundled `logo/logo.jpg` or the Admin-uploaded logo in the header
4. WHEN an Admin configures invoice settings in the CMS, THE Platform SHALL allow customization of: company name, company address, company phone, company email, tax registration number (optional), invoice footer text, invoice terms and conditions text, and whether to include logo on invoices
5. THE Backend_API SHALL auto-generate unique invoice numbers in a sequential format configurable by Admin (default format: INV-YYYYMMDD-NNNN)
6. WHEN an Admin enables or disables invoice generation for customers, THE CMS_Service SHALL persist the setting and THE Frontend_App SHALL show or hide the "Download Invoice" button on customer order pages accordingly
7. THE generated invoice PDF SHALL include the platform branding (logo, colors consistent with active theme) and be formatted for A4 paper size
8. WHEN an Admin views the order management page, THE Admin SHALL be able to bulk-generate invoices for multiple selected orders
9. THE Backend_API SHALL store generated invoices as Base64-encoded PDF data in the H2 database, associated with the corresponding order, so that repeated downloads serve the cached version rather than regenerating
10. WHEN an Admin updates invoice settings (company info, footer text, terms), THE changes SHALL apply to all newly generated invoices but SHALL NOT retroactively modify previously generated and stored invoices
11. THE invoice SHALL display line items with: product name, selected variant (material, size, color if applicable), quantity, unit price, line subtotal, and the order grand total at the bottom
12. THE Backend_API SHALL enforce CRUD_Permission checks on invoice generation — only users with "Create" permission on the "invoices" entity can generate invoices, and only users with "Read" permission can download them


### Requirement 42: Dockerized Deployment with CI/CD Pipeline and Environment Configuration

**User Story:** As a DevOps engineer, I want the application to be fully containerized with Docker, configured for multiple environments (INT, QA, PROD), and ready for CI/CD pipeline integration, so that deployments are automated, reproducible, and scalable.

#### Acceptance Criteria

1. THE Platform SHALL include a `Dockerfile` for the backend (Spring Boot) that builds a production-ready container image using a multi-stage build (build stage with Maven + runtime stage with JRE 21 slim)
2. THE Platform SHALL include a `Dockerfile` for the frontend (React) that builds a production-ready container image using a multi-stage build (build stage with Node + runtime stage with Nginx serving static files)
3. THE Platform SHALL include a `docker-compose.yml` that orchestrates both backend and frontend containers with proper networking, environment variable injection, health checks, and volume mounts
4. THE Platform SHALL include environment-specific configuration profiles: `application-int.yml` (Integration), `application-qa.yml` (QA/Staging), and `application-prod.yml` (Production) with appropriate settings for each environment
5. THE `application-prod.yml` SHALL configure the application for the production domain `glydecurtains.com` with HTTPS enforcement, secure cookie settings, strict CORS policy allowing only `https://glydecurtains.com`, and production-appropriate logging levels
6. THE `application-int.yml` SHALL configure relaxed CORS for development, debug logging, and H2 console access enabled
7. THE `application-qa.yml` SHALL mirror production configuration with QA-specific logging and test data seeding enabled
8. THE Platform SHALL include a `.env.example` file documenting all required environment variables (JWT secret, database credentials placeholder, CORS origins, active profile, server port) with placeholder values
9. THE Platform SHALL include CI/CD pipeline configuration files: `.github/workflows/ci.yml` (GitHub Actions) with stages for build, test, lint, Docker image build, and push to container registry
10. THE CI/CD pipeline SHALL include separate deployment jobs for INT, QA, and PROD environments triggered by branch conventions: `develop` → INT, `release/*` → QA, `main` → PROD (manual approval gate)
11. THE frontend Nginx configuration SHALL serve the React SPA with proper routing (fallback to index.html for client-side routes), gzip compression, cache headers for static assets, and security headers
12. THE Platform SHALL include a `docker-compose.prod.yml` override for production-specific settings (resource limits, restart policies, log drivers)
13. THE application SHALL be horizontally scalable — stateless backend design (JWT-based auth, no server-side HTTP sessions) allows running multiple container instances behind a load balancer
14. THE Platform SHALL include a `Makefile` or `scripts/` directory with common development commands: `make build`, `make run`, `make test`, `make docker-build`, `make docker-up`, `make docker-down`

### Requirement 43: Version Control and Release Management

**User Story:** As a platform operator, I want the codebase to follow proper version control practices with semantic versioning and release tagging, so that changes are traceable and deployments are reproducible.

#### Acceptance Criteria

1. THE Platform codebase SHALL include a `.gitignore` file excluding build artifacts, IDE files, environment files (.env), node_modules, target/, .h2 database files, and compiled assets
2. THE Platform SHALL include a `CHANGELOG.md` documenting the initial Phase 1 release (v1.0.0) with all features, and providing a template for subsequent release notes following Keep a Changelog format
3. THE Platform SHALL include a `VERSION` file or use Maven/package.json version field set to `1.0.0` for the initial release
4. THE CI/CD pipeline SHALL automatically tag Docker images with the Git commit SHA and semantic version on release builds
5. THE Platform SHALL include a `README.md` with: project overview, tech stack, prerequisites (Java 21, Node 18+, Docker), local development setup instructions, environment configuration guide, Docker deployment instructions, default credentials (admin@glydecurtains.com / admin123), and API documentation link placeholder
6. THE Backend `application.yml` SHALL expose an `/api/health` endpoint returning application version, environment name, and uptime for monitoring purposes
7. THE Platform SHALL use Git branching strategy: `main` (production), `develop` (integration), `release/*` (QA stabilization), `feature/*` (development)

### Requirement 44: Reports and Dashboard Access Controlled by Role Permissions

**User Story:** As an Admin, I want reports and dashboard access to be governed by the same CRUD permission system as all other entities, so that only authorized users can view sensitive business data.

#### Acceptance Criteria

1. THE Backend_API SHALL enforce CRUD_Permission checks on the "reports" entity — only users with "Read" permission on "reports" can access any report endpoint (sales, inventory, user activity, profit/loss, enquiry)
2. THE Backend_API SHALL enforce CRUD_Permission checks on the "dashboard" entity — only users with "Read" permission on "dashboard" can access dashboard summary, charts, and activity feeds
3. WHEN an Employee or Admin without "Read" permission on "reports" attempts to access a report endpoint, THE Backend_API SHALL return HTTP 403 Forbidden
4. WHEN an Employee or Admin without "Read" permission on "dashboard" attempts to access the dashboard endpoint, THE Backend_API SHALL return HTTP 403 Forbidden
5. THE Frontend_App SHALL hide the Dashboard navigation link and Reports navigation link from users who lack "Read" permission on the respective entities
6. THE Permission_Matrix SHALL include "reports" and "dashboard" as independently configurable entities with CRUD permissions (Read is the primary useful operation; Create/Update/Delete are reserved for future export/schedule features)
7. WHEN a Super Admin or Admin configures Employee permissions, THE Permission_Matrix SHALL allow granting or revoking access to "reports" and "dashboard" independently of other module permissions

### Requirement 45: Domain Configuration for glydecurtains.com

**User Story:** As a platform operator, I want the application configured for the production domain `glydecurtains.com`, so that all settings, CORS policies, and branding reference the correct domain.

#### Acceptance Criteria

1. THE `application-prod.yml` SHALL configure CORS allowed origins to `https://glydecurtains.com` and `https://www.glydecurtains.com`
2. THE `application-prod.yml` SHALL set the server context and cookie domain to `glydecurtains.com`
3. THE Frontend production build SHALL set the `PUBLIC_URL` / base path for `glydecurtains.com`
4. THE default site settings seeded in the database SHALL set the site name to "Glyde Curtains" and the site URL to `https://glydecurtains.com`
5. THE generated invoices SHALL display "www.glydecurtains.com" in the company contact section
6. THE Platform README SHALL reference `glydecurtains.com` as the production deployment target
7. THE Frontend Nginx configuration for production SHALL include server_name directives for `glydecurtains.com` and `www.glydecurtains.com`


### Requirement 46: Dedicated Inventory Management System

**User Story:** As an Admin or authorized Employee, I want a dedicated inventory management module separate from product management, so that I can track, adjust, and audit stock levels with full traceability and role-based access control.

#### Acceptance Criteria

1. WHEN an authorized user performs a stock adjustment (add, remove, or set) on a product with a quantity and a reason, THE Inventory_Service SHALL persist the adjustment, update the product stock quantity accordingly, and record the adjustment in the stock audit log with the performer identifier, timestamp, adjustment type, quantity change, resulting stock level, and reason
2. WHEN an authorized user views the stock adjustment history for a product, THE Inventory_Service SHALL return a paginated list of all stock adjustments for that product ordered by timestamp descending, showing adjustment type, quantity change, resulting stock level, reason, performer name, and timestamp
3. WHEN an Admin configures a low-stock threshold for a product, THE Inventory_Service SHALL persist the threshold value and THE Dashboard_Service SHALL include the product in low-stock alerts when the current stock quantity falls at or below the configured threshold
4. WHEN a product's stock quantity falls at or below the configured Low_Stock_Threshold after any stock change (adjustment, order placement, or order cancellation), THE Inventory_Service SHALL generate a low-stock alert visible on the admin dashboard
5. WHEN an authorized user uploads a CSV file containing product identifiers (SKU or product ID) and stock quantities, THE Inventory_Service SHALL validate the file format and contents, perform bulk stock set operations for all valid entries, record each adjustment in the audit log, and return a summary indicating successful updates and any failed rows with error reasons
6. WHEN an authorized user performs a manual bulk stock update by submitting multiple stock adjustments in a single request, THE Inventory_Service SHALL process all adjustments atomically (all succeed or all fail) and record each adjustment in the audit log
7. THE Backend_API SHALL enforce CRUD_Permission checks on the "inventory" entity — only users with the appropriate Create, Read, Update, or Delete permission on "inventory" can access inventory management endpoints
8. WHEN a Super_Admin or Admin configures permissions, THE Permission_Matrix SHALL include "inventory" as an independently configurable entity with full CRUD permissions, allowing fine-grained control over who can view stock levels, perform adjustments, configure thresholds, and delete adjustment history
9. WHEN a product's stock quantity reaches zero, THE Frontend_App SHALL display the product as "Out of Stock" and disable the "Add to Cart" button on the product card, quick-view popup, and product detail page
10. WHILE a product's stock quantity is zero, THE Cart_Service SHALL reject any attempt to add that product to the cart and return an out-of-stock error
11. WHEN an Admin views product listings in the admin panel, THE Frontend_App SHALL display the current stock quantity for each product and highlight products at or below their Low_Stock_Threshold with a visual indicator
12. WHEN an order is placed, THE Inventory_Service SHALL deduct stock for each ordered line item and record the deductions in the audit log with reason "Order placed" and the order number reference
13. WHEN an order is cancelled, THE Inventory_Service SHALL restore stock for each cancelled line item and record the restorations in the audit log with reason "Order cancelled" and the order number reference
14. IF a stock adjustment would result in a negative stock quantity, THEN THE Inventory_Service SHALL reject the adjustment and return an error indicating insufficient stock

### Requirement 47: Seed Demo Customer Account

**User Story:** As a developer or tester, I want a pre-configured demo customer account available on application startup, so that I can immediately test customer-facing features without going through the registration and approval workflow.

#### Acceptance Criteria

1. WHEN the application starts with an empty database, THE Platform SHALL create a Demo_Customer account with email "dk@glydecurtains.com", name "Demo Customer", password "dk" (hashed with BCrypt), status "Approved", and role "CUSTOMER"
2. THE Demo_Customer password "dk" SHALL be an exception to the normal password strength requirements for initial seeding only; all subsequent password changes for this account SHALL enforce the standard strength requirements (minimum 8 characters, uppercase, lowercase, digit, special character)
3. THE Demo_Customer account SHALL function identically to any other approved Customer account — able to browse products, manage wishlist, add items to cart, place orders, submit feedback, and manage profile
4. WHEN the Demo_Customer logs in with email "dk@glydecurtains.com" and password "dk", THE Auth_Service SHALL authenticate the user and issue JWT tokens following the standard authentication flow

### Requirement 48: Comprehensive Backend Unit Tests

**User Story:** As a developer, I want comprehensive JUnit 5 and Mockito unit tests covering all backend service classes, so that business logic is validated, regressions are caught early, and code quality is maintained across all modules.

#### Acceptance Criteria

1. THE Platform SHALL include JUnit 5 + Mockito unit test classes for all backend service implementations: AuthService, UserService, PermissionService, ProductService, CategoryService, SearchService, CartService, OrderService, WishlistService, EmployeeService, StoreService, FeedbackService, AchievementService, EnquiryService, CmsService, ThemeService, DashboardService, InvoiceService, ActivityLogService, TranslationService, ImageService, and InventoryService
2. WHEN unit tests are executed, each test class SHALL mock all repository dependencies and external service dependencies using Mockito, testing only the service layer business logic in isolation
3. THE unit tests for AuthService SHALL cover: successful registration, duplicate email rejection, password strength validation, successful login for approved users, login rejection for non-approved statuses, account lockout after 5 failed attempts, JWT token generation, refresh token lifecycle, logout token invalidation, and password reset flow
4. THE unit tests for UserService SHALL cover: user listing with pagination and filtering, user approval, rejection, suspension, activation, deactivation, role change, password reset, and audit logging of status changes
5. THE unit tests for PermissionService SHALL cover: permission matrix retrieval, role permission updates, user permission overrides, resolved permission set calculation, Super Admin bypass verification, and default no-permission behavior for new roles
6. THE unit tests for ProductService SHALL cover: product creation with all fields, update, delete, archive, activate, deactivate, SKU uniqueness enforcement, specification CRUD, variant pricing CRUD, related and similar product queries, and product flag management
7. THE unit tests for CategoryService SHALL cover: category CRUD, sub-category CRUD, collection CRUD, sort order management, visibility toggle, active status management, and deletion prevention when products are associated
8. THE unit tests for SearchService SHALL cover: name-based search with relevance, multi-filter application, sort options, autocomplete suggestions, recent searches storage, exclusion of deactivated/archived products, and multi-language search
9. THE unit tests for CartService SHALL cover: cart retrieval, item addition with stock validation, quantity update, item removal, cart clearing, price snapshot on add, unavailable product flagging, and cart quantity limit enforcement (maximum 10 per line item)
10. THE unit tests for OrderService SHALL cover: order placement with stock deduction and cart clearing, order status lifecycle transitions (valid and invalid), cancellation with stock restoration, customer order history retrieval, admin order listing with filters, and employee assignment
11. THE unit tests for WishlistService SHALL cover: add to wishlist, remove from wishlist, duplicate prevention (unique constraint), move to cart, and wishlist count
12. THE unit tests for EmployeeService SHALL cover: employee creation with permission assignment, permission updates, suspend, activate, delete (soft deactivation), department assignment, task assignment, and default no-access behavior
13. THE unit tests for StoreService SHALL cover: store CRUD with validation, case-insensitive partial search by city/area, pagination, required field validation, and phone/email format validation
14. THE unit tests for FeedbackService SHALL cover: feedback submission, one-per-product enforcement, approval, rejection, reply, product feedback listing (approved only), and average rating calculation
15. THE unit tests for AchievementService SHALL cover: achievement CRUD, field validation (title length, description length, icon size, year range), display order management, and visibility toggle
16. THE unit tests for EnquiryService SHALL cover: enquiry submission with validation, status transitions (valid and invalid), response persistence, search by name/email/subject, and pagination
17. THE unit tests for CmsService SHALL cover: homepage section management, banner CRUD, site settings update, static page CRUD with slug uniqueness, page visibility management, and scrolling ticker configuration
18. THE unit tests for ThemeService SHALL cover: theme preset retrieval, theme activation, theme config update, and preview flow
19. THE unit tests for DashboardService SHALL cover: summary calculations, recent activity retrieval, chart data generation, low stock product retrieval, and report data generation
20. THE unit tests for InvoiceService SHALL cover: invoice generation with correct content, invoice number sequential generation, cached invoice retrieval, bulk generation, and settings CRUD
21. THE unit tests for ActivityLogService SHALL cover: event logging for authentication, admin actions, and order lifecycle, plus paginated retrieval with filtering
22. THE unit tests for TranslationService SHALL cover: translation storage, retrieval by language, and fallback to English when translation is unavailable
23. THE unit tests for ImageService SHALL cover: image upload validation (format, size), compression, Base64 encoding, retrieval, deletion, and rejection of invalid formats/sizes
24. THE unit tests for InventoryService SHALL cover: stock adjustment operations (add, remove, set), audit log creation, low-stock threshold configuration and alerting, bulk stock update via CSV and manual, negative stock prevention, order placement deduction, and order cancellation restoration
25. WHEN all unit tests are executed via `mvn test` or an equivalent build command, THE test suite SHALL achieve a minimum of 80% line coverage across all service classes

### Requirement 49: Cart Quantity Limit per Line Item

**User Story:** As a platform operator, I want to enforce a maximum quantity of 10 per line item in the shopping cart, so that customers cannot place unreasonably large orders for individual products and inventory is fairly distributed.

#### Acceptance Criteria

1. WHEN a Customer adds a product to the cart with a quantity greater than 10, THE Cart_Service SHALL reject the addition and return an error message indicating the maximum quantity per item is 10
2. WHEN a Customer updates the quantity of an existing cart item to a value greater than 10, THE Cart_Service SHALL reject the update and return an error message indicating the maximum quantity per item is 10
3. WHEN a Customer adds a product that already exists in the cart and the combined quantity would exceed 10, THE Cart_Service SHALL reject the addition and return an error message indicating the maximum quantity per item is 10, including the current quantity in the cart
4. THE Frontend_App SHALL limit the quantity selector on the cart page and quick-view popup to a range of 1 to 10 (inclusive), preventing the user from selecting a quantity outside this range
5. THE Frontend_App SHALL disable the increment button on the quantity selector when the current quantity reaches 10
6. IF a Customer attempts to type a quantity greater than 10 in the quantity input field, THEN THE Frontend_App SHALL display an inline error message stating "Maximum quantity per item is 10" and prevent the form submission
7. THE Backend_API SHALL validate the quantity constraint (1 to 10 inclusive) on both add-to-cart and update-quantity endpoints, returning HTTP 400 with a descriptive error message for violations
