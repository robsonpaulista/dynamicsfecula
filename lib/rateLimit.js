// Rate limiting simples usando Map (para produção, considere usar Redis)
const requestCounts = new Map()

export function rateLimit(maxRequests = 10, windowMs = 60000) {
  return (request) => {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const now = Date.now()
    const key = `${ip}:${Math.floor(now / windowMs)}`
    
    const count = requestCounts.get(key) || 0
    
    if (count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        reset: (Math.floor(now / windowMs) + 1) * windowMs
      }
    }
    
    requestCounts.set(key, count + 1)
    
    // Limpar entradas antigas (a cada 100 requisições)
    if (requestCounts.size > 1000) {
      const cutoff = Math.floor((now - windowMs * 2) / windowMs)
      for (const [k] of requestCounts) {
        const keyTime = parseInt(k.split(':')[1])
        if (keyTime < cutoff) {
          requestCounts.delete(k)
        }
      }
    }
    
    return {
      allowed: true,
      remaining: maxRequests - count - 1,
      reset: (Math.floor(now / windowMs) + 1) * windowMs
    }
  }
}





