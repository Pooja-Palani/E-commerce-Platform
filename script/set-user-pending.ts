/**
 * Set a user to PENDING status (e.g. to test approval flow).
 * Usage: npx tsx script/set-user-pending.ts [email]
 */
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../server/db";
import { users } from "@shared/schema";

const email = process.argv[2]?.trim().toLowerCase() || "user6@example.com";

async function main() {
  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`);
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }
  await db.update(users).set({ status: "PENDING", updatedAt: new Date() }).where(sql`lower(${users.email}) = ${email}`);
  console.log(`Set ${user.fullName} (${user.email}) to PENDING. They will see the approval screen until the manager approves.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
