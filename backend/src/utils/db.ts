// TEMPORARILY DISABLED - Prisma engine compatibility issues
// This file is disabled while using the mock database (db-temp.ts)

// import { PrismaClient } from '@prisma/client';

// // Ultra-simple Prisma client setup
// declare global {
//   var prisma: PrismaClient | undefined;
// }

// export const prisma = globalThis.prisma || new PrismaClient();

// if (process.env.NODE_ENV !== 'production') {
//   globalThis.prisma = prisma;
// }

// Re-export from mock database for consistency
export { prisma } from './db-temp';
