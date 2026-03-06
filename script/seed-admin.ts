import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    const email = "admin@example.com";
    const password = "adminpassword123";

    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
        console.log("Admin user already exists");
        process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [admin] = await db.insert(users).values({
        fullName: "Administrator",
        email: email,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        isSeller: true,
    }).returning();

    console.log("Admin account created successfully!");
    console.log("Email:", email);
    console.log("Password:", password);
    process.exit(0);
}

main().catch((err) => {
    console.error("Error seeding admin:", err);
    process.exit(1);
});
