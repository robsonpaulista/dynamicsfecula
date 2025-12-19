import { UnauthorizedError, ForbiddenError } from '@/utils/errors'
import { verifySync } from '@/lib/jwt'

export function authenticate(request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token não fornecido')
    }

    const token = authHeader.substring(7)
    const decoded = verifySync(token, process.env.JWT_SECRET)
    
    return decoded
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token inválido ou expirado')
    }
    throw error
  }
}

export function authorize(user, ...roles) {
  if (!user) {
    throw new UnauthorizedError('Usuário não autenticado')
  }

  if (!roles.includes(user.role)) {
    throw new ForbiddenError('Acesso negado. Permissão insuficiente.')
  }
}

