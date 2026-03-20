/**
 * Seed sample data: communities, shops, users, managers, and listings.
 *
 * Run from project root:
 *   npx tsx script/seed-sample-data.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../server/db";
import {
  communities,
  users,
  listings,
  type Community,
  type User,
} from "@shared/schema";

async function main() {
  // Avoid duplicating data if script is run multiple times
  const existingCommunities: Community[] = await db.select().from(communities);
  if (existingCommunities.length > 0) {
    console.log("Communities already exist, skipping seeding.");
    return;
  }

  console.log("Seeding sample communities, users, and listings...");

  // 1. Communities & shops
  const [dlfThalambur] = await db
    .insert(communities)
    .values({
      name: "DLF-Thalambur",
      locality: "Thalambur",
      address: "Thalambur",
      description: "DLF community in Thalambur",
      contactEmail: "community-admin@example.com",
      contactPhone: "0000000000",
      facilities: "Gym, swimming pool, kids play area",
      rules: "Be a good neighbor.",
    })
    .returning();

  const [dlfTowerA] = await db
    .insert(communities)
    .values({
      name: "DLF-Thalambur - Tower A",
      parentId: dlfThalambur.id,
      locality: "Thalambur",
      address: "Tower A, DLF Thalambur",
      description: "Tower A shop",
      contactEmail: "tower-a@example.com",
      contactPhone: "0000000001",
    })
    .returning();

  const [dlfTowerB] = await db
    .insert(communities)
    .values({
      name: "DLF-Thalambur - Tower B",
      parentId: dlfThalambur.id,
      locality: "Thalambur",
      address: "Tower B, DLF Thalambur",
      description: "Tower B shop",
      contactEmail: "tower-b@example.com",
      contactPhone: "0000000002",
    })
    .returning();

  // 2. Users: one community manager + two residents who are also sellers
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash("123456", salt);

  const [cmUser] = await db
    .insert(users)
    .values({
      fullName: "DLF Community Manager",
      email: "cm-dlf@example.com",
      phone: "9000000001",
      passwordHash: defaultPasswordHash,
      role: "COMMUNITY_MANAGER",
      status: "ACTIVE",
      communityId: dlfThalambur.id,
      isSeller: false,
      locality: "Thalambur",
      address: "DLF-Thalambur",
    })
    .returning();

  const [seller1] = await db
    .insert(users)
    .values({
      fullName: "DLFUser-1",
      email: "seller1@example.com",
      phone: "9090909060",
      passwordHash: defaultPasswordHash,
      role: "RESIDENT",
      status: "ACTIVE",
      communityId: dlfTowerA.id,
      isSeller: true,
      sellerDisplayName: "DLFUser-1",
      sellerDescription: "Resident seller in Tower A",
      locality: "Thalambur",
      address: "Tower A, Flat 101",
      paymentAcceptsUpi: true,
      paymentAcceptsCash: true,
    })
    .returning();

  const [seller2] = await db
    .insert(users)
    .values({
      fullName: "DLFUser-2",
      email: "seller2@example.com",
      phone: "9090909070",
      passwordHash: defaultPasswordHash,
      role: "RESIDENT",
      status: "ACTIVE",
      communityId: dlfTowerB.id,
      isSeller: true,
      sellerDisplayName: "DLFUser-2",
      sellerDescription: "Resident service provider in Tower B",
      locality: "Thalambur",
      address: "Tower B, Flat 202",
      paymentAcceptsUpi: true,
      paymentAcceptsCash: true,
    })
    .returning();

  console.log("Created communities and users:");
  console.log("  Community manager:", cmUser.email);
  console.log("  Seller 1:", seller1.email);
  console.log("  Seller 2:", seller2.email);

  // 3. Listings: a product and a service, pending manager approval
  const [productListing] = await db
    .insert(listings)
    .values({
      title: "Second-hand bicycle",
      description: "Well-maintained bicycle suitable for daily commute.",
      price: 5000,
      listingType: "PRODUCT",
      category: "Sports & Outdoors",
      condition: "Used - good",
      availabilityBasis: "STOCK",
      stockQuantity: 1,
      sellerId: seller1.id,
      communityId: dlfThalambur.id,
      sellerNameSnapshot: seller1.sellerDisplayName ?? seller1.fullName,
      communityNameSnapshot: dlfThalambur.name,
      buyNowEnabled: true,
      contactSellerEnabled: true,
      paymentPreference: "DIRECT",
      sellerContactSnapshot: seller1.phone ?? seller1.email,
      visibility: "COMMUNITY_ONLY",
      status: "ACTIVE",
    })
    .returning();

  const [serviceListing] = await db
    .insert(listings)
    .values({
      title: "Weekend home cleaning",
      description: "Deep cleaning service for 2BHK apartments in DLF-Thalambur.",
      price: 800,
      listingType: "SERVICE",
      category: "Home Services",
      duration: "3 hours",
      mode: "On-site",
      availabilityBasis: "FOREVER",
      sellerId: seller2.id,
      communityId: dlfThalambur.id,
      sellerNameSnapshot: seller2.sellerDisplayName ?? seller2.fullName,
      communityNameSnapshot: dlfThalambur.name,
      buyNowEnabled: true,
      contactSellerEnabled: true,
      paymentPreference: "DIRECT",
      sellerContactSnapshot: seller2.phone ?? seller2.email,
      visibility: "COMMUNITY_ONLY",
      status: "ACTIVE",
    })
    .returning();

  console.log("Created listings (pending approval):");
  console.log("  Product:", productListing.title);
  console.log("  Service:", serviceListing.title);

  console.log("Seeding complete.");
}

main().catch((err) => {
  console.error("Error seeding sample data:", err);
  process.exit(1);
});

