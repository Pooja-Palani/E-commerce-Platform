import "dotenv/config";
import { db } from "../server/db";
import { communities } from "@shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const updates = [
    {
      name: "Anna Nagar 1",
      bannerUrl:
        "https://upload.wikimedia.org/wikipedia/commons/c/ca/Anna_Nagar_Tower.jpg",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Anna_Nagar_Tower.jpg",
    },
    {
      name: "Madurai Community1",
      bannerUrl:
        "https://upload.wikimedia.org/wikipedia/commons/7/78/Thirumalai_Nayak_Palace%2C_MAdurai.jpg",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/78/Thirumalai_Nayak_Palace%2C_MAdurai.jpg",
    },
  ];

  for (const u of updates) {
    const existing = await db.select().from(communities).where(eq(communities.name, u.name));
    if (!existing || existing.length === 0) {
      console.log(`Community not found: ${u.name}`);
      continue;
    }

    const res = await db
      .update(communities)
      .set({ bannerUrl: u.bannerUrl, logoUrl: u.logoUrl })
      .where(eq(communities.name, u.name))
      .returning();

    console.log(`Updated ${u.name}:`, res.map((r) => ({ id: r.id, bannerUrl: r.bannerUrl, logoUrl: r.logoUrl })));
  }

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
