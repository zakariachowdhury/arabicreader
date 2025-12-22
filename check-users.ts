import "dotenv/config";
import { db } from "./src/db";
import { user } from "./src/db/schema";
import { desc } from "drizzle-orm";

async function main() {
    const latestUsers = await db.select().from(user).orderBy(desc(user.createdAt)).limit(5);
    console.log(JSON.stringify(latestUsers, null, 2));
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
