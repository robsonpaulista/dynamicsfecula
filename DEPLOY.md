# 🚀 Guia de Deploy na Vercel

## ✅ Prisma funciona perfeitamente na Vercel!

O Prisma roda **localmente no servidor da Vercel** durante o build e runtime. Você só precisa de um **banco de dados PostgreSQL na nuvem**.

## 📋 Opções de Banco de Dados (Todas Gratuitas!)

### 1. **Vercel Postgres** (Recomendado - Integrado)
- ✅ Integrado com Vercel
- ✅ Plano gratuito generoso
- ✅ Configuração automática
- 🔗 [vercel.com/storage/postgres](https://vercel.com/storage/postgres)

### 2. **Supabase** (Muito Popular)
- ✅ 500MB grátis
- ✅ Interface visual excelente
- ✅ Backup automático
- 🔗 [supabase.com](https://supabase.com)

### 3. **Neon** (Serverless PostgreSQL)
- ✅ Plano gratuito
- ✅ Auto-scaling
- ✅ Branching de banco
- 🔗 [neon.tech](https://neon.tech)

### 4. **Railway**
- ✅ $5 grátis por mês
- ✅ Deploy fácil
- 🔗 [railway.app](https://railway.app)

## 🔧 Passo a Passo para Deploy

### Opção A: Vercel Postgres (Mais Fácil)

#### 1. Criar Projeto na Vercel

```bash
# Instalar Vercel CLI (opcional)
npm i -g vercel

# Ou fazer pelo site: vercel.com
```

#### 2. Adicionar Vercel Postgres

1. No dashboard da Vercel, vá em **Storage**
2. Clique em **Create Database** → **Postgres**
3. Escolha o plano **Hobby** (gratuito)
4. Anote a `DATABASE_URL` que será gerada

#### 3. Configurar Variáveis de Ambiente

No dashboard da Vercel → **Settings** → **Environment Variables**:

```
DATABASE_URL=postgres://user:pass@host:5432/dbname
JWT_SECRET=seu-secret-super-seguro-aqui
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_API_URL=/api
```

#### 4. Fazer Deploy

```bash
# Via CLI
vercel

# Ou conectar repositório GitHub e fazer deploy automático
```

#### 5. Rodar Migrations

Após o primeiro deploy, rode as migrations:

```bash
# Via Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy

# Ou configure um script no package.json
```

### Opção B: Supabase (Recomendado para Começar)

#### 1. Criar Conta no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta (gratuita)
3. Crie um novo projeto

#### 2. Obter Connection String

1. No projeto Supabase, vá em **Settings** → **Database**
2. Copie a **Connection String** (URI)
3. Formato: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

#### 3. Configurar na Vercel

No dashboard da Vercel → **Settings** → **Environment Variables**:

```
DATABASE_URL=postgresql://postgres:senha@db.xxxxx.supabase.co:5432/postgres
JWT_SECRET=seu-secret-super-seguro-aqui
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_API_URL=/api
```

#### 4. Deploy

```bash
vercel
```

#### 5. Rodar Migrations

```bash
# Conectar ao banco remoto
vercel env pull .env.local

# Rodar migrations
npx prisma migrate deploy

# Popular banco (opcional)
npm run db:seed
```

## 🔐 Variáveis de Ambiente na Vercel

Configure estas variáveis no dashboard da Vercel:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | String de conexão do PostgreSQL | `postgresql://...` |
| `JWT_SECRET` | Secret para JWT (use algo seguro!) | `seu-secret-aqui` |
| `JWT_EXPIRES_IN` | Expiração do token | `7d` |
| `NEXT_PUBLIC_API_URL` | URL da API (use `/api` para relativo) | `/api` |

## 📝 Scripts Importantes

O `package.json` já está configurado:

```json
{
  "scripts": {
    "postinstall": "prisma generate",  // Gera Prisma Client no build
    "build": "prisma generate && next build",
    "db:migrate:deploy": "prisma migrate deploy"  // Para produção
  }
}
```

## 🚀 Build na Vercel

A Vercel automaticamente:

1. ✅ Instala dependências (`npm install`)
2. ✅ Roda `postinstall` → gera Prisma Client
3. ✅ Roda `build` → build do Next.js
4. ✅ Deploy automático

## 🔄 Workflow Recomendado

### Desenvolvimento Local

```bash
# 1. Banco local (Docker)
docker-compose up -d

# 2. Migrations locais
npm run db:migrate

# 3. Desenvolvimento
npm run dev
```

### Deploy Produção

```bash
# 1. Criar banco na nuvem (Supabase/Vercel Postgres)
# 2. Configurar DATABASE_URL na Vercel
# 3. Deploy
vercel

# 4. Rodar migrations no banco de produção
vercel env pull .env.production
npx prisma migrate deploy

# 5. Popular banco (opcional)
npm run db:seed
```

## 🐛 Troubleshooting

### Erro: "Prisma Client not generated"

**Solução**: Adicione `postinstall` no package.json (já está configurado!)

### Erro: "Migration not applied"

**Solução**: Rode `npx prisma migrate deploy` após o deploy

### Erro: "Connection timeout"

**Solução**: Verifique se o banco permite conexões externas (IP whitelist)

## 💡 Dicas

1. **Use Vercel Postgres** para simplicidade máxima
2. **Use Supabase** se quiser interface visual para o banco
3. **Sempre rode migrations** após deploy (`prisma migrate deploy`)
4. **Use variáveis de ambiente** diferentes para dev/prod
5. **Backup automático**: Supabase e Vercel Postgres fazem backup

## 📚 Recursos

- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma + Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Supabase Docs](https://supabase.com/docs)

---

**Resumo**: O Prisma roda **localmente no servidor da Vercel**. Você só precisa de um **PostgreSQL na nuvem** (gratuito!). Configure a `DATABASE_URL` e pronto! 🎉

















