import "dotenv/config";
import { pool } from "../server/db";

async function main() {
  console.log("Starting migration: remove PENDING_APPROVAL from listing_status enum");

  // 1) Ensure no rows reference PENDING_APPROVAL
  try {
    await pool.query("BEGIN");
    console.log("Updating listings with PENDING_APPROVAL -> ACTIVE...");
    await pool.query("UPDATE listings SET status = 'ACTIVE' WHERE status = 'PENDING_APPROVAL'");

    // 2) Create a new enum type without PENDING_APPROVAL
    console.log("Creating new enum type listing_status_new...");
    await pool.query("CREATE TYPE listing_status_new AS ENUM('ACTIVE','INACTIVE','REMOVED')");

    // 3) Alter column to use new type. If the column has a default, drop it first
    console.log("Dropping default on listings.status (if any) and altering type...");
    await pool.query("ALTER TABLE listings ALTER COLUMN status DROP DEFAULT");
    console.log("Altering listings.status to use listing_status_new...");
    await pool.query(
      "ALTER TABLE listings ALTER COLUMN status TYPE listing_status_new USING status::text::listing_status_new"
    );

    // 4) Drop old enum and rename, then restore a sensible default
    console.log("Dropping old listing_status and renaming listing_status_new -> listing_status...");
    await pool.query("DROP TYPE IF EXISTS listing_status");
    await pool.query("ALTER TYPE listing_status_new RENAME TO listing_status");
    console.log("Setting default on listings.status -> 'ACTIVE'");
    await pool.query("ALTER TABLE listings ALTER COLUMN status SET DEFAULT 'ACTIVE'");

    await pool.query("COMMIT");
    console.log("Migration completed successfully.");
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
