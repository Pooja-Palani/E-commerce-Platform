/**
 * Danger: wipes most application data so you can start fresh.
 *
 * What it does:
 * - TRUNCATE data tables (users, communities, listings, bookings, orders, etc.)
 * - Leaves `platform_settings` and migrations untouched
 * - Recreates the admin user (admin@example.com) with a temporary password
 *
 * After running, we'll also run the existing set-admin-password script
 * to set the admin password to the value you want.
 *
 * Run from project root:
 *   npx tsx script/reset-db.ts
 */
import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  const client = await pool.connect();
  try {
    console.log("Connected to database, truncating data tables...");

    // Order matters a bit less with CASCADE, but we TRUNCATE in a safe sequence.
    await client.query(`
      TRUNCATE TABLE
        bookings,
        orders,
        product_interests,
        listing_slots,
        audit_logs,
        comments,
        posts,
        reports,
        user_communities,
        community_invites,
        listings,
        users,
        communities
      RESTART IDENTITY CASCADE
    `);

    console.log("Data tables truncated.");

    // Create a fresh admin user so you can log in immediately.
    const adminEmail = "admin@example.com";
    const temporaryPassword = "adminpassword123";

    const bcrypt = await import("bcryptjs");
    const salt = await bcrypt.default.genSalt(10);
    const passwordHash = await bcrypt.default.hash(temporaryPassword, salt);

    const result = await client.query(
      `
        INSERT INTO users
          (id, full_name, email, password_hash, role, status, is_seller, created_at, updated_at, version)
        VALUES
          (gen_random_uuid()::text, 'Administrator', $1, $2, 'ADMIN', 'ACTIVE', true, NOW(), NOW(), 1)
        RETURNING id
      `,
      [adminEmail, passwordHash]
    );

    const adminId = result.rows[0]?.id;
    console.log("Fresh admin created:", adminEmail, "id:", adminId);
    console.log("Temporary password:", temporaryPassword);
    console.log("Next step: run set-admin-password script to set your desired password.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Error resetting DB:", err);
  process.exit(1);
});

