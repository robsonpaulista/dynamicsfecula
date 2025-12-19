# 🔧 Construir Connection Pooler Manualmente

## ⚠️ Problema

A interface do Supabase não mostra diretamente a connection string do pooler. Vamos construir manualmente!

## ✅ Solução: Construir Manualmente

### Informações que Você Precisa

1. **Project Reference ID**: `rxojryfxuskrqzmkyxlr`
   - Está no Project URL: `https://rxojryfxuskrqzmkyxlr.supabase.co`

2. **Senha do Banco**: `86Dynamics`
   - Você já tem essa senha

3. **Região**: `sa-east-1` (South America - São Paulo)
   - Pode estar no Project URL ou nas configurações

## 📝 Connection String do Pooler

Use esta connection string completa:

```
postgresql://postgres.rxojryfxuskrqzmkyxlr:86Dynamics@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

## 🔍 Como Funciona

### Estrutura da Connection String:

```
postgresql://[USUARIO]:[SENHA]@[HOST]:[PORTA]/[DATABASE]?[PARAMETROS]
```

### Partes da String:

1. **Protocolo**: `postgresql://`
2. **Usuário**: `postgres.rxojryfxuskrqzmkyxlr`
   - Formato: `postgres.[PROJECT_REF]`
3. **Senha**: `86Dynamics`
4. **Host**: `aws-0-sa-east-1.pooler.supabase.com`
   - Formato: `aws-0-[REGION].pooler.supabase.com`
5. **Porta**: `6543` (pooler) vs `5432` (direto)
6. **Database**: `postgres`
7. **Parâmetros**: `?sslmode=require`

## 🎯 Passo a Passo

### 1. Copiar a Connection String

Cole esta string completa no Vercel:

```
postgresql://postgres.rxojryfxuskrqzmkyxlr:86Dynamics@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

### 2. Atualizar no Vercel

1. Vercel Dashboard → **Settings** → **Environment Variables**
2. Encontre `DATABASE_URL`
3. Clique em **Edit**
4. Cole a string completa acima
5. Marque para **Production**, **Preview** e **Development**
6. Salve

### 3. Testar Localmente (Opcional)

Se quiser testar antes:

```bash
# Editar .env.local
DATABASE_URL="postgresql://postgres.rxojryfxuskrqzmkyxlr:86Dynamics@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require"

# Testar
npx prisma db pull
```

### 4. Redeploy

Após atualizar no Vercel:
1. Vercel Dashboard → **Deployments**
2. Clique nos **3 pontos** → **Redeploy**

## 🔄 Se a Região for Diferente

Se sua região não for `sa-east-1`, substitua na connection string:

**Regiões comuns:**
- `us-east-1` - US East (N. Virginia)
- `us-west-1` - US West (N. California)
- `eu-west-1` - EU West (Ireland)
- `ap-southeast-1` - Asia Pacific (Singapore)
- `sa-east-1` - South America (São Paulo) ← Seu caso

**Como descobrir a região:**
1. Supabase Dashboard → **Settings** → **General**
2. Veja a região do projeto
3. Ou veja no Project URL (às vezes aparece)

## ✅ Verificar se Funcionou

Após o redeploy, acesse:
```
https://dynamicsfecula.vercel.app/api/health
```

Deve mostrar:
```json
{
  "status": "ok",
  "checks": {
    "database": "connected"
  }
}
```

## 📋 Checklist

- [ ] Copiou a connection string completa do pooler
- [ ] Atualizou `DATABASE_URL` no Vercel
- [ ] Marcou para todos os ambientes
- [ ] Fez redeploy
- [ ] Testou via `/api/health`

---

**Esta connection string deve funcionar no Vercel!** 🚀
