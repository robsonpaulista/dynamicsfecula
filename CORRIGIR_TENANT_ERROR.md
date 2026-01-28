# 🔧 Corrigir: "Tenant or user not found"

## ⚠️ Problema

Erro: `FATAL: Tenant or user not found`

Isso significa que:
- ✅ A conexão está chegando ao servidor (não é mais problema de rede)
- ❌ O hostname ou formato do pooler está incorreto

## ✅ Solução: Usar Connection String Direta

Como a connection string direta **funciona localmente**, vamos usá-la no Vercel também:

### Connection String Direta (Funciona Localmente)

```
postgresql://postgres:86Dynamics@db.rxojryfxuskrqzmkyxlr.supabase.co:5432/postgres?sslmode=require
```

### Atualizar no Vercel

1. Vercel Dashboard → **Settings** → **Environment Variables**
2. Encontre `DATABASE_URL`
3. Clique em **Edit**
4. Cole esta string:
   ```
   postgresql://postgres:86Dynamics@db.rxojryfxuskrqzmkyxlr.supabase.co:5432/postgres?sslmode=require
   ```
5. Marque para **Production**, **Preview** e **Development**
6. Salve

### Redeploy

1. Vercel Dashboard → **Deployments**
2. Clique nos **3 pontos** → **Redeploy**

## 🔍 Por Que Funcionou Localmente Mas Não no Vercel?

**Possíveis causas:**
1. **Firewall/IP Whitelist** - Supabase pode estar bloqueando IPs do Vercel
2. **Hostname do Pooler incorreto** - O hostname `aws-0-sa-east-1` pode estar errado
3. **Região diferente** - A região pode não ser `sa-east-1`

## 🎯 Alternativa: Verificar Hostname Correto do Pooler

Se quiser usar o pooler, você precisa do hostname correto:

1. Supabase Dashboard → **Settings** → **Database**
2. Role até **"Connection string"**
3. **Marque "Use connection pooling"**
4. Veja o hostname que aparece (pode ser diferente de `aws-0-sa-east-1`)
5. Use esse hostname na connection string

**Formato esperado:**
```
postgresql://postgres.rxojryfxuskrqzmkyxlr:86Dynamics@[HOSTNAME_CORRETO]:6543/postgres?sslmode=require
```

## ✅ Solução Recomendada

**Use a connection string direta** (porta 5432) que já funciona localmente:

```
postgresql://postgres:86Dynamics@db.rxojryfxuskrqzmkyxlr.supabase.co:5432/postgres?sslmode=require
```

Esta deve funcionar no Vercel também, já que funciona localmente.

## 🧪 Testar

Após atualizar e fazer redeploy:

1. Acesse: `https://dynamicsfecula.vercel.app/api/health`
2. Deve mostrar: `"database": "connected"`

---

**Use a connection string direta que já funciona!** 🚀










