# Nexus Market — App Flow & User Manual (Demo)

This document describes the full application flow for **user manuals** and **demo purposes**. Use it for onboarding, training, or walking stakeholders through the platform.

---

## 1. App Overview

**Nexus Market** is a community-focused e-commerce platform where:

- **Residents** browse and buy products/services from their community, sell their own, and chat with neighbors.
- **Community Managers** oversee a community: approve members, manage listings, and invite members.
- **Admins** manage the whole platform: communities, users, analytics, and settings.

**Tech stack (reference):** React, Express, PostgreSQL, Drizzle ORM, Tailwind CSS, Vite.

---

## 2. User Roles

| Role | Who | Main capabilities |
|------|-----|-------------------|
| **RESIDENT** | End user in a community | Buy/sell, cart, orders, community chat, profile, join communities |
| **COMMUNITY_MANAGER** | Manager of one community | Everything a resident can do + approvals, view services/products/members, invite members |
| **ADMIN** | Platform administrator | Full access: communities, users, analytics, platform settings |

Residents can switch between **Buyer** and **Seller** view mode in the sidebar (cart/orders in Buyer mode; my listings + accept payments in Seller mode).

---

## 3. User Onboarding to App Flow

This section is the **end-to-end journey** from first touch to full app use. Use it for onboarding checklists, training, and “day one” flows.

### 3.1 First visit (unauthenticated)

1. User opens the app → lands on **Login**.
2. **Two paths:**
   - **Existing user** → Enter email & password → **Sign in** → go to [3.3](#33-after-login--role-based-landing).
   - **New user** → Click **Sign up** → go to [3.2](#32-sign-up--account-creation).

### 3.2 Sign up → account creation

1. **Register** page: Full name, email, password, phone, locality, postal code, address.
2. **Optional:** User arrives via **invite link** (`/register?invite=<communityId>`) → same form; community is pre-selected and they join that community on signup.
3. Submit **Sign up** → account created.
4. User is logged in and redirected to **Dashboard** (`/`).
5. Next step depends on state → go to [3.4](#34-first-time--no-community) or [3.5](#35-first-time--pending-approval) or [3.6](#36-first-time--already-in-community).

### 3.3 After login → role-based landing

1. **Admin** → Redirected to **Admin Dashboard** (`/admin`) → use [Section 7](#7-admin-flows).
2. **Community Manager** → **Dashboard** (`/`) → use [Section 6](#6-community-manager-flows) and [Section 5](#5-resident-flows) as needed.
3. **Resident** → **Dashboard** (`/`) → go to [3.4](#34-first-time--no-community), [3.5](#35-first-time--pending-approval), or [3.6](#36-first-time--already-in-community).

### 3.4 First time — no community

1. Dashboard shows **“Connect with Your Neighbors”** and a list of **communities**.
2. User **clicks Join** on a community:
   - **Public** → Joined immediately → go to [3.6](#36-first-time--already-in-community).
   - **Private** → Join request sent → go to [3.5](#35-first-time--pending-approval).
3. If no communities exist, user is directed to **Profile** to complete profile; an Admin/Manager must create communities first.

### 3.5 First time — pending approval

1. Dashboard shows **“Pending Approval”** (for private communities).
2. User waits until a **Community Manager** approves them under **Manager → Approvals**.
3. After approval → status becomes ACTIVE → next login or refresh shows normal dashboard → go to [3.6](#36-first-time--already-in-community).

### 3.6 First time — already in community

1. Dashboard shows **normal content**: community name, quick links (Services, Products, Community Chat), and any featured listings.
2. **Suggested first actions** (choose one or more for onboarding):
   - **Browse** → **Services** or **Products** → open a listing → Book or Add to cart ([Section 5.3](#53-buyer-flow-view-mode-buyer)).
   - **Introduce yourself** → **Community Chat** → send a message or share a listing ([Section 5.5](#55-community-chat)).
   - **Sell something** → Switch **View mode** to **Seller** → **My Products** or **My Services** → Add listing ([Section 5.4](#54-seller-flow-view-mode-seller)).
3. **Profile** → User can set primary community, accept any **Community invites**, and switch **View mode** (Buyer/Seller) ([Section 5.6](#56-profile--invites)).

### 3.7 Onboarding summary (checklist)

| Step | Action | Outcome |
|------|--------|--------|
| 1 | Open app | Login page |
| 2 | Sign up or Sign in | Account created or authenticated |
| 3 | (If new) Join community or use invite link | In at least one community |
| 4 | (If private) Wait for manager approval | ACTIVE in community |
| 5 | Browse Services/Products or open Community Chat | First use of marketplace/chat |
| 6 | (Optional) Switch to Seller, add listing | First listing live |
| 7 | (Optional) Profile → set preferences, accept invites | Onboarding complete |

After this, the user follows the full **App Flow** in the rest of this document ([Entry Flows](#4-entry-flows), [Resident](#5-resident-flows), [Manager](#6-community-manager-flows), [Admin](#7-admin-flows)).

---

## 4. Entry Flows

### 4.1 Login

1. Open app → redirects to **Login** if not authenticated.
2. Enter **email** and **password** → **Sign in**.
3. On success → redirect to:
   - **Admin** → `/admin` (Admin Dashboard).
   - **Resident / Community Manager** → `/` (Dashboard).

**Demo tip:** Use known test accounts for each role (Resident, Manager, Admin).

---

### 4.2 Register (New User)

1. From Login, click **Sign up** or go to **Register**.
2. Fill: Full name, email, password, phone, locality, postal code, address.
3. **Sign up** → account created (status may be PENDING for private communities).
4. Optional: register via **invite link** (`/register?invite=<communityId>`) to auto-join a community.

**Flow after register:**

- If **no community** → Dashboard shows “Select your residential complex” and list of communities to join.
- If **invite link** used → User is in that community (and may still need approval for private communities).
- If **pending approval** → Dashboard shows “Pending Approval” until a Community Manager approves.

---

## 5. Resident Flows

### 5.1 First-Time Resident (No Community)

1. **Login** → Dashboard.
2. See **“Connect with Your Neighbors”** and list of **communities**.
3. Click **Join** on a community:
   - **Public community** → Join is immediate; user can use the app.
   - **Private community** → Join request sent; “Pending Approval” until manager approves.
4. After joining (and approval if required) → Dashboard shows normal content (listings, community chat, etc.). 

---

### 5.2 Switching Community 

1. In **sidebar**, under **COMMUNITY**, use the **dropdown**.
2. Select another community (from memberships).
3. App context (listings, chat, etc.) switches to that community. 

--- 

### 5.3 Buyer Flow (View Mode: Buyer) 

1. Set **View Mode** in sidebar to **Buyer** (cart icon).
2. **Dashboard** (`/`) — Overview, quick links, community chat preview.
3. **Services** (`/services`) — Browse services in current community; filter/search.
4. **Products** (`/products`) — Browse products; filter/search.
5. Click a listing → **Listing detail** (`/listings/:id`):
   - **Product:** Add to cart (or request quote if “Price on request”), set quantity for stock items.
   - **Service:** Pick date and time slot (if slots exist), then **Book**.
6. **Cart** (`/cart`) — Review items, update quantity, **Proceed to checkout** (or similar).
7. **Orders** (`/orders`) — List of orders; view status (e.g. Pending, Confirmed, Shipped, Delivered).

**Demo sequence:** Login as Resident (Buyer) → Pick community → Services → open one → Book (or Products → Add to cart → Cart → checkout).

---

### 5.4 Seller Flow (View Mode: Seller)

1. Set **View Mode** in sidebar to **Seller** (store icon). (First time may enable “seller” on profile.)
2. **My Services** (`/my-services`) — List your services; **Add service** → `/list-service` (or edit via `/list-service/:id`).
3. **My Products** (`/my-products`) — List your products; **Add product** → `/list-product` (or edit via `/list-product/:id`).
4. **List Service** (`/list-service`) — Title, description, price (or “Price on request”), duration, mode, image, community.
5. **List Product** (`/list-product`) — Title, description, price (or “Price on request”), category, condition, stock, image, community.
6. **Accept Payments** (`/accept-payments`) — Configure how you accept payment (e.g. UPI, card, cash).
7. **Listing detail** (own listing) — As seller: manage slots (services), manage stock (products), see interest/orders.

**Demo sequence:** Switch to Seller → My Products → Add product → fill form → submit → view on Products marketplace.

---

### 5.5 Community Chat

1. **Community Chat** (`/forum`) in sidebar.
2. Single **chat-style** feed for the current community.
3. **Send message** — Type in box and send; optional **“Share a product or service”** dropdown to attach a listing.
4. **Click avatar** on a message → **Profile popover** (name, email, phone) for contact.
5. **Shared listings** in chat → Click card to open listing detail.

**Demo tip:** Send a text message, then share one of your listings and show the popover.

---

### 5.6 Profile & Invites

1. **Profile** (`/profile`) — Edit profile, view/switch communities, **View Mode** (Buyer/Seller), **Community invites**.
2. **Pending invites** — If manager invited the user, section “Community invites” with **Accept** / **Decline**.
3. **Primary community** — Can set which community is default (sidebar dropdown).

---

## 6. Community Manager Flows

Managers see **Manager** section in sidebar: Dashboard, Community Chat, Approvals, Services, Products, Members.

### 6.1 Manager Dashboard

1. **Manager Dashboard** (`/manager`) — Overview of their community (e.g. members, listings, recent activity).

### 6.2 Approvals (Join Requests)

1. **Approvals** (`/manager/approvals`) — List of users with **PENDING** join request for this community.
2. **Approve** or **Reject** each request.
3. Approved users get **ACTIVE** status and can use the app in that community.

**Demo:** Use a second account to request join; approve from manager account.

### 6.3 Services & Products (Manager View)

1. **Manager Services** (`/manager/services`) — All **services** in the community (read-only overview).
2. **Manager Products** (`/manager/products`) — All **products** in the community (read-only overview).
3. Listings show **“Given for quotation”** when seller set “Price on request”.

### 6.4 Members & Invites

1. **Manager Members** (`/manager/members`) — List of **active members** in the community.
2. **Invite by email** — Enter email; if user exists, they get an in-app invite (Profile → Accept/Decline); if not, use invite link.
3. **Copy app invite link** — Link like `https://<app>/register?invite=<communityId>` for new sign-ups to join this community.
4. **Remove member** — Optional action to remove a member from the community (cannot remove another manager).

**Demo:** Invite by email (existing user) → show invite on Profile; copy invite link and open in incognito to show register with pre-filled community.

---

## 7. Admin Flows

Admins see **Platform Admin** in sidebar: Dashboard, Communities, Users, Analytics, Settings.

### 7.1 Admin Dashboard

1. **Admin Dashboard** (`/admin`) — Platform-wide overview (e.g. users, communities, high-level metrics).

### 7.2 Communities

1. **Admin Communities** (`/admin/communities`) — List all communities; open one to see details and members.

### 7.3 Users

1. **Admin Users** (`/admin/users`) — List/search users; assign role (Resident, Community Manager, Admin), assign community.

### 7.4 Analytics

1. **Admin Analytics** (`/admin/analytics`) — Platform analytics (e.g. growth, usage).

### 7.5 Settings

1. **Admin Settings** (`/admin/settings`) — Platform name, features (e.g. registration, global marketplace, community forums), maintenance, etc.

---

## 8. Key URLs (Quick Reference)

| Purpose | URL |
|--------|-----|
| Login | `/login` |
| Register | `/register` |
| Register with invite | `/register?invite=<communityId>` |
| Dashboard (resident/manager) | `/` |
| Admin dashboard | `/admin` |
| Community Chat | `/forum` |
| Post detail (legacy) | `/forum/post/:id` |
| Services marketplace | `/services` |
| Products marketplace | `/products` |
| Listing detail | `/listings/:id` |
| Cart | `/cart` |
| Orders | `/orders` |
| My Services | `/my-services` |
| My Products | `/my-products` |
| List service | `/list-service`, `/list-service/:id` |
| List product | `/list-product`, `/list-product/:id` |
| Profile | `/profile` |
| Accept Payments | `/accept-payments` |
| Manager dashboard | `/manager` |
| Manager approvals | `/manager/approvals` |
| Manager services | `/manager/services` |
| Manager products | `/manager/products` |
| Manager members | `/manager/members` |
| Admin users | `/admin/users` |
| Admin communities | `/admin/communities` |
| Admin analytics | `/admin/analytics` |
| Admin settings | `/admin/settings` |

---

## 9. Suggested Demo Script (15–20 min)

**Part 1 — Resident (Buyer)**  
1. Login as Resident.  
2. Select community (or join one).  
3. Open Services → open one listing → Book (or pick date/slot).  
4. Open Products → open one → Add to cart → Cart → checkout.  
5. Open Community Chat → send message → share a product → click avatar (show contact popover).  
6. Profile → show community memberships and View Mode.

**Part 2 — Resident (Seller)**  
1. Switch View Mode to Seller.  
2. My Products → Add product (with image, price or “Price on request”).  
3. Show product on Products marketplace.  
4. Accept Payments → set UPI/card/cash (if applicable).

**Part 3 — Community Manager**  
1. Login as Community Manager.  
2. Approvals → approve a pending request (if any).  
3. Manager Services / Manager Products → show “Given for quotation” for price-on-request.  
4. Manager Members → Invite by email → Copy invite link; briefly show Register with `?invite=`.

**Part 4 — Admin (optional)**  
1. Login as Admin.  
2. Admin Dashboard → Communities → Users.  
3. Admin Settings → show platform name and feature toggles.

---

## 10. Common Issues (Troubleshooting)

- **“Pending Approval”** — User is in a private community and must be approved under Manager → Approvals.
- **No community / empty dashboard** — User has not joined a community; join from dashboard or accept an invite in Profile.
- **Cart / Orders not visible** — Ensure View Mode is **Buyer** (Resident only).
- **Can’t list product/service** — Ensure View Mode is **Seller** and user has seller enabled (toggle in sidebar or Profile).
- **Internal server error on login** — Often due to missing DB columns; run `npm run db:push` so schema matches code.

---

*Document version: 1.0 — for Nexus Market app flow, user manual, and demo purposes.*
