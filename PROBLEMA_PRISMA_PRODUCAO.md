# ⚠️ Problema Crítico: Prisma em Produção

## 🔴 Erros Atuais

Os logs mostram erros 500 em múltiplas APIs:
- `/api/investors` - `Invalid prisma.investor.findMany() invocation`
- `/api/finance/ar` - `Invalid prisma.accountsReceivable.count() invocation`
- `/api/finance/ap` - `Invalid prisma.accountsPayable.count() invocation`

## 🎯 Causa Raiz

**A migração do banco de dados NÃO foi aplicada no Supabase de produção.**

O código no Vercel espera:
- Tabela `investors` (não existe no banco)
- Coluna `investor_id` em `payment_sources` (não existe)
- Coluna `name` removida de `payment_sources` (ainda existe)

## ✅ Solução URGENTE

### Opção 1: Aplicar Migração Manualmente (Recomendado)

1. **Acesse o Supabase Dashboard:**
   - Vá em **SQL Editor**
   - Crie uma nova query

2. **Execute o SQL da migração:**
   - Abra o arquivo: `prisma/migrations/20251219230034_add_investors/migration.sql
   - Copie e cole o SQL completo
   - Execute

3. **Ou use o Prisma diretamente:**
   ```bash
   # No terminal local, com a DATABASE_URL de produção
   $env:DATABASE_URL="postgresql://postgres:[SENHA]@db.rxojryfxuskrqzmkyxlr.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
   npx prisma migrate deploy
   ```

### Opção 2: Verificar Connection String no Vercel

1. **Vercel Dashboard** → **Settings** → **Environment Variables**
2. Verifique se `DATABASE_URL` está usando:
   - **Porta 6543** (Connection Pooler) ✅
   - **`pgbouncer=true`** ✅
   - **`connection_limit=1`** ✅

Exemplo correto:
```
postgresql://postgres:[SENHA]@db.rxojryfxuskrqzmkyxlr.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1
```

### Opção 3: Verificar se o Projeto Supabase Está Ativo

Projetos gratuitos pausam após 7 dias de inatividade:
1. Acesse **Supabase Dashboard**
2. Verifique se o projeto está **Active**
3. Se estiver pausado, clique em **Resume**

## 🔍 Como Diagnosticar

### 1. Verificar Status do Banco
```bash
curl https://dynamicsfecula.vercel.app/api/health
```

Se retornar `"database": "error"`, o problema é de conexão.

### 2. Verificar Logs do Vercel
- Vercel Dashboard → **Deployments** → **Functions** → **Logs**
- Procure por mensagens de erro do Prisma
- Erros começando com `P1001`, `P2002`, etc. indicam problemas específicos

### 3. Testar Conexão Local com Produção
```bash
# No PowerShell
$env:DATABASE_URL="[SUA_CONNECTION_STRING_PRODUCAO]"
npx prisma db pull
```

Se falhar, o problema é a connection string ou firewall.

## 📝 Melhorias Implementadas

1. **Tratamento de Erros Melhorado:**
   - Logs detalhados em desenvolvimento
   - Mensagens específicas para erros de conexão
   - Códigos de erro mais informativos

2. **Verificação de Conexão:**
   - Função `checkPrismaConnection()` em `lib/prisma.js`
   - Pode ser usada para health checks

3. **Logs Mais Informativos:**
   - Todos os erros do Prisma agora são logados com `console.error`
   - Stack traces em desenvolvimento

## 🚨 Próximos Passos

1. **Aplicar a migração no banco de produção** (URGENTE)
2. Verificar se a connection string está correta no Vercel
3. Testar as APIs após aplicar a migração
4. Monitorar os logs do Vercel para novos erros

## 💡 Alternativa Futura

Se os problemas persistirem, considere:
- Usar **Supabase Client SDK** em vez de Prisma
- Ou usar **Prisma Data Proxy** para melhor gerenciamento de conexões

Mas primeiro, **aplique a migração** - esse é o problema principal agora.
