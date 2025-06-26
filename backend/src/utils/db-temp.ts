// Temporary mock database for testing server startup
export const prisma = {
  user: {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async () => ({}),
    update: async () => ({}),
    updateMany: async () => ({ count: 0 }),
    delete: async () => ({}),
  },
  student: {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async () => ({}),
    update: async () => ({}),
    count: async () => 0,
  },
  employee: {
    findFirst: async () => null,
    findMany: async () => [],
  },
  userSession: {
    create: async () => ({}),
    updateMany: async () => ({ count: 0 }),
  },
  grade: {
    findMany: async () => [],
  },
  attendance: {
    findMany: async () => [],
  },
  payment: {
    findMany: async () => [],
  },
  feeStructure: {
    findFirst: async () => null,
  },
  // Add disconnect method for graceful shutdown
  $disconnect: async () => {
    console.log('Mock Prisma: Disconnect called');
  },
} as any;
