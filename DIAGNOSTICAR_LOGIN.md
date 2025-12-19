# 🔍 Diagnóstico: Erro 500 no Login

## ⚠️ Problema

O login está retornando erro 500 mesmo com usuário existente no banco.

## 🔧 Melhorias Aplicadas

1. ✅ **Verificação de JWT_SECRET** - Agora verifica se está configurado antes de usar
2. ✅ **Logs detalhados** - Erros são logados no console para debug
3. ✅ **AuditLog opcional** - Não quebra o login se houver problema ao criar log
4. ✅ **Rota de diagnóstico** - Criada `/api/health` para verificar status do sistema

## 📋 Passos para Diagnosticar

### 1. Verificar Rota de Saúde

Acesse no navegador:
```
https://dynamicsfecula.vercel.app/api/health
```

Isso vai mostrar:
- ✅ Se o banco está conectado
- ✅ Se as variáveis de ambiente estão configuradas
- ✅ Se a tabela `users` existe
- ✅ Se há usuário admin cadastrado

### 2. Verificar Logs do Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Deployments** → Deployment mais recente
4. Clique em **View Function Logs**
5. Tente fazer login novamente
6. Veja os logs em tempo real

**Procure por:**
- `JWT_SECRET não está configurado`
- `Erro no login:` seguido de detalhes
- Erros de conexão com banco
- Erros do Prisma

### 3. Verificar Variáveis de Ambiente no Vercel

No Vercel Dashboard → **Settings** → **Environment Variables**, verifique:

**OBRIGATÓRIAS:**
- ✅ `DATABASE_URL` - Connection string do Supabase
- ✅ `JWT_SECRET` - Chave secreta para JWT (mínimo 32 caracteres)

**OPCIONAIS:**
- `JWT_EXPIRES_IN` - Tempo de expiração (padrão: 7d)
- `NODE_ENV` - Ambiente (production/development)

### 4. Verificar Usuário no Supabase

1. Acesse o Supabase Dashboard
2. Vá em **Table Editor** → `users`
3. Verifique se existe usuário com:
   - Email: `admin@example.com`
   - `is_active`: `true`
   - `role`: `ADMIN`
   - `password_hash`: deve estar preenchido (hash bcrypt)

### 5. Testar Conexão do Banco

Se a rota `/api/health` mostrar erro de conexão:

1. Verifique se a `DATABASE_URL` está correta
2. Verifique se o Supabase permite conexões externas
3. Verifique se o SSL está habilitado (`?sslmode=require`)

## 🐛 Possíveis Causas do Erro 500

### 1. JWT_SECRET não configurado
**Sintoma:** Erro imediato ao tentar fazer login
**Solução:** Configure `JWT_SECRET` no Vercel

### 2. Problema com Prisma Client
**Sintoma:** Erro ao buscar usuário
**Solução:** Verifique se `prisma generate` foi executado no build

### 3. Tabela audit_logs não existe
**Sintoma:** Login funciona mas retorna erro 500
**Solução:** Execute migrations: `npm run db:migrate:deploy`

### 4. Problema de conexão com banco
**Sintoma:** Timeout ou erro de conexão
**Solução:** Verifique `DATABASE_URL` e conectividade

### 5. Senha não está hasheada corretamente
**Sintoma:** Usuário existe mas senha não confere
**Solução:** Execute o seed novamente: `npm run db:seed`

## ✅ Solução Rápida

Se o problema for que o usuário existe mas a senha não funciona:

1. **Execute o seed novamente:**
   ```bash
   npx vercel env pull .env.local
   npm run db:seed
   ```

2. **OU via página web:**
   Acesse: `https://dynamicsfecula.vercel.app/api/seed`

Isso vai recriar o usuário admin com a senha correta.

## 📝 Checklist de Diagnóstico

- [ ] Acessar `/api/health` e verificar status
- [ ] Verificar logs do Vercel durante tentativa de login
- [ ] Verificar variáveis de ambiente no Vercel
- [ ] Verificar usuário no Supabase
- [ ] Testar conexão com banco
- [ ] Executar seed novamente se necessário

## 🚀 Próximos Passos

Após identificar o problema específico:

1. **Se for JWT_SECRET:** Configure no Vercel
2. **Se for banco:** Verifique `DATABASE_URL` e conectividade
3. **Se for usuário:** Execute seed novamente
4. **Se for migrations:** Execute `npm run db:migrate:deploy`

---

**Nota:** Os logs agora são mais detalhados. Verifique os Function Logs no Vercel para ver o erro específico.
