/**
 * Fix user email to lowercase so OTP/password login works (email lookup is case-insensitive).
 * Usage: npx tsx script/fix-user-email.ts [email]
 * Example: npx tsx script/fix-user-email.ts CM-UrbanTree@gmail.com
 */
import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { db } from "../server/db";
import { users } from "@shared/schema";

const searchEmail = process.argv[2]?.trim() || "CM-UrbanTree@gmail.com";
const normalizedEmail = searchEmail.toLowerCase();

async function main() {
  // Find user by case-insensitive email match
  const result = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${normalizedEmail}`);
  const user = result[0];
  if (!user) {
    console.error(`User not found with email: ${searchEmail} (or lowercase variant)`);
    process.exit(1);
  }
  if (user.email === normalizedEmail) {
    console.log(`Email for ${user.fullName} is already lowercase: ${user.email}`);
    process.exit(0);
  }
  await db
    .update(users)
    .set({ email: normalizedEmail, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  console.log(`Updated email: "${user.email}" → "${normalizedEmail}" for ${user.fullName}`);
  console.log(`User status: ${user.status}. OTP login should now work.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
