/**
 * Add missing columns: posts.listing_id, listings.image_url, bookings.slot_start_time, bookings.slot_end_time, orders.quantity
 * Run: npx tsx script/add-missing-columns.ts
 */
import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function tableExists(client: pg.PoolClient, name: string): Promise<boolean> {
  const r = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [name]
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
    const toAdd: [string, string, string][] = [
      ["posts", "listing_id", "VARCHAR(255)"],
      ["posts", "image_url", "TEXT"],
      ["listings", "image_url", "TEXT"],
      ["bookings", "slot_start_time", "TEXT"],
      ["bookings", "slot_end_time", "TEXT"],
      ["orders", "quantity", "INTEGER NOT NULL DEFAULT 1"],
      ["users", "payment_accepts_upi", "BOOLEAN NOT NULL DEFAULT false"],
      ["users", "payment_accepts_card", "BOOLEAN NOT NULL DEFAULT false"],
      ["users", "payment_accepts_cash", "BOOLEAN NOT NULL DEFAULT false"],
      ["communities", "banner_url", "TEXT"],
      ["communities", "logo_url", "TEXT"],
      ["communities", "theme_color", "TEXT"],
      ["platform_settings", "platform_logo_url", "TEXT"],
    ];

    for (const [table, column, type] of toAdd) {
      if (!(await tableExists(client, table))) {
        console.log(`Table ${table} does not exist, skipping ${column}`);
        continue;
      }
      if (await columnExists(client, table, column)) {
        console.log(`Column ${table}.${column} already exists`);
      } else {
        await client.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
        console.log(`Added ${table}.${column}`);
      }
    }
    console.log("Done.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
