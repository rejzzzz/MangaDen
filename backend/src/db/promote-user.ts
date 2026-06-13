import { db } from "./index.js";
import { users } from "./schema/index.js";
import { eq } from "drizzle-orm";
import "dotenv/config";

async function promoteUser() {
    const email = process.argv[2];
    const role = process.argv[3] || "admin";

    if (!email) {
        console.error("Usage: pnpm db:set-role <email> [role]");
        process.exit(1);
    }

    const validRoles = ["user", "admin", "moderator"];
    if (!validRoles.includes(role)) {
        console.error(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
        process.exit(1);
    }

    console.log(`Setting role of ${email} to ${role}...`);

    const user = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (!user) {
        console.error(`User with email ${email} not found.`);
        process.exit(1);
    }

    await db
        .update(users)
        .set({ role: role as any })
        .where(eq(users.email, email));

    console.log(`✅ Successfully updated role for ${email} to ${role}.`);
    process.exit(0);
}

promoteUser().catch((err) => {
    console.error("❌ Failed to promote user:", err);
    process.exit(1);
});
