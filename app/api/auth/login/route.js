import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signSync } from '@/lib/jwt'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { BadRequestError, UnauthorizedError } from '@/utils/errors'
import { rateLimit } from '@/lib/rateLimit'
import { secureJsonResponse } from '@/lib/security'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

// Rate limiting: 5 tentativas por minuto
const loginRateLimit = rateLimit(5, 60000)

export async function POST(request) {
  try {
    // Rate limiting
    const rateLimitResult = loginRateLimit(request)
    if (!rateLimitResult.allowed) {
      return secureJsonResponse(
        { 
          success: false, 
          error: { 
            message: 'Muitas tentativas de login. Tente novamente em alguns minutos.', 
            code: 'RATE_LIMIT_EXCEEDED' 
          } 
        },
        429
      )
    }

    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.isActive) {
      // Não revelar se o usuário existe ou não por segurança
      return secureJsonResponse(
        { success: false, error: { message: 'Credenciais inválidas', code: 'UNAUTHORIZED' } },
        401
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return secureJsonResponse(
        { success: false, error: { message: 'Credenciais inválidas', code: 'UNAUTHORIZED' } },
        401
      )
    }

    const token = signSync(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'auth',
        metadataJson: { email },
      },
    })

    return secureJsonResponse({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return secureJsonResponse(
        { success: false, error: { message: error.errors[0].message, code: 'VALIDATION_ERROR' } },
        400
      )
    }

    // Não expor detalhes do erro em produção
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Erro ao fazer login' 
      : error.message

    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      console.error('Login error:', error)
    }
    return secureJsonResponse(
      { success: false, error: { message: errorMessage, code: 'INTERNAL_ERROR' } },
      500
    )
  }
}

