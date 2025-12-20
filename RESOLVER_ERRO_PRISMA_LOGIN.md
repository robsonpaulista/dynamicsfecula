# 🔧 Resolver: Erro "Invalid prisma.user.findUnique() invocation"

## ⚠️ Problema nos Logs

Erro nos logs do Vercel:
```
Erro no login: { message: '\\n' + 'Invalid `prisma.user.findUnique()` invoca...
```

Isso indica que o Prisma não consegue executar a query, geralmente por:
1. **Banco não conectado** - Connection string incorreta
2. **Prisma Client não gerado** - Problema no build
3. **Schema desatualizado** - Prisma Client não sincronizado com o banco

## ✅ Soluções

### 1. Verificar Connection String no Vercel

**Use a connection string que funciona localmente:**

```
postgresql://postgres:86Dynamics@db.rxojryfxuskrqzmkyxlr.supabase.co:5432/postgres?sslmode=require
```

**Passos:**
1. Vercel Dashboard → **Settings** → **Environment Variables**
2. Encontre `DATABASE_URL`
3. Verifique se está **exatamente** igual ao `.env.local`
4. Deve ter `?sslmode=require` no final
5. Salve e faça **Redeploy**

### 2. Verificar se Prisma Client Foi Gerado

O build do Vercel deve mostrar:
```
✔ Generated Prisma Client (v5.22.0) to ./node_modules/@prisma/client
```

**Se não aparecer:**
- Verifique os logs do build no Vercel
- O script `vercel-build` já inclui `prisma generate`

### 3. Verificar Status do Banco

Acesse: `https://dynamicsfecula.vercel.app/api/health`

**Se mostrar `"database": "error"`:**
- A connection string está incorreta
- Ou o banco não está acessível do Vercel

**Se mostrar `"database": "connected"`:**
- O banco está conectado
- O problema pode ser com o Prisma Client ou schema

### 4. Verificar Logs Completos

Nos logs do Vercel, procure pela mensagem completa do erro. Ela deve mostrar algo como:

```
Invalid `prisma.user.findUnique()` invocation:
Can't reach database server at...
```

Ou:

```
Invalid `prisma.user.findUnique()` invocation:
FATAL: Tenant or user not found
```

Isso vai indicar o problema específico.

## 🔍 Diagnóstico Passo a Passo

### Passo 1: Verificar Connection String

1. Compare `DATABASE_URL` no Vercel com `.env.local`
2. Devem ser **idênticas**
3. Ambas devem ter `?sslmode=require`

### Passo 2: Testar Conexão

1. Acesse `/api/health`
2. Veja se `database: "connected"`
3. Se não, a connection string está errada

### Passo 3: Verificar Build

1. Vercel Dashboard → **Deployments** → Build mais recente
2. Veja os **Build Logs**
3. Procure por `Prisma Client generated`
4. Se não aparecer, há problema no build

### Passo 4: Verificar Runtime Logs

1. Vercel Dashboard → **Deployments** → **Function Logs**
2. Tente fazer login
3. Veja a mensagem de erro **completa** (não truncada)
4. Isso vai mostrar o problema real

## 🎯 Solução Rápida

**Use a connection string direta que funciona localmente:**

1. Vercel Dashboard → **Settings** → **Environment Variables**
2. `DATABASE_URL` = `postgresql://postgres:86Dynamics@db.rxojryfxuskrqzmkyxlr.supabase.co:5432/postgres?sslmode=require`
3. **Redeploy**

## 📋 Checklist

- [ ] `DATABASE_URL` no Vercel é idêntica ao `.env.local`
- [ ] `DATABASE_URL` tem `?sslmode=require`
- [ ] Build mostra "Prisma Client generated"
- [ ] `/api/health` mostra `database: "connected"`
- [ ] Logs do Vercel mostram erro completo (não truncado)
- [ ] Redeploy feito após atualizar variável

---

**O erro truncado nos logs dificulta o diagnóstico. Verifique a mensagem completa nos Function Logs do Vercel!** 🔍

