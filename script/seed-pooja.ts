/**
 * Seed a sample seller user: pooja@example.com
 * - Adds her as a RESIDENT seller
 * - Attaches her to two communities (if available)
 * - Creates a few listings covering different use cases
 *
 * Run from project root:
 *   npx tsx script/seed-pooja.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../server/db";
import {
  communities,
  users,
  listings,
  userCommunities,
  type Community,
  type User,
} from "@shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const email = "pooja@example.com";

  const existing: User[] = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    console.log("User already exists:", email, "id:", existing[0].id);
    return;
  }

  const allCommunities: Community[] = await db.select().from(communities);
  if (allCommunities.length === 0) {
    throw new Error("No communities found. Run seed-sample-data.ts first.");
  }

  const [primaryCommunity, secondaryCommunity] = allCommunities;

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("123456", salt);

  const [pooja] = await db
    .insert(users)
    .values({
      fullName: "Pooja",
      email,
      phone: "9898989898",
      passwordHash,
      role: "RESIDENT",
      status: "ACTIVE",
      communityId: primaryCommunity.id,
      isSeller: true,
      sellerDisplayName: "Pooja",
      sellerDescription: "Multi-talented neighbor offering both products and services.",
      locality: primaryCommunity.locality ?? "Locality",
      address: primaryCommunity.address ?? "Primary community address",
      paymentAcceptsUpi: true,
      paymentAcceptsCash: true,
    })
    .returning();

  console.log("Created user:", email, "id:", pooja.id);

  // Attach to two communities (primary + secondary if present)
  await db.insert(userCommunities).values({
    userId: pooja.id,
    communityId: primaryCommunity.id,
    status: "ACTIVE",
  });
  if (secondaryCommunity) {
    await db.insert(userCommunities).values({
      userId: pooja.id,
      communityId: secondaryCommunity.id,
      status: "ACTIVE",
    });
  }

  // Helper for snapshots
  const sellerNameSnapshot = pooja.sellerDisplayName ?? pooja.fullName;

  // Listings for different use cases
  const [stockProduct] = await db
    .insert(listings)
    .values({
      title: "Kitchen starter set",
      description: "Lightly used set of pots, pans, and utensils perfect for new homes.",
      price: 2500,
      listingType: "PRODUCT",
      category: "Home & Kitchen",
      condition: "Used - like new",
      availabilityBasis: "STOCK",
      stockQuantity: 5,
      sellerId: pooja.id,
      communityId: primaryCommunity.id,
      sellerNameSnapshot,
      communityNameSnapshot: primaryCommunity.name,
      buyNowEnabled: true,
      contactSellerEnabled: true,
      paymentPreference: "DIRECT",
      sellerContactSnapshot: pooja.phone ?? pooja.email,
      visibility: "COMMUNITY_ONLY",
      status: "ACTIVE",
    })
    .returning();

  const [quotationProduct] = await db
    .insert(listings)
    .values({
      title: "Event decoration package",
      description: "Custom decoration for small events and birthdays in your community.",
      price: 0,
      listingType: "PRODUCT",
      category: "Events",
      condition: "New",
      availabilityBasis: "FOREVER",
      sellerId: pooja.id,
      communityId: primaryCommunity.id,
      sellerNameSnapshot,
      communityNameSnapshot: primaryCommunity.name,
      buyNowEnabled: false, // quotation-only
      contactSellerEnabled: true,
      paymentPreference: "DIRECT",
      sellerContactSnapshot: pooja.phone ?? pooja.email,
      visibility: "COMMUNITY_ONLY",
      status: "ACTIVE",
    })
    .returning();

  const [foreverService] = await db
    .insert(listings)
    .values({
      title: "Weekend yoga sessions",
      description: "Group yoga classes in the community park every weekend morning.",
      price: 300,
      listingType: "SERVICE",
      category: "Health & Fitness",
      duration: "1 hour",
      mode: "On-site",
      availabilityBasis: "FOREVER",
      sellerId: pooja.id,
      communityId: primaryCommunity.id,
      sellerNameSnapshot,
      communityNameSnapshot: primaryCommunity.name,
      buyNowEnabled: true,
      contactSellerEnabled: true,
      paymentPreference: "DIRECT",
      sellerContactSnapshot: pooja.phone ?? pooja.email,
      visibility: "COMMUNITY_ONLY",
      status: "ACTIVE",
    })
    .returning();

  const [timelineService] = await db
    .insert(listings)
    .values({
      title: "Exam prep tutoring (April batch)",
      description: "Focused exam preparation classes for school students during April.",
      price: 600,
      listingType: "SERVICE",
      category: "Tutoring",
      duration: "1.5 hours",
      mode: "On-site",
      availabilityBasis: "TIMELINE",
      startDate: new Date(new Date().getFullYear(), 3, 1), // April 1
      endDate: new Date(new Date().getFullYear(), 3, 30), // April 30
      sellerId: pooja.id,
      communityId: secondaryCommunity?.id ?? primaryCommunity.id,
      sellerNameSnapshot,
      communityNameSnapshot: (secondaryCommunity ?? primaryCommunity).name,
      buyNowEnabled: true,
      contactSellerEnabled: true,
      paymentPreference: "DIRECT",
      sellerContactSnapshot: pooja.phone ?? pooja.email,
      visibility: "COMMUNITY_ONLY",
      status: "ACTIVE",
    })
    .returning();

  console.log("Created listings for Pooja (all pending approval):");
  console.log("  Stock product:", stockProduct.title);
  console.log("  Quotation product:", quotationProduct.title);
  console.log("  Forever service:", foreverService.title);
  console.log("  Timeline service:", timelineService.title);
}

main().catch((err) => {
  console.error("Error seeding Pooja user:", err);
  process.exit(1);
});

