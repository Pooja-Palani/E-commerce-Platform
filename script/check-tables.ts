/**
 * Verify required tables and columns exist.
 * Run: npx tsx script/check-tables.ts
 */
import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function tableExists(client: pg.PoolClient, table: string): Promise<boolean> {
  const r = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  );
  return r.rows.length > 0;
}

async function columnExists(client: pg.PoolClient, table: string, column: string): Promise<boolean> {
  const r = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column]
  );
  return r.rows.length > 0;
}

async function main() {
  const client = await pool.connect();
  try {
    const checks: { name: string; ok: boolean }[] = [];

    // Tables
    for (const table of ["community_invites", "listing_slots", "product_interests", "posts", "listings", "bookings", "orders"]) {
      const exists = await tableExists(client, table);
      checks.push({ name: `table: ${table}`, ok: exists });
    }

    // posts.listing_id
    checks.push({ name: "posts.listing_id", ok: await columnExists(client, "posts", "listing_id") });
    // listings.image_url
    checks.push({ name: "listings.image_url", ok: await columnExists(client, "listings", "image_url") });
    // bookings.slot_start_time, slot_end_time
    checks.push({ name: "bookings.slot_start_time", ok: await columnExists(client, "bookings", "slot_start_time") });
    checks.push({ name: "bookings.slot_end_time", ok: await columnExists(client, "bookings", "slot_end_time") });
    // orders.quantity
    checks.push({ name: "orders.quantity", ok: await columnExists(client, "orders", "quantity") });

    console.log("\n--- DB schema check ---\n");
    for (const c of checks) {
      console.log(c.ok ? "  ✓" : "  ✗", c.name);
    }
    const failed = checks.filter((c) => !c.ok);
    if (failed.length) {
      console.log("\nMissing:", failed.map((c) => c.name).join(", "));
      process.exit(1);
    }
    console.log("\nAll required tables and columns exist.\n");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
