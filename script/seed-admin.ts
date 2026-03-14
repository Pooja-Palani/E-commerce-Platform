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
        const [admin] = existing;
        await db.update(users).set({
            phone: "+91 98765 43210",
            address: "45, Anna Salai, T Nagar",
            locality: "Chennai, Tamil Nadu",
            postalCode: "600017",
        }).where(eq(users.id, admin.id));
        console.log("Updated admin profile with Chennai address");
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
        phone: "+91 98765 43210",
        address: "45, Anna Salai, T Nagar",
        locality: "Chennai, Tamil Nadu",
        postalCode: "600017",
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
