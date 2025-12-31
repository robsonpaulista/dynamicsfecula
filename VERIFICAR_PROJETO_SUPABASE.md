# 🔍 Verificar: Projeto Supabase Pausado ou Inativo

## ⚠️ Problema

A `DATABASE_URL` está configurada corretamente, mas o Vercel não consegue conectar. Isso geralmente significa que o **projeto Supabase está pausado**.

## ✅ Verificação Rápida

### 1. Verificar Status do Projeto no Supabase

1. Acesse: https://supabase.com/dashboard
2. Procure pelo projeto `rxojryfxuskrqzmkyxlr`
3. **Verifique o status:**
   - ✅ **Ativo** - Projeto está rodando (verde)
   - ⏸️ **Pausado** - Projeto foi pausado por inatividade (cinza/laranja)

### 2. Se Estiver Pausado

**Sintomas:**
- Projeto aparece como "Paused" ou "Inactive"
- Botão "Restore" ou "Resume" visível
- Mensagem sobre inatividade

**Solução:**
1. Clique em **"Restore"** ou **"Resume"**
2. Aguarde 1-2 minutos para o projeto reiniciar
3. Teste novamente: `https://dynamicsfecula.vercel.app/api/health`

**Nota:** Projetos gratuitos do Supabase são pausados automaticamente após **7 dias de inatividade**.

### 3. Testar Conexão Localmente Primeiro

Antes de verificar no Vercel, teste localmente:

```bash
# 1. Verificar se .env.local tem a DATABASE_URL
cat .env.local | grep DATABASE_URL

# 2. Testar conexão com Prisma
npx prisma db pull

# 3. Se funcionar, testar query simples
npx prisma studio
```

**Se funcionar localmente mas não no Vercel:**
- Projeto pode estar pausado
- Ou há diferença na connection string

### 4. Verificar Connection String no Vercel

1. Vercel Dashboard → **Settings** → **Environment Variables**
2. Verifique se `DATABASE_URL` está exatamente igual ao `.env.local`
3. **IMPORTANTE:** Verifique se tem `?sslmode=require` no final

**Formato esperado:**
```
postgresql://postgres:86Dynamics@db.rxojryfxuskrqzmkyxlr.supabase.co:5432/postgres?sslmode=require
```

### 5. Tentar Connection Pooler (Alternativa)

Se a conexão direta não funcionar, o **Connection Pooler** pode funcionar melhor no Vercel:

1. Supabase Dashboard → **Settings** → **Database**
2. Role até **Connection Pooler**
3. Copie a connection string (porta **6543**)
4. Formato: `postgresql://postgres.rxojryfxuskrqzmkyxlr:86Dynamics@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require`
5. Atualize no Vercel
6. Redeploy

**Por que usar Pooler?**
- Melhor para serverless (Vercel)
- Gerencia conexões automaticamente
- Mais estável para aplicações serverless

## 🔄 Passo a Passo Completo

### Opção 1: Restaurar Projeto Pausado

1. ✅ Acesse Supabase Dashboard
2. ✅ Verifique se projeto está pausado
3. ✅ Clique em **"Restore"**
4. ✅ Aguarde 1-2 minutos
5. ✅ Teste: `https://dynamicsfecula.vercel.app/api/health`

### Opção 2: Usar Connection Pooler

1. ✅ Supabase Dashboard → **Settings** → **Database**
2. ✅ Copie **Connection Pooler** → **URI**
3. ✅ Atualize `DATABASE_URL` no Vercel
4. ✅ Use porta **6543** (não 5432)
5. ✅ Adicione `?sslmode=require`
6. ✅ Redeploy

### Opção 3: Verificar e Corrigir Connection String

1. ✅ Compare `.env.local` com Vercel
2. ✅ Certifique-se que são idênticas
3. ✅ Verifique se tem `?sslmode=require`
4. ✅ Verifique se senha está correta
5. ✅ Redeploy após qualquer alteração

## 🧪 Teste Rápido

Execute localmente para confirmar que a connection string funciona:

```bash
# Testar conexão
npx prisma db pull

# Se funcionar, a connection string está correta
# O problema é que o projeto está pausado ou há diferença no Vercel
```

## 📋 Checklist de Diagnóstico

- [ ] Projeto Supabase está **ativo** (não pausado)
- [ ] Connection string local funciona (`npx prisma db pull`)
- [ ] Connection string no Vercel é **idêntica** ao `.env.local`
- [ ] Connection string tem `?sslmode=require`
- [ ] Tentou usar Connection Pooler (porta 6543)
- [ ] Fez redeploy após atualizar variável

## 💡 Dica: Manter Projeto Ativo

Para evitar que o projeto seja pausado:

1. **Use regularmente** - Acesse o dashboard pelo menos uma vez por semana
2. **Configure alertas** - Supabase pode enviar emails quando projeto está prestes a pausar
3. **Considere upgrade** - Planos pagos não pausam automaticamente

---

**A causa mais comum é projeto pausado. Verifique primeiro!** 🎯






