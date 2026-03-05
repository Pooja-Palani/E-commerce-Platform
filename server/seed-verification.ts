import { db } from "./db";
import { listings, posts, users, communities } from "@shared/schema";

async function seed() {
    // Find an active user and community
    const dbUsers = await db.select().from(users).limit(1);
    const dbCommunities = await db.select().from(communities).limit(1);

    if (dbUsers.length === 0 || dbCommunities.length === 0) {
        console.log("No users or communities found to seed listings.");
        return;
    }

    const user = dbUsers[0];
    const community = dbCommunities[0];

    console.log(`Seeding for user: ${user.email} in community: ${community.name}`);

    // Seed Listings
    const testListings = [
        {
            title: "Premium Home Cleaning",
            description: "Deep cleaning for 2BHK/3BHK apartments. Professional equipment used.",
            price: 150000,
            listingType: "SERVICE",
            category: "Cleaning",
            sellerId: user.id,
            communityId: community.id,
            sellerNameSnapshot: user.fullName,
            communityNameSnapshot: community.name,
            buyNowEnabled: true,
            contactSellerEnabled: true,
            visibility: "COMMUNITY_ONLY"
        },
        {
            title: "Ergonomic Office Chair",
            description: "Barely used Steelcase Leap V2. Great for posture.",
            price: 2500000,
            listingType: "PRODUCT",
            category: "Furniture",
            condition: "Like New",
            sellerId: user.id,
            communityId: community.id,
            sellerNameSnapshot: user.fullName,
            communityNameSnapshot: community.name,
            buyNowEnabled: true,
            contactSellerEnabled: true,
            visibility: "GLOBAL"
        },
        {
            title: "Yoga Classes",
            description: "Weekend batch sessions in the community park.",
            price: 50000,
            listingType: "SERVICE",
            category: "Fitness",
            sellerId: user.id,
            communityId: community.id,
            sellerNameSnapshot: user.fullName,
            communityNameSnapshot: community.name,
            availabilityBasis: "TIMELINE",
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            buyNowEnabled: false,
            contactSellerEnabled: true,
            visibility: "COMMUNITY_ONLY"
        }
    ];

    for (const l of testListings) {
        await db.insert(listings).values(l as any);
    }

    // Seed Forum Posts
    const testPosts = [
        {
            communityId: community.id,
            authorId: user.id,
            title: "Welcome to our new Community Forum!",
            content: "Hi neighbors! Let's use this space to discuss local events, share tips, and build a better neighborhood together."
        },
        {
            communityId: community.id,
            authorId: user.id,
            title: "Lost Cat near Building B",
            content: "Our Ginger tabby went missing this morning. Please let us know if you see him!"
        }
    ];

    for (const p of testPosts) {
        await db.insert(posts).values(p as any);
    }

    console.log("Seeding complete!");
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
