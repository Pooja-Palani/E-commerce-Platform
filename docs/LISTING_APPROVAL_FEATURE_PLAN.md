# Plan: Manager Approval for Selected Services/Products

## Context

The app is used by diverse communities in India and beyond:

- **Household communities** (residential societies)
- **Corporate / office communities**
- **Factories and high-business communities**
- **Local small-scale business communities**

Listings range from **house cleaning, tutoring, personal care** to **truck drivers (cement/oil/daily goods)** and anything that can be sold or offered as a service within a circle of colleagues, business people, and residents.

**Goal:** Allow each community to decide *which* services/products require community manager approval before going live; the rest can go live immediately.

---

## 1. Design Principles

- **Per-community configuration** – Approval rules are defined at the community level so a housing society, office, and factory can each set their own policy.
- **Simple defaults** – e.g. “all listings need approval” or “none need approval” so small communities don’t have to configure categories.
- **Category-based (optional)** – When needed, “these categories always need approval” so it scales to many categories (cleaning, tutoring, transport, goods, etc.) without listing-level rules.
- **No change for “no approval”** – If a community doesn’t enable approval, behaviour stays as today (listings go ACTIVE immediately).

---

## 2. Schema Changes

### 2.1 Listing Status

- **Add** `PENDING_APPROVAL` to the existing `listing_status` enum (e.g. in `shared/schema.ts`: `["ACTIVE", "INACTIVE", "REMOVED", "PENDING_APPROVAL"]`).
- New listings that match the community’s approval rules are created with `status = PENDING_APPROVAL`; others with `status = ACTIVE`.
- Marketplace (and any “live” views) keep showing only `status === 'ACTIVE'`.

### 2.2 Where to Store “What Requires Approval”

Two options:

- **Option A – Columns on `communities`**  
  Add to `communities` table:
  - `listing_approval_mode`: enum or string, e.g. `NONE` | `ALL` | `CATEGORY_BASED`.
  - `product_categories_approval`: JSONB or text array – category names that require approval (products).
  - `service_categories_approval`: JSONB or text array – category names that require approval (services).

- **Option B – New table `community_listing_settings`**  
  One row per community, same fields as above. Use this if you expect more listing-related settings later (e.g. allowed categories, max price, etc.).

**Recommendation:** Start with Option A (columns on `communities`) to avoid extra joins; move to a separate table later if settings grow.

### 2.3 Rejection Reason (Optional but Useful)

- On `listings` (or a small `listing_approval_events` table), add:
  - `rejected_at`, `rejected_by_id`, `rejection_reason` (nullable).
- Lets managers give a short reason (“Wrong category”, “Incomplete details”) and sellers see it in My Products / My Services.

### 2.4 Platform-Level Default (Optional)

- In `platform_settings`, add e.g. `default_listing_approval_mode` and optionally `default_categories_requiring_approval` (JSON/text).
- New communities can inherit this until the community manager overrides it.

---

## 3. Configuration Model (What Requires Approval)

### 3.1 Modes per Community

| Mode | Meaning | Use case |
|------|--------|----------|
| `NONE` | No approval; all listings go ACTIVE. | Trusted / small communities, quick onboarding. |
| `ALL` | Every new product and service needs approval. | Corporate, factories, high-compliance. |
| `CATEGORY_BASED` | Only listed categories need approval. | Mix: e.g. tutoring/transport need approval; daily groceries don’t. |

### 3.2 Category-Based Rules

- **Products:** Use existing `category` (and/or `condition`). Store in `product_categories_approval` the list of category values that require approval (e.g. `["Electronics", "Furniture", "Machinery", "Raw Materials"]`).
- **Services:** Use existing `category` (and/or a service-type field if you add one). Store in `service_categories_approval` (e.g. `["Tutoring", "Transport", "Heavy Vehicle", "Personal Care", "Home Cleaning"]`).
- **“Other” / custom:** If the app allows free-text or “Other” category, either:
  - Treat “Other” as one category that can be in the approval list, or
  - When category is “Other”, use a simple rule (e.g. “always require approval” or “never”) so you don’t need to parse free text.

### 3.3 Mapping to Use Cases

- **Household:** Often `NONE` or `CATEGORY_BASED` (e.g. only “Tutoring”, “Home repair”).
- **Corporate / offices:** Often `ALL` or `CATEGORY_BASED` (e.g. “Transport”, “Equipment hire”).
- **Factories / high business:** Often `ALL` or strict `CATEGORY_BASED` (e.g. “Cement”, “Oil”, “Heavy transport”, “Machinery”).
- **Local small business:** Often `NONE` or `CATEGORY_BASED` for a few sensitive categories.

Same schema supports all; only config differs per community.

---

## 4. Backend Logic

### 4.1 When Creating a Listing (POST create listing)

1. Load community (and optionally platform default) approval settings.
2. Resolve mode:
   - **NONE:** set `status = 'ACTIVE'` (current behaviour).
   - **ALL:** set `status = 'PENDING_APPROVAL'`.
   - **CATEGORY_BASED:**  
     - If listing’s `listingType` is PRODUCT and `category` is in `product_categories_approval` → `PENDING_APPROVAL`.  
     - If listing’s `listingType` is SERVICE and `category` is in `service_categories_approval` → `PENDING_APPROVAL`.  
     - Else → `ACTIVE`.
3. Save listing with that status.
4. (Optional) If you add notifications, trigger “Listing submitted for approval” to the community manager.

### 4.2 When Updating a Listing (PUT/PATCH)

- If the community’s rules *change* the “requires approval” outcome (e.g. category changed into an approval category), you can either:
  - **Option A:** Only apply approval rules on create; edits don’t move ACTIVE → PENDING_APPROVAL.
  - **Option B:** Re-evaluate on edit: if the listing would now require approval, set to PENDING_APPROVAL and require re-approval (clearer but more strict).
- Recommend **Option A** for v1 to avoid taking already-live listings down on edit.

### 4.3 Marketplace and Visibility

- **Marketplace (services/products):** Already filter `status === 'ACTIVE'`. No change except ensuring `PENDING_APPROVAL` is never treated as ACTIVE.
- **Seller’s “My Products” / “My Services”:** Show all own listings; for `PENDING_APPROVAL` show a badge “Pending approval” and optionally “Rejected” if you store rejection and show it.
- **Manager views:** New “Pending listings” list (see below); only show listings with `status === 'PENDING_APPROVAL'` (and in manager’s community).

### 4.4 New APIs (Manager Only)

- **GET** `/api/manager/pending-listings`  
  - Auth: community manager (or admin).  
  - Returns listings where `communityId = manager’s community` and `status = 'PENDING_APPROVAL'`.  
  - Include seller name, category, title, description (and maybe first image) for the approval queue.

- **POST** `/api/manager/listings/:id/approve`  
  - Set `status = 'ACTIVE'`.  
  - Optional: set `approved_at`, `approved_by_id` if you add those columns.  
  - Optional: notify seller.

- **POST** `/api/manager/listings/:id/reject`  
  - Body: `{ reason?: string }`.  
  - Set `status = 'INACTIVE'` (or a dedicated REJECTED if you add it); store `rejected_at`, `rejected_by_id`, `rejection_reason`.  
  - Optional: notify seller with reason.

- **GET** `/api/communities/:id/listing-approval-settings` (for manager/admin)  
  - Return `listing_approval_mode`, `product_categories_approval`, `service_categories_approval` (and platform default if used) so the UI can show/edit settings.

- **PUT** `/api/communities/:id/listing-approval-settings` (manager or admin)  
  - Update approval mode and category lists; validate category values against allowed enums or a fixed list if you use one.

---

## 5. Manager UI

### 5.1 Where to Put “Pending Listings”

- **Option A:** New tab/section on the existing **Manager → Approvals** page: “Member requests” (current) and “Pending listings” (new).
- **Option B:** New page **Manager → Pending listings** (or “Listing approvals”) and link it from the manager sidebar and dashboard.

Each pending listing row: thumbnail (if any), title, category, type (product/service), seller name, “Approve” and “Reject” buttons. Reject opens a small modal for optional reason.

### 5.2 Where to Configure “What Requires Approval”

- **Option A:** Under **Manager → Dashboard** or **Manager → Members** (or a new “Community settings” page): a card “Listing approval” with:
  - Radio: None / All / Category-based.
  - If Category-based: two multi-selects (or tag inputs) for product categories and service categories that require approval.
- **Option B:** **Admin → Communities** → select community → “Listing approval” section; manager sees the same in a “My community settings” page.

Use the same GET/PUT APIs above. If you don’t have a community settings page yet, a dedicated “Listing approval” card on the manager dashboard is enough for v1.

---

## 6. Seller and Listing UI

### 6.1 List Product / List Service

- After the user selects category (and before submit), check (client-side or via a small API) whether that community + category requires approval.
- If yes, show a short message: “This listing will need community manager approval before it appears in the marketplace.”
- Submit button can still say “Submit” or “Submit for approval” for those cases.

### 6.2 My Products / My Services

- For each listing with `status === 'PENDING_APPROVAL'`: show a badge “Pending approval” and short text like “Waiting for community manager approval.”
- For rejected listings (if you store and expose them): show “Rejected” and, if you have it, the rejection reason so they can fix and resubmit (e.g. by editing and saving again, and you can decide whether that creates a new PENDING_APPROVAL or not – often “edit and resubmit” sets back to PENDING_APPROVAL).

---

## 7. Migration and Rollout

1. **DB migration**
   - Add `PENDING_APPROVAL` to `listing_status` enum.
   - Add columns to `communities` (or create `community_listing_settings`).
   - Optionally add `rejected_at`, `rejected_by_id`, `rejection_reason` (and `approved_at`, `approved_by_id`) on `listings`.
   - Set default for existing communities: e.g. `listing_approval_mode = 'NONE'` so behaviour is unchanged.

2. **Backend**
   - Implement create-listing status logic (NONE / ALL / CATEGORY_BASED).
   - Implement GET/POST manager pending-listings and approve/reject.
   - Implement GET/PUT community listing-approval settings.
   - Ensure all listing reads (marketplace, manager, seller) respect the new status.

3. **Manager UI**
   - Pending list + Approve/Reject (with optional reason).
   - Listing approval settings (mode + categories).

4. **Seller UI**
   - Message on list product/service when approval is required.
   - Badges and rejection reason in My Products / My Services.

5. **Admin (optional)**
   - In Admin → Communities, allow editing listing-approval settings per community and/or set platform default in platform_settings.

6. **Documentation**
   - Keep this plan (and any API/schema notes) in the repo so future changes (e.g. more community types, new categories) stay consistent.

---

## 8. Summary Table

| Area | What to add |
|------|-------------|
| **Schema** | `PENDING_APPROVAL` in listing_status; community approval mode + category lists; optional rejection/approval fields. |
| **Create listing** | Set status to ACTIVE or PENDING_APPROVAL based on community rules. |
| **APIs** | GET/POST manager pending-listings, approve, reject; GET/PUT community listing-approval settings. |
| **Manager UI** | Pending listings queue (approve/reject); approval settings (mode + categories). |
| **Seller UI** | “Requires approval” message when listing; “Pending approval” / “Rejected” in My Products/Services. |
| **Marketplace** | No change; keep filtering only ACTIVE. |

---

*This plan supports household societies, offices, factories, and local small businesses, for everything from house cleaning and tutoring to truck drivers and cement/oil/daily goods. A “Phase 1” scope could be NONE vs ALL only; category-based rules can follow in Phase 2.*
