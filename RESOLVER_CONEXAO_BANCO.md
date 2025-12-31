# 🔧 Resolver: Erro de Conexão com Banco Supabase

## ⚠️ Problema

O Vercel não consegue se conectar ao banco de dados do Supabase:
```
Can't reach database server at `db.rxojryfxuskrqzmkyxlr.supabase.co:5432`
```

## 🔍 Possíveis Causas

1. **Banco pausado** - Supabase pausa projetos inativos (plano gratuito)
2. **DATABASE_URL incorreta** - Connection string mal formatada
3. **SSL não habilitado** - Falta `?sslmode=require`
4. **IP não autorizado** - Supabase bloqueando conexões do Vercel
5. **Projeto inativo** - Projeto pode ter sido pausado por inatividade

## ✅ Soluções

### 1. Verificar se o Projeto Supabase Está Ativo

1. Acesse: https://supabase.com/dashboard
2. Verifique se o projeto está **ativo** (não pausado)
3. Se estiver pausado, clique em **"Restore"** ou **"Resume"**

**Nota:** Projetos gratuitos do Supabase são pausados após 7 dias de inatividade.

### 2. Verificar e Atualizar DATABASE_URL no Vercel

#### Passo 1: Obter Connection String Correta do Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Database**
4. Role até **Connection string**
5. Selecione **URI** (não "Session mode")
6. Copie a connection string completa

**Formato correto:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.rxojryfxuskrqzmkyxlr.supabase.co:5432/postgres?sslmode=require
```

**⚠️ IMPORTANTE:**
- Substitua `[YOUR-PASSWORD]` pela senha real do banco
- **DEVE** incluir `?sslmode=require` no final
- Use a porta **5432** (não 6543)

#### Passo 2: Atualizar no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Encontre `DATABASE_URL`
5. Clique em **Edit**
6. Cole a connection string completa
7. **IMPORTANTE:** Selecione **Production**, **Preview** e **Development**
8. Clique em **Save**

#### Passo 3: Fazer Novo Deploy

Após atualizar a variável:

1. Vá em **Deployments**
2. Clique nos **3 pontos** do deployment mais recente
3. Selecione **Redeploy**
4. OU faça um novo commit para trigger automático

### 3. Verificar Configurações de Rede do Supabase

1. No Supabase Dashboard → **Settings** → **Database**
2. Verifique **Connection pooling**
3. Para Vercel, use a connection string **direta** (não pooler)
4. Verifique se **SSL** está habilitado

### 4. Testar Connection String Localmente

Antes de atualizar no Vercel, teste localmente:

```bash
# 1. Criar arquivo .env.local com a nova DATABASE_URL
echo 'DATABASE_URL="postgresql://postgres:SUA_SENHA@db.rxojryfxuskrqzmkyxlr.supabase.co:5432/postgres?sslmode=require"' > .env.local

# 2. Testar conexão
npx prisma db pull
```

Se funcionar localmente, a connection string está correta.

### 5. Usar Connection Pooler (Alternativa)

Se a conexão direta não funcionar, tente usar o **Connection Pooler** do Supabase:

1. No Supabase Dashboard → **Settings** → **Database**
2. Copie a connection string do **Connection Pooler**
3. Use a porta **6543** (não 5432)
4. Formato: `postgresql://postgres:[PASSWORD]@db.rxojryfxuskrqzmkyxlr.supabase.co:6543/postgres?sslmode=require`

**Nota:** O pooler é melhor para serverless (Vercel), mas pode ter limitações.

## 🔄 Passo a Passo Completo

### Opção A: Connection String Direta (Recomendado)

1. **Supabase Dashboard** → **Settings** → **Database**
2. Copie **Connection string** → **URI**
3. Formato: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require`
4. **Vercel Dashboard** → **Settings** → **Environment Variables**
5. Atualize `DATABASE_URL` com a string completa
6. **Redeploy** o projeto

### Opção B: Connection Pooler (Se A não funcionar)

1. **Supabase Dashboard** → **Settings** → **Database**
2. Copie **Connection Pooler** → **URI**
3. Formato: `postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?sslmode=require`
4. **Vercel Dashboard** → Atualize `DATABASE_URL`
5. **Redeploy**

## 🧪 Verificar se Funcionou

Após o redeploy:

1. Acesse: `https://dynamicsfecula.vercel.app/api/health`
2. Deve mostrar:
   ```json
   {
     "status": "ok",
     "checks": {
       "database": "connected",
       "users": {
         "tableExists": true,
         "count": 1
       }
     }
   }
   ```

## ⚠️ Erros Comuns

### Erro: "Connection timeout"
**Solução:** Verifique se o projeto Supabase está ativo (não pausado)

### Erro: "SSL required"
**Solução:** Adicione `?sslmode=require` no final da DATABASE_URL

### Erro: "Authentication failed"
**Solução:** Verifique se a senha na connection string está correta

### Erro: "Host not found"
**Solução:** Verifique se o host está correto (sem espaços extras)

## 📝 Checklist

- [ ] Projeto Supabase está ativo (não pausado)
- [ ] DATABASE_URL inclui `?sslmode=require`
- [ ] DATABASE_URL usa porta 5432 (ou 6543 para pooler)
- [ ] Senha está correta na connection string
- [ ] Variável atualizada no Vercel para todos os ambientes
- [ ] Redeploy feito após atualizar variável
- [ ] Testado via `/api/health`

## 💡 Dica: Gerar Nova Senha

Se não souber a senha do banco:

1. Supabase Dashboard → **Settings** → **Database**
2. Role até **Database password**
3. Clique em **Reset database password**
4. Copie a nova senha
5. Atualize a `DATABASE_URL` no Vercel

---

**Após seguir esses passos, a conexão deve funcionar!** 🎉





