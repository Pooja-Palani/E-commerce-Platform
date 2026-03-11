/**
 * Convenience script to activate all listings (set status = 'ACTIVE').
 * Useful for demos so products/services immediately appear in marketplaces.
 *
 * Run:
 *   npx tsx script/activate-all-listings.ts
 */
import "dotenv/config";
import { db } from "../server/db";
import { listings } from "@shared/schema";

async function main() {
  const updated = await db.update(listings).set({ status: "ACTIVE" }).returning({ id: listings.id, status: listings.status });
  console.log(`Activated ${updated.length} listings.`);
}

main().catch((err) => {
  console.error("Error activating listings:", err);
  process.exit(1);
});

