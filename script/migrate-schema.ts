/**
 * One-off migration: add communities.name unique constraint and users.unit_flat_number column.
 * Run: npx dotenv -e .env -- tsx script/migrate-schema.ts
 * Or: node -r dotenv/config -r ts-node/register script/migrate-schema.ts
 */
import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    // Check duplicate community names
    const dup = await client.query(
      `SELECT name, COUNT(*) as c FROM communities GROUP BY name HAVING COUNT(*) > 1`
    );
    if (dup.rows.length > 0) {
      console.warn("Duplicate community names found:", dup.rows);
      console.warn("Rename duplicates in DB before adding unique constraint.");
      process.exit(1);
    }

    // Add unique constraint on communities(name) if not exists
    const hasUnique = await client.query(`
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'communities' AND constraint_name = 'communities_name_unique'
    `);
    if (hasUnique.rows.length === 0) {
      await client.query(
        `ALTER TABLE communities ADD CONSTRAINT communities_name_unique UNIQUE (name)`
      );
      console.log("Added unique constraint communities_name_unique on communities(name)");
    } else {
      console.log("Unique constraint communities_name_unique already exists");
    }

    // Add unit_flat_number to users if not exists
    const hasCol = await client.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'unit_flat_number'
    `);
    if (hasCol.rows.length === 0) {
      await client.query(`ALTER TABLE users ADD COLUMN unit_flat_number TEXT`);
      console.log("Added column users.unit_flat_number");
    } else {
      console.log("Column users.unit_flat_number already exists");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
