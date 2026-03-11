/**
 * Ensures the listing_status enum has PENDING_APPROVAL.
 * Run: npx tsx script/add-pending-approval-enum.ts
 */
import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query("ALTER TYPE listing_status ADD VALUE 'PENDING_APPROVAL'");
    console.log("Added PENDING_APPROVAL to listing_status.");
  } catch (e: any) {
    if (e.message?.includes("already exists")) {
      console.log("Enum value PENDING_APPROVAL already exists.");
    } else {
      throw e;
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
