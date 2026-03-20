/**
 * Script to remove all listings and related data (slots, bookings, orders, interests, posts related to listings) from the DB.
 * Run:
 *   npx tsx script/clear-listings.ts
 */
import "dotenv/config";
import { db } from "../server/db";
import {
  listings, listingSlots, bookings, orders, productInterests, posts, comments
} from "../shared/schema";

async function main() {
  try {
    // 1) find all listing ids
    const all = await db.select({ id: listings.id }).from(listings);
    const ids = all.map((r: any) => r.id as string);

    if (ids.length) {
      console.log(`Deleting related slots, interests, bookings, orders for ${ids.length} listings...`);
      await db.delete(listingSlots).where(inArray(listingSlots.listingId, ids) as any);
      await db.delete(productInterests).where(inArray(productInterests.listingId, ids) as any);
      await db.delete(bookings).where(inArray(bookings.listingId, ids) as any);
      await db.delete(orders).where(inArray(orders.listingId, ids) as any);

      console.log("Deleting listings...");
      await db.delete(listings).where(inArray(listings.id, ids) as any);
    } else {
      console.log("No listings found.");
    }

    // Also remove any posts/comments that reference deleted listings (safety)
    const affectedPosts = await db.select({ id: posts.id }).from(posts).where(inArray(posts.listingId, ids) as any);
    const postIds = affectedPosts.map((p: any) => p.id as string);
    if (postIds.length) {
      console.log(`Deleting ${postIds.length} comments for affected posts...`);
      await db.delete(comments).where(inArray(comments.postId, postIds) as any);
      console.log("Deleting affected posts...");
      await db.delete(posts).where(inArray(posts.id, postIds) as any);
    }

    console.log("Cleared listings and related data.");
  } catch (err) {
    console.error("Error clearing listings:", err);
    process.exit(1);
  }
}

// helper import for inArray used above (drizzle helper)
import { inArray } from "drizzle-orm";

main().catch((e) => { console.error(e); process.exit(1); });
