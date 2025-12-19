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
    // Verificar JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não está configurado')
      return secureJsonResponse(
        { 
          success: false, 
          error: { 
            message: 'Erro de configuração do servidor', 
            code: 'CONFIG_ERROR' 
          } 
        },
        500
      )
    }

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

    // Buscar usuário
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

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return secureJsonResponse(
        { success: false, error: { message: 'Credenciais inválidas', code: 'UNAUTHORIZED' } },
        401
      )
    }

    // Gerar token
    const token = signSync(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    // Log de auditoria (opcional - não quebra o login se falhar)
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          entity: 'auth',
          metadataJson: { email },
        },
      })
    } catch (auditError) {
      // Log o erro mas não quebra o login
      console.error('Erro ao criar log de auditoria:', auditError)
    }

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

    // Log detalhado do erro para debug
    console.error('Erro no login:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      // Não logar dados sensíveis
    })

    // Em produção, não expor detalhes do erro
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Erro ao fazer login. Verifique as credenciais.' 
      : `Erro: ${error.message}`

    return secureJsonResponse(
      { 
        success: false, 
        error: { 
          message: errorMessage, 
          code: 'INTERNAL_ERROR',
          // Apenas em desenvolvimento
          ...(process.env.NODE_ENV !== 'production' && { 
            details: error.message,
            stack: error.stack 
          })
        } 
      },
      500
    )
  }
}

