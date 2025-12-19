// Wrapper para jsonwebtoken que funciona melhor com Next.js
// Usa import dinâmico para evitar problemas de bundling

let jwtModule = null

async function getJwt() {
  if (typeof window !== 'undefined') {
    throw new Error('jsonwebtoken só pode ser usado no servidor')
  }
  
  if (!jwtModule) {
    jwtModule = await import('jsonwebtoken')
  }
  
  return jwtModule.default || jwtModule
}

export function verify(token, secret) {
  return getJwt().then(jwt => jwt.verify(token, secret))
}

export function sign(payload, secret, options) {
  return getJwt().then(jwt => jwt.sign(payload, secret, options))
}

// Versões síncronas para uso em middleware
export function verifySync(token, secret) {
  if (typeof window !== 'undefined') {
    throw new Error('jsonwebtoken só pode ser usado no servidor')
  }
  const jwt = require('jsonwebtoken')
  return jwt.verify(token, secret)
}

export function signSync(payload, secret, options) {
  if (typeof window !== 'undefined') {
    throw new Error('jsonwebtoken só pode ser usado no servidor')
  }
  const jwt = require('jsonwebtoken')
  return jwt.sign(payload, secret, options)
}

