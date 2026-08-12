// Shared Prisma client for the backend.
// Keep a single client instance so all modules use the same connection pool.
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
