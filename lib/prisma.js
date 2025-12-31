import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

// Função para garantir que sempre use Connection Pooler (porta 6543)
function ensurePoolerConnection(url) {
  if (!url) {
    throw new Error('DATABASE_URL não está definida')
  }

  try {
    const urlObj = new URL(url)
    
    // Se já está usando pooler (porta 6543), retorna como está
    if (urlObj.port === '6543' || urlObj.hostname.includes('pooler')) {
      // Garante que tem os parâmetros do pooler
      urlObj.searchParams.set('pgbouncer', 'true')
      urlObj.searchParams.set('connection_limit', '1')
      return urlObj.toString()
    }

    // Se está usando conexão direta (porta 5432), converte para pooler
    if (urlObj.port === '5432' || urlObj.hostname.includes('db.') && !urlObj.hostname.includes('pooler')) {
      // Converte para pooler
      // Exemplo: db.rxojryfxuskrqzmkyxlr.supabase.co -> aws-0-sa-east-1.pooler.supabase.com
      const projectRef = urlObj.hostname.split('.')[0].replace('db.', '')
      
      // Tenta detectar região (padrão: sa-east-1)
      let region = 'sa-east-1'
      if (urlObj.hostname.includes('us-')) region = 'us-east-1'
      if (urlObj.hostname.includes('eu-')) region = 'eu-west-1'
      if (urlObj.hostname.includes('ap-')) region = 'ap-southeast-1'
      
      // Constrói URL do pooler
      urlObj.hostname = `aws-0-${region}.pooler.supabase.com`
      urlObj.port = '6543'
      
      // Ajusta usuário para formato pooler (postgres.PROJECT_REF)
      if (!urlObj.username.includes('.')) {
        urlObj.username = `postgres.${projectRef}`
      }
      
      // Adiciona parâmetros do pooler
      urlObj.searchParams.set('pgbouncer', 'true')
      urlObj.searchParams.set('connection_limit', '1')
      
      console.warn('⚠️ DATABASE_URL convertida para Connection Pooler (porta 6543)')
      return urlObj.toString()
    }

    // Se já tem parâmetros do pooler, apenas garante que estão corretos
    urlObj.searchParams.set('pgbouncer', 'true')
    urlObj.searchParams.set('connection_limit', '1')
    
    return urlObj.toString()
  } catch (error) {
    console.error('Erro ao processar DATABASE_URL:', error)
    // Em caso de erro, retorna a URL original
    return url
  }
}

// Garante que sempre usa pooler em produção
const databaseUrl = process.env.NODE_ENV === 'production' 
  ? ensurePoolerConnection(process.env.DATABASE_URL)
  : process.env.DATABASE_URL

// Configuração do Prisma com tratamento de erros melhorado
const prismaClientOptions = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: databaseUrl,
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












