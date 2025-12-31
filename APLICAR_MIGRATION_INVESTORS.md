# 🚨 Aplicar Migration de Investidores no Banco de Produção

## ⚠️ Problema

A migration `20251219230034_add_investors` ainda não foi aplicada no banco de produção, causando:
- `PrismaClientInitializationError` - O Prisma Client espera estrutura diferente do banco
- Erros 500 no login e outras operações

## ✅ Solução: Aplicar Migration

### Passo 1: Baixar Variáveis de Ambiente do Vercel

```bash
# No terminal, na pasta do projeto
npx vercel env pull .env.local
```

Isso vai baixar as variáveis de ambiente do Vercel (incluindo `DATABASE_URL`).

### Passo 2: Aplicar Migration

```bash
# Aplicar todas as migrations pendentes
npx prisma migrate deploy

# OU usando o script do package.json:
npm run db:migrate:deploy
```

### Passo 3: Verificar Status

```bash
# Verificar quais migrations foram aplicadas
npx prisma migrate status
```

## ⚠️ Importante: Dados Existentes

Se houver dados na tabela `payment_sources` com a coluna `name`, eles serão **perdidos** ao aplicar esta migration, pois a coluna será removida.

**Se você tem dados importantes:**
1. Faça backup antes de aplicar
2. Ou crie uma migration customizada que migre os dados primeiro

## 🔄 Após Aplicar

Após aplicar a migration:
1. O banco terá a nova estrutura (tabela `investors` e `payment_sources` com `investor_id`)
2. O Prisma Client poderá se conectar normalmente
3. O login e outras operações voltarão a funcionar





