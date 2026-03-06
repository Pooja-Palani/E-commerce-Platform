/**
 * Create missing tables: community_invites, listing_slots, bookings, orders, product_interests.
 * Run: npx tsx script/create-missing-tables.ts
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
  const r = await client.query(
    `SELECT 1 FROM pg_type WHERE typname = $1`,
    [name]
  );
  return r.rows.length > 0;
}

async function main() {
  const client = await pool.connect();
  try {
    // Create enums if missing
    if (!(await enumExists(client, "community_invite_status"))) {
      await client.query(`CREATE TYPE community_invite_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED')`);
      console.log("Created enum community_invite_status");
    }
    if (!(await enumExists(client, "booking_status"))) {
      await client.query(`CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')`);
      console.log("Created enum booking_status");
    }
    if (!(await enumExists(client, "order_status"))) {
      await client.query(`CREATE TYPE order_status AS ENUM ('PENDING', 'QUOTATION_PROVIDED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED')`);
      console.log("Created enum order_status");
    }
    if (!(await enumExists(client, "logistics_preference"))) {
      await client.query(`CREATE TYPE logistics_preference AS ENUM ('PICKUP', 'DELIVERY_SUPPORT')`);
      console.log("Created enum logistics_preference");
    }

    // community_invites
    if (!(await tableExists(client, "community_invites"))) {
      await client.query(`
        CREATE TABLE community_invites (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
          community_id VARCHAR NOT NULL,
          invitee_email TEXT NOT NULL,
          invitee_id VARCHAR,
          invited_by_id VARCHAR NOT NULL,
          status community_invite_status NOT NULL DEFAULT 'PENDING',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log("Created table community_invites");
    } else {
      console.log("Table community_invites already exists");
    }

    // listing_slots
    if (!(await tableExists(client, "listing_slots"))) {
      await client.query(`
        CREATE TABLE listing_slots (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
          listing_id VARCHAR NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log("Created table listing_slots");
    } else {
      console.log("Table listing_slots already exists");
    }

    // bookings
    if (!(await tableExists(client, "bookings"))) {
      await client.query(`
        CREATE TABLE bookings (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
          listing_id VARCHAR NOT NULL,
          user_id VARCHAR NOT NULL,
          seller_id VARCHAR NOT NULL,
          booking_date TIMESTAMP NOT NULL,
          slot_start_time TEXT,
          slot_end_time TEXT,
          status booking_status NOT NULL DEFAULT 'PENDING',
          price_snapshot INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          version INTEGER DEFAULT 1 NOT NULL
        )
      `);
      console.log("Created table bookings");
    } else {
      console.log("Table bookings already exists");
    }

    // orders
    if (!(await tableExists(client, "orders"))) {
      await client.query(`
        CREATE TABLE orders (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
          listing_id VARCHAR NOT NULL,
          user_id VARCHAR NOT NULL,
          seller_id VARCHAR NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          status order_status NOT NULL DEFAULT 'PENDING',
          price_snapshot INTEGER NOT NULL,
          logistics_preference logistics_preference NOT NULL DEFAULT 'PICKUP',
          delivery_address TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          version INTEGER DEFAULT 1 NOT NULL
        )
      `);
      console.log("Created table orders");
    } else {
      console.log("Table orders already exists");
    }

    // product_interests
    if (!(await tableExists(client, "product_interests"))) {
      await client.query(`
        CREATE TABLE product_interests (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
          listing_id VARCHAR NOT NULL,
          user_id VARCHAR NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log("Created table product_interests");
    } else {
      console.log("Table product_interests already exists");
    }

    // posts (forum)
    if (!(await tableExists(client, "posts"))) {
      await client.query(`
        CREATE TABLE posts (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
          community_id VARCHAR NOT NULL,
          author_id VARCHAR NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          listing_id VARCHAR,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log("Created table posts");
    } else {
      console.log("Table posts already exists");
    }

    // comments
    if (!(await tableExists(client, "comments"))) {
      await client.query(`
        CREATE TABLE comments (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
          post_id VARCHAR NOT NULL,
          author_id VARCHAR NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log("Created table comments");
    } else {
      console.log("Table comments already exists");
    }

    // platform_settings
    if (!(await tableExists(client, "platform_settings"))) {
      await client.query(`
        CREATE TABLE platform_settings (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
          platform_name TEXT NOT NULL DEFAULT 'Nexus Market',
          support_email TEXT NOT NULL DEFAULT 'support@nexusmarket.com',
          commission_rate INTEGER NOT NULL DEFAULT 5,
          enable_registration BOOLEAN NOT NULL DEFAULT true,
          enable_global_marketplace BOOLEAN NOT NULL DEFAULT true,
          enable_community_forums BOOLEAN NOT NULL DEFAULT true,
          maintenance_mode BOOLEAN NOT NULL DEFAULT false,
          require_2fa BOOLEAN NOT NULL DEFAULT false,
          session_timeout INTEGER NOT NULL DEFAULT 24,
          email_alerts BOOLEAN NOT NULL DEFAULT true,
          welcome_email_subject TEXT NOT NULL DEFAULT 'Welcome to Nexus Market!',
          auto_backup_frequency TEXT NOT NULL DEFAULT 'daily',
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log("Created table platform_settings");
    } else {
      console.log("Table platform_settings already exists");
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
