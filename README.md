# RealTreats Bazaar

Build a brand-new full-stack application called RealTreats Marketplace.

This is a separate project from all existing RealTreats applications. Do not merge it with RealTreats POS, RealTreats Hospitality, or any other existing project.

The marketplace name must be editable by the platform super-admin. The initial/default name is RealTreats Marketplace.

1. PLATFORM CONCEPT

Build RealTreats Marketplace as a true multi-tenant marketplace platform where multiple independent vendors can register, operate their own storefronts, upload products, manage inventory and receive orders, while customers can discover products from multiple vendors through one central marketplace.

This is NOT simply an e-commerce website.

The architecture must support:

- Multiple vendors/tenants
- Vendor-specific storefronts
- Vendor-specific products
- Vendor-specific inventory
- Vendor-specific orders and order management
- Central marketplace catalog
- Customer accounts
- Super-admin management
- Product approval workflow
- Location-based discovery
- Dispatch/delivery integration
- Future payment, commission and subscription integrations

Design and build the application as a production-ready foundation that can scale.

---

2. USER ROLES

Implement proper role-based access control.

Super Admin

Initial super-admin:

ubonguiux@gmail.com

Super-admin can:

- Manage marketplace settings
- Change marketplace name
- Manage branding
- Manage vendors
- Approve/reject vendor applications
- Suspend/activate vendors
- View all vendors
- View all products
- Approve/reject products
- Manage categories
- Manage customers
- View all orders
- Manage dispatch settings
- Configure integrations
- View marketplace analytics
- Manage platform settings
- Manage featured products/vendors
- Manage marketplace-wide announcements
- View audit logs

Do NOT rely only on frontend route protection. Enforce authorization at the backend/database level.

Vendor/Tenant

Each vendor is an independent tenant.

Vendor can:

- Register/sign in
- Complete business profile
- Add business/store information
- Upload logo and storefront images
- Set business location
- Manage storefront
- Add products
- Edit products
- Upload product images
- Set prices
- Set stock
- Set SKU
- Assign categories
- Set product descriptions
- Submit products for approval
- View approval status
- Receive orders
- Process orders
- Update order status
- Manage inventory
- View sales
- View customers relevant to their orders
- View delivery information relevant to their orders

A vendor MUST NEVER be able to access another vendor's private data.

Customer

Customers can:

- Register/sign in
- Browse marketplace
- Search products
- Browse categories
- Browse vendors
- View vendor storefronts
- View product details
- Filter products by location
- Filter vendors by location
- Add products to cart
- Checkout
- Place orders
- View order history
- Track order status
- Manage profile
- Save addresses
- Save favourite products/vendors

---

3. MULTI-TENANT DATABASE ARCHITECTURE

Create a proper relational database architecture.

Core entities should include, at minimum:

- users
- profiles
- roles
- vendors
- vendor_users
- vendor_settings
- vendor_locations
- categories
- products
- product_images
- product_categories
- inventory
- product_approval_requests
- carts
- cart_items
- orders
- order_items
- customer_addresses
- deliveries
- delivery_events
- marketplace_settings
- marketplace_branding
- notifications
- audit_logs

Every vendor-owned record must have the appropriate tenant/vendor ID.

Implement proper Row Level Security / database authorization policies.

Examples:

A vendor can SELECT/INSERT/UPDATE only records belonging to their vendor.

A customer can access only their own private account/order/address data.

Super-admin can access marketplace-wide administrative data.

Never trust a vendor_id supplied from the frontend. Determine authorization from the authenticated user's role and tenant relationship.

---

4. VENDOR REGISTRATION

Create a professional vendor onboarding flow.

Vendor registration should collect:

- Business/store name
- Owner name
- Email
- Phone
- Business description
- Business category
- Address
- State
- City
- Country
- GPS coordinates
- Logo
- Storefront image
- Business registration information where applicable

Vendor application status:

- Pending
- Approved
- Rejected
- Suspended

A newly registered vendor should NOT immediately become an active marketplace seller unless approved according to the configured marketplace rules.

Admin must be able to review and approve vendors.

---

5. PRODUCT MANAGEMENT

Vendors must have a full product management dashboard.

Product fields:

- Product name
- Description
- Short description
- SKU
- Price
- Discount price
- Currency
- Category
- Subcategory
- Images
- Stock quantity
- Minimum order quantity
- Availability
- Product location
- Vendor
- Approval status
- Created date
- Updated date

Product statuses:

- Draft
- Pending Approval
- Approved
- Rejected
- Suspended
- Out of Stock

Vendor submits a product.

The product enters:

Pending Approval

Admin reviews it.

Admin can:

Approve

or

Reject with reason

When approved, the product should automatically become available in:

1. The vendor's storefront
2. The central marketplace catalog
3. Relevant category/search results
4. Location-based marketplace discovery

If rejected, the vendor should see the rejection reason and be able to edit/resubmit.

---

6. CENTRAL MARKETPLACE

Create a polished customer-facing marketplace.

Homepage should include:

- Marketplace header
- Search
- Location selector
- Categories
- Featured vendors
- Featured products
- Nearby products
- Nearby vendors
- Popular products
- Recently added products
- Promotional sections
- Responsive product grids

Every product card should clearly communicate:

- Product image
- Product name
- Price
- Discount where applicable
- Vendor name
- Vendor rating where implemented
- Location/distance where available
- Availability
- Add-to-cart action

Do not make the interface cluttered.

---

7. LOCATION & GOOGLE MAPS

Integrate Google Maps / Google Maps Platform.

The system should support:

- Vendor GPS coordinates
- Customer location
- Vendor map markers
- Product/vendor location discovery
- Location search
- Distance calculation
- Nearby vendor filtering
- Nearby product filtering
- Map/list view
- Delivery destination selection

Marketplace filters should include options such as:

Near Me

Within 5 km

Within 10 km

Within 25 km

City

State

The location system must be designed so that products inherit/use their vendor's location by default, while allowing future product-specific location support.

Never expose Google API secrets in frontend source code.

Use environment variables/configuration for API keys.

If Google Maps credentials are unavailable, the application must still work without crashing. Display an appropriate configuration state and allow the rest of the marketplace to function.

---

8. DISPATCH / DELIVERY INTEGRATION

Create a proper delivery abstraction layer.

Do NOT hard-code the marketplace to one dispatch company.

Create a delivery provider architecture that can support different providers.

A delivery record should support:

- Order ID
- Pickup location
- Delivery location
- Customer
- Vendor
- Delivery fee
- Dispatch provider
- Driver/rider
- Tracking reference
- Delivery status
- Estimated delivery time
- Pickup time
- Delivery time
- Delivery events

Delivery statuses:

- Pending
- Requested
- Assigned
- Driver En Route
- Picked Up
- In Transit
- Delivered
- Failed
- Cancelled

Create an admin area where dispatch integrations can eventually be configured.

If no external dispatch API is configured yet, implement a Manual Dispatch Mode so the marketplace can still be tested.

---

9. CART & MULTI-VENDOR ORDERS

The cart must support products from multiple vendors.

If a customer buys products from multiple vendors, architect the order system so that:

- One customer checkout can contain multiple vendors
- The system creates the appropriate parent/customer order
- Vendor-specific order segments can be generated
- Each vendor sees only their own order items
- Delivery can eventually be calculated per vendor
- Vendor order status can be tracked independently
- Customer sees the overall order and vendor-level progress

Do not create a simplistic single-vendor cart architecture.

---

10. ORDER WORKFLOW

Implement:

Customer:

Cart → Checkout → Order Created → Processing → Vendor Processing → Dispatch → Delivery → Completed

Vendor statuses:

- New Order
- Accepted
- Processing
- Ready for Dispatch
- Dispatched
- Completed
- Cancelled

Customer should receive clear order status updates.

Admin should be able to view all marketplace orders.

Vendor should only see orders associated with that vendor.

---

11. ADMIN DASHBOARD

Create a powerful super-admin dashboard.

Dashboard metrics:

- Total vendors
- Active vendors
- Pending vendors
- Total customers
- Total products
- Pending products
- Approved products
- Total orders
- Pending orders
- Completed orders
- Revenue placeholder/financial metrics
- Delivery statistics

Admin sections:

Overview

Vendors

Products

Categories

Customers

Orders

Deliveries

Locations

Marketplace Settings

Branding

Integrations

Notifications

Audit Logs

---

12. VENDOR DASHBOARD

Create a dedicated vendor dashboard.

Include:

- Sales overview
- Orders
- Products
- Inventory
- Customers
- Storefront
- Store settings
- Analytics
- Notifications

Product dashboard should clearly show:

- Total products
- Approved
- Pending
- Rejected
- Out of stock

Provide clear CTA:

Add Product

---

13. MARKETPLACE BRANDING

Marketplace branding must be configurable.

Admin should be able to change:

- Marketplace name
- Logo
- Favicon
- Description
- Contact information
- Social links
- Default currency
- Marketplace location
- Primary branding settings
- Marketplace status

The application should initially display:

RealTreats Marketplace

but never hard-code the name throughout the application.

Store the name in marketplace settings and retrieve it dynamically.

---

14. SEARCH & FILTERING

Implement marketplace-wide search.

Search by:

- Product name
- Product description
- SKU
- Category
- Vendor
- Location

Filters:

- Category
- Vendor
- Price range
- Location
- Distance
- Availability
- Featured
- Rating when ratings are implemented

Use efficient database queries and indexes.

---

15. PRODUCT DISCOVERY

Create:

Marketplace

All approved products.

Nearby

Products/vendors close to customer location.

Categories

Products organized by category.

Vendors

Vendor directory.

Vendor Storefront

Products belonging to one vendor.

Product Details

Full product information with vendor information and location.

---

16. UI/UX REQUIREMENTS

Build a premium, modern marketplace experience.

Design principles:

- Mobile-first
- Responsive
- Clean
- Fast
- Accessible
- Consistent
- Professional
- Modern Nigerian marketplace feel
- Strong visual hierarchy
- Excellent spacing
- Consistent typography
- Proper card alignment
- Clear buttons
- Clear empty states
- Proper loading states
- Skeleton loaders
- Toast notifications
- Confirmation dialogs
- Error states
- Success states

Do not use excessive gradients, unnecessary animations or clutter.

Cards must have properly aligned icons, text, prices and actions.

Desktop dashboards should use an appropriate sidebar/navigation structure.

Mobile should use a compact navigation system and responsive cards/tables.

---

17. AUTHENTICATION

Implement secure authentication.

Support:

- Email/password
- Password reset
- Session management
- Role-based routing
- Protected routes
- Vendor onboarding
- Customer onboarding

The initial admin account is:

ubonguiux@gmail.com

Do not expose admin functionality to ordinary users.

---

18. SECURITY

Security is a first-class requirement.

Implement:

- Backend authorization
- Row Level Security
- Tenant isolation
- Role checks
- Input validation
- Secure file uploads
- Secure API integration
- Environment variables for secrets
- Audit logs for important administrative actions

Never depend solely on frontend route guards.

---

19. AUDIT LOGGING

Record important actions such as:

- Vendor created
- Vendor approved
- Vendor suspended
- Product created
- Product submitted
- Product approved
- Product rejected
- Product edited
- Order status changed
- Delivery status changed
- Marketplace settings changed
- Admin actions

Audit logs should record:

- Actor
- Action
- Entity
- Entity ID
- Timestamp
- Relevant metadata

---

20. NOTIFICATIONS

Create a notification system.

Notify vendors when:

- Vendor account is approved/rejected
- Product is approved/rejected
- New order arrives
- Order changes status
- Delivery changes status

Notify customers when:

- Order is created
- Order is accepted
- Order is processing
- Order is dispatched
- Order is delivered
- Order is cancelled

Create the architecture so email/SMS/push notifications can be added later.

---

21. DATABASE & BACKEND

Use the project's cloud backend/database.

Create the required tables, relationships, indexes and security policies.

Do not build the application as a frontend-only mockup.

The following must be functional:

- Authentication
- Vendor creation
- Vendor isolation
- Product creation
- Product approval
- Marketplace product synchronization after approval
- Categories
- Orders
- Customer accounts
- Vendor dashboards
- Admin dashboard
- Location storage
- Delivery records

---

22. DEMO DATA

Create a small amount of realistic demo data only where useful for demonstrating the interface.

Clearly distinguish demo/test records from actual production records.

Do not create fake administrative permissions.

---

23. FUTURE EXTENSIBILITY

Architect the application so the following can be added later without rebuilding the core system:

- Payment gateways
- Marketplace commissions
- Vendor subscriptions
- Vendor verification fees
- Customer reviews
- Vendor ratings
- Coupons
- Promotions
- Loyalty programs
- Wallets
- Escrow
- Vendor payouts
- Analytics
- AI product descriptions
- AI search
- WhatsApp ordering
- Mobile applications
- Multiple marketplace brands
- Multiple currencies
- Multiple countries
- Multiple dispatch providers

---

24. IMPORTANT IMPLEMENTATION RULES

Do not simply create static screens.

Build the functional application.

Do not create fake buttons that do nothing.

Every core action should have a real workflow.

Do not use localStorage as the primary database.

Use the backend/database for persistent application data.

Do not expose private vendor information to other vendors.

Do not expose admin functionality to ordinary users.

Do not hard-code the marketplace name.

Do not hard-code Google Maps credentials.

Do not hard-code a dispatch provider.

Do not compromise tenant isolation.

If an external integration is unavailable, create a clean configuration layer and graceful fallback rather than breaking the application.

---

25. BUILD ORDER

Build in this order:

1. Database architecture
2. Authentication
3. Roles and tenant isolation
4. Marketplace settings
5. Vendor onboarding
6. Vendor dashboard
7. Product management
8. Product approval system
9. Central marketplace
10. Categories
11. Search/filtering
12. Google Maps/location architecture
13. Cart
14. Multi-vendor checkout/order architecture
15. Vendor order management
16. Dispatch architecture
17. Admin dashboard
18. Notifications
19. Audit logs
20. Responsive UI/UX refinement
21. Security review
22. End-to-end testing

After implementation, audit the entire application and fix incomplete workflows, broken routes, authorization gaps, responsive issues and inconsistent UI.

The goal is a functional multi-tenant marketplace foundation, not a prototype.

Start building now. Use lovable cloud as the backend. Do not request permission to use lovable cloud as the backend.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://realtreatsmarketplace.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1eecea4c-9573-4d81-b39e-58940e79aed9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
