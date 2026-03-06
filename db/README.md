## Database setup

This folder contains simple entrypoints for setting up the database schema for this project.

### Prerequisites

- A Postgres database
- `DATABASE_URL` set in `.env` at the project root
- Node + `pnpm`/`npm` dependencies installed

### One‑shot setup (fresh or existing DB)

From the project root, after you have installed dependencies and set `DATABASE_URL` in `.env`:

```bash
npm run db:setup
# or: pnpm db:setup
# or: npx tsx db/setup.ts
```

This will:

- Create any **missing tables** (`community_invites`, `listing_slots`, `bookings`, `orders`,
  `product_interests`, `posts`, `comments`, `platform_settings`, etc.)
- Add any **missing columns** on existing tables (such as `posts.listing_id`,
  `listings.image_url`, `bookings.slot_start_time`, `bookings.slot_end_time`,
  `orders.quantity`)

It is **safe to run multiple times**; existing tables/columns are left unchanged.

### Verify schema

Optionally, you can verify that all the required tables and columns exist:

```bash
npx tsx script/check-tables.ts
```


