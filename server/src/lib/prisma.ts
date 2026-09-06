import { PrismaClient } from "@prisma/client";

/**
 * One client for the process. Better Auth's adapter and the domain routes both hold it,
 * and a second instance would open a second connection pool against the same database.
 */
export const prisma = new PrismaClient();
