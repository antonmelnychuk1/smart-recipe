import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: ".env.local" });

const argument = process.argv[2]?.trim();
const email = argument?.toLowerCase();

if (!argument) {
  console.error(
    "Usage: npm run admin:promote -- user@example.com OR npm run admin:promote -- --only-user",
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function main() {
  try {
    if (argument === "--only-user") {
      const users = await prisma.user.findMany({
        select: { id: true },
        take: 2,
        orderBy: { createdAt: "asc" },
      });

      if (users.length !== 1) {
        console.error(
          `Expected exactly one user, but found ${users.length === 2 ? "at least 2" : users.length}. Promote by email instead.`,
        );
        process.exitCode = 1;
      } else {
        await prisma.user.update({
          where: { id: users[0].id },
          data: { role: "admin" },
        });
        console.log("The only existing user now has administrator access.");
      }
      return;
    }

    const user = await prisma.user.update({
      where: { email },
      data: { role: "admin" },
      select: { email: true, name: true },
    });

    console.log(`Admin access granted to ${user.name} (${user.email}).`);
  } catch {
    console.error(`No user found with email: ${email}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
