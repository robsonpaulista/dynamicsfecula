const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.APP_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;












