/**
 * One-off script to set a user's password (e.g. when the stored hash doesn't match).
 * Usage: npx tsx script/set-admin-password.ts [email] [newPassword]
 * Example: npx tsx script/set-admin-password.ts admin@qvantomarket.com Theepakk123
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../server/db";
import { users } from "@shared/schema";

const email = process.argv[2]?.trim().toLowerCase() || "admin@qvantomarket.com";
const newPassword = process.argv[3] || "Theepakk123";

async function main() {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);
  await db.update(users).set({ passwordHash, status: "ACTIVE", updatedAt: new Date() }).where(eq(users.id, user.id));
  console.log(`Password updated and account activated for ${email}. You can now log in with that password.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
