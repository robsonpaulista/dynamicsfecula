# 🚀 Setup Rápido para Vercel

## Como Funciona o Prisma na Vercel

```
┌─────────────────────────────────────────┐
│         VERCEL (Servidor)              │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   Next.js App                    │  │
│  │   ┌──────────────────────────┐   │  │
│  │   │  Prisma Client           │   │  │
│  │   │  (gerado no build)       │   │  │
│  │   └──────────────────────────┘   │  │
│  │            ↓                      │  │
│  │   Conecta via DATABASE_URL       │  │
│  └──────────────────────────────────┘  │
│            ↓                              │
└────────────┼──────────────────────────────┘
             │
             │ HTTPS
             │
┌────────────┼──────────────────────────────┐
│            ↓                              │
│   PostgreSQL na Nuvem                    │
│   (Supabase/Vercel Postgres/Neon)        │
└──────────────────────────────────────────┘
```

## ✅ Passo a Passo Simplificado

### 1️⃣ Escolha um Banco (Gratuito)

**Opção A: Vercel Postgres** (Mais fácil)
- Vercel Dashboard → Storage → Create Database → Postgres
- `DATABASE_URL` gerada automaticamente ✅

**Opção B: Supabase** (Recomendado)
- [supabase.com](https://supabase.com) → Criar projeto
- Settings → Database → Connection String
- Copiar `DATABASE_URL`

### 2️⃣ Configure na Vercel

Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=postgresql://...
JWT_SECRET=seu-secret-aqui
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_API_URL=/api
```

### 3️⃣ Deploy

```bash
# Via CLI
vercel

# Ou conecte GitHub para deploy automático
```

### 4️⃣ Migrations

Após primeiro deploy:

```bash
vercel env pull .env.production
npx prisma migrate deploy
npm run db:seed  # opcional
```

## 🎯 Resumo

- ✅ Prisma roda **localmente no servidor Vercel**
- ✅ Você só precisa de um **PostgreSQL na nuvem** (gratuito!)
- ✅ Configure `DATABASE_URL` → Pronto!
- ✅ Build automático gera Prisma Client

## 📚 Links Úteis

- [Vercel Postgres](https://vercel.com/storage/postgres) - Integrado
- [Supabase](https://supabase.com) - 500MB grátis
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Prisma + Vercel Docs](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

---

**É simples assim!** 🎉










