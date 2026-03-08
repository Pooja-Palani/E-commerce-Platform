/**
 * Create reports table for listing/booking reports.
 * Run: npx tsx script/add-reports-table.ts
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

async function enumExists(client: pg.PoolClient, name: string): Promise<boolean> {
  const r = await client.query(`SELECT 1 FROM pg_type WHERE typname = $1`, [name]);
  return r.rows.length > 0;
}

async function main() {
  const client = await pool.connect();
  try {
    if (!(await enumExists(client, "report_reason"))) {
      await client.query(`
        CREATE TYPE report_reason AS ENUM (
          'INAPPROPRIATE_CONTENT',
          'MISLEADING_DESCRIPTION',
          'FAKE_OR_SPAM',
          'QUALITY_ISSUE',
          'SCAM_OR_FRAUD',
          'OTHER'
        )
      `);
      console.log("Created enum report_reason");
    }

    if (!(await tableExists(client, "reports"))) {
      await client.query(`
        CREATE TABLE reports (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
          listing_id VARCHAR NOT NULL,
          reporter_id VARCHAR NOT NULL,
          community_id VARCHAR NOT NULL,
          reason report_reason NOT NULL,
          details TEXT,
          booking_id VARCHAR,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log("Created table reports");
    } else {
      console.log("Table reports already exists");
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
