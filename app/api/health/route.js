import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Rota de diagnóstico para verificar:
 * - Conexão com banco de dados
 * - Variáveis de ambiente
 * - Status do sistema
 */
export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      env: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        JWT_SECRET: !!process.env.JWT_SECRET,
        NODE_ENV: process.env.NODE_ENV,
      },
    },
    errors: [],
  }

  // Verificar conexão com banco
  try {
    await prisma.$queryRaw`SELECT 1`
    health.checks.database = 'connected'
  } catch (error) {
    health.checks.database = 'error'
    health.errors.push({
      type: 'database',
      message: error.message,
    })
    health.status = 'error'
  }

  // Verificar se tabela users existe e tem dados
  try {
    const userCount = await prisma.user.count()
    health.checks.users = {
      tableExists: true,
      count: userCount,
    }
  } catch (error) {
    health.checks.users = {
      tableExists: false,
      error: error.message,
    }
    health.errors.push({
      type: 'users_table',
      message: error.message,
    })
  }

  // Verificar se há usuário admin
  try {
    const admin = await prisma.user.findFirst({
      where: {
        email: 'admin@example.com',
        role: 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    })
    health.checks.adminUser = admin ? {
      exists: true,
      isActive: admin.isActive,
    } : {
      exists: false,
    }
  } catch (error) {
    health.checks.adminUser = {
      error: error.message,
    }
  }

  return NextResponse.json(health, {
    status: health.status === 'ok' ? 200 : 500,
  })
}










