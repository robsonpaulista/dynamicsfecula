# 🔧 Usar Connection Pooler do Supabase (Recomendado para Vercel)

## ⚠️ Diferença: Supabase Client vs Prisma

### Supabase Client SDK (Outros Projetos)
Usa variáveis:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Prisma (Este Projeto)
Usa connection string PostgreSQL:
- `DATABASE_URL` (connection string completa)

**Por que diferente?**
- Prisma se conecta **diretamente** ao PostgreSQL
- Não usa o SDK do Supabase
- Precisa da connection string PostgreSQL pura

## ✅ Solução: Connection Pooler

Para **serverless** (Vercel), use o **Connection Pooler** em vez da conexão direta:

### 1. Obter Connection Pooler do Supabase

A interface do Supabase mudou. Você tem **2 opções**:

#### Opção A: Na Seção "Connection string" (Mais Fácil)

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Database**
4. Role até **"Connection string"** (não "Connection pooling configuration")
5. **Marque a opção "Use connection pooling"** (checkbox)
6. Selecione a aba **URI**
7. Copie a connection string que aparece

#### Opção B: Construir Manualmente (Se não encontrar)

Se não encontrar a opção, construa manualmente:

**Você precisa de:**
- Project Reference ID: `rxojryfxuskrqzmkyxlr` (do seu Project URL)
- Senha do banco: `86Dynamics`
- Região: `sa-east-1` (South America - São Paulo)

**Formato do Pooler:**
```
postgresql://postgres.rxojryfxuskrqzmkyxlr:86Dynamics@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

**Como construir:**
1. Usuário: `postgres.[PROJECT_REF]` → `postgres.rxojryfxuskrqzmkyxlr`
2. Senha: `86Dynamics`
3. Host: `aws-0-[REGION].pooler.supabase.com` → `aws-0-sa-east-1.pooler.supabase.com`
4. Porta: `6543`
5. Database: `postgres`
6. SSL: `?sslmode=require`

**Diferenças do Pooler:**
- Porta: **6543** (não 5432)
- Host: `aws-0-sa-east-1.pooler.supabase.com` (não `db.xxx.supabase.co`)
- Usuário: `postgres.rxojryfxuskrqzmkyxlr` (com prefixo do projeto)

### 2. Atualizar no Vercel

1. Vercel Dashboard → **Settings** → **Environment Variables**
2. Encontre `DATABASE_URL`
3. Substitua pela connection string do **Pooler**
4. **IMPORTANTE:** Adicione `?sslmode=require` no final
5. Marque para **Production**, **Preview** e **Development**
6. Salve

### 3. Atualizar Localmente (Opcional)

Se quiser testar localmente com o pooler:

```bash
# Editar .env.local
DATABASE_URL="postgresql://postgres.rxojryfxuskrqzmkyxlr:86Dynamics@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
```

### 4. Testar

```bash
# Testar conexão
npx prisma db pull

# Se funcionar, está correto!
```

### 5. Redeploy no Vercel

Após atualizar a variável:
1. Vercel Dashboard → **Deployments**
2. Clique nos **3 pontos** do deployment mais recente
3. Selecione **Redeploy**

## 🎯 Por Que Connection Pooler?

**Vantagens para Serverless (Vercel):**
- ✅ Gerencia conexões automaticamente
- ✅ Melhor para funções serverless (cold starts)
- ✅ Mais estável em produção
- ✅ Evita problemas de limite de conexões

**Desvantagens:**
- ⚠️ Algumas queries podem ter limitações (transações longas)
- ⚠️ Porta diferente (6543 vs 5432)

## 📋 Formato Completo

### Connection String Direta (Atual - Pode não funcionar no Vercel)
```
postgresql://postgres:86Dynamics@db.rxojryfxuskrqzmkyxlr.supabase.co:5432/postgres?sslmode=require
```

### Connection Pooler (Recomendado para Vercel)
```
postgresql://postgres.rxojryfxuskrqzmkyxlr:86Dynamics@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

## 🔍 Onde Encontrar no Supabase

1. **Settings** → **Database**
2. Role até **Connection Pooler** (não "Connection string")
3. Selecione aba **URI**
4. Copie a string completa
5. Substitua `[YOUR-PASSWORD]` pela senha real

## ✅ Checklist

- [ ] Acessou Supabase Dashboard → Settings → Database
- [ ] Copiou Connection Pooler (porta 6543)
- [ ] Adicionou `?sslmode=require` no final
- [ ] Atualizou `DATABASE_URL` no Vercel
- [ ] Marcou para todos os ambientes (Production, Preview, Development)
- [ ] Fez redeploy
- [ ] Testou via `/api/health`

---

**O Connection Pooler é a solução recomendada para Vercel!** 🚀



