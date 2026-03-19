# Listing Approval Plan: Manager Approval for Products & Services

## Overview
Some products and services should require Community Manager approval before going live. This document outlines the plan to implement configurable approval rules.

---

## 1. Schema Changes

### Option A: Extend `listing_status` enum
- Add `PENDING_APPROVAL` to `listing_status` enum
- New listings that match approval rules start as `PENDING_APPROVAL`
- Manager approves → `ACTIVE`, rejects → `INACTIVE` or `REMOVED`

### Option B: Add `approval_status` column
- `approval_status`: `NOT_REQUIRED` | `PENDING` | `APPROVED` | `REJECTED`
- `status` remains ACTIVE/INACTIVE/REMOVED; listings with `PENDING` are hidden from marketplace until approved

**Recommendation:** Option A (simpler) – add `PENDING_APPROVAL` to listing_status.

---

## 2. Configuration: What Requires Approval?

### Community-level settings (in `communities` or new `community_settings`)
| Setting | Type | Description |
|---------|------|-------------|
| `productCategoriesRequiringApproval` | string[] | e.g. `["Electronics", "Furniture"]` |
| `serviceCategoriesRequiringApproval` | string[] | e.g. `["Tutoring", "Personal Care"]` |
| `allProductsRequireApproval` | boolean | If true, all products need approval |
| `allServicesRequireApproval` | boolean | If true, all services need approval |

### Platform-level fallback (in `platform_settings`)
- Default categories that always require approval across all communities

---

## 3. Logic Flow

### On listing create/update
1. Get community’s approval settings (and platform defaults)
2. If listing’s category is in `productCategoriesRequiringApproval` (for products) or `serviceCategoriesRequiringApproval` (for services), set `status = PENDING_APPROVAL`
3. Otherwise set `status = ACTIVE` (or keep existing status when editing)

### Marketplace visibility
- Only list items with `status === 'ACTIVE'` (already the case)
- `PENDING_APPROVAL` listings are hidden from marketplace and from seller’s public list until approved

### Manager dashboard
- Add “Pending Listings” section in Manager Approvals or Manager Dashboard
- List all `PENDING_APPROVAL` listings in the manager’s community
- Actions: Approve (→ ACTIVE), Reject (→ INACTIVE or REMOVED)

---

## 4. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| *Removed* | `/api/manager/pending-listings` | Listing approval flow disabled; endpoints removed |
| *Removed* | `/api/manager/listings/:id/approve` | Listing approval flow disabled; endpoints removed |
| *Removed* | `/api/manager/listings/:id/reject` | Listing approval flow disabled; endpoints removed |

---

## 5. UI Changes

- **Manager Approvals page:** Add tab or section for “Pending Listings” with approve/reject buttons
- **List Product / List Service:** Show info: “This listing will require manager approval before it goes live” when category matches approval rules
- **My Products / My Services:** Indicate which items are “Pending approval”

---

## 6. Migration Steps

1. Add `PENDING_APPROVAL` to `listing_status` enum (DB migration)
2. Add community settings columns or new `community_settings` table
3. Implement approval logic in create/update listing API
4. Add manager approval API and UI
5. Update marketplace and seller views to respect `PENDING_APPROVAL`

---

## 7. Future Enhancements

- Rejection reason (optional text when manager rejects)
- Notification to seller when listing is approved/rejected
- Per-category override at community level
