# 🚀 Aplicar Migration Diretamente no Banco de Produção

## ⚡ Solução Rápida (Sem Vercel CLI)

Como o projeto não está vinculado ao Vercel localmente, você pode aplicar a migration diretamente usando a connection string de produção.

## 📋 Passos

### 1. Obter Connection String de Produção

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto `dynamicsfecula`
3. Vá em **Settings** → **Environment Variables**
4. Encontre `DATABASE_URL` e copie o valor completo

**Deve ser algo como:**
```
postgresql://postgres.rxojryfxuskrqzmkyxlr:86Dynamics@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

### 2. Aplicar Migration com Connection String de Produção

No PowerShell, execute:

```powershell
# Definir a connection string de produção (substitua pela sua)
$env:DATABASE_URL="postgresql://postgres.rxojryfxuskrqzmkyxlr:86Dynamics@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require"

# Aplicar migration
npx prisma migrate deploy
```

### 3. Verificar Status

```powershell
npx prisma migrate status
```

Deve mostrar: "Database schema is up to date!"

## ⚠️ Importante

- Use a connection string de **produção** do Vercel (porta 6543 - Connection Pooler)
- Não use a connection string local (porta 5432)
- A migration vai alterar a estrutura do banco de produção

## 🔄 Alternativa: Vincular Projeto ao Vercel

Se preferir vincular o projeto:

```powershell
npx vercel link --yes
```

Depois:

```powershell
npx vercel env pull .env.local
npx prisma migrate deploy
```
