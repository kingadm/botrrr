import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

function getPool() {
  if (globalForPrisma.pgPool) return globalForPrisma.pgPool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não está definida no ambiente (.env / Netlify env).");
  }

  // ✅ Neon/Postgres TLS: força SSL (resolve 500 de conexão)
  const needsSSL =
    connectionString.includes("sslmode=require") ||
    connectionString.includes("ssl=true") ||
    connectionString.includes("ssl=1");

  const pool = new Pool({
    connectionString,
    ssl: needsSSL ? { rejectUnauthorized: false } : undefined,
  });

  if (process.env.NODE_ENV !== "production") globalForPrisma.pgPool = pool;
  return pool;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(getPool()),
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
