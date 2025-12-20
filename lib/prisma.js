import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

// Configuração do Prisma com tratamento de erros melhorado
const prismaClientOptions = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(prismaClientOptions)

// Tratamento de desconexão graceful
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Helper para verificar se o Prisma está conectado
export async function checkPrismaConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Erro de conexão Prisma:', error)
    return false
  }
}








