import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";

let prisma;

try {
  const connectionString = `${process.env.DATABASE_URL}`;

  const adapter = new PrismaBetterSqlite3({ url: connectionString });
  prisma = new PrismaClient({ adapter });
  console.log("✅ successfully connected to database ");
} catch (error) {
  console.log("❌ errror while connecting to database ", error);
  process.exit(1);
}

export { prisma };
