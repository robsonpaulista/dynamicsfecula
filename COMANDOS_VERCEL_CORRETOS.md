# ✅ Comandos Corretos para Vercel e Prisma

## 🔗 Vincular Projeto ao Vercel

Se você ainda não vinculou o projeto local ao Vercel:

```bash
# 1. Fazer login no Vercel
npx vercel login

# 2. Vincular o projeto
npx vercel link
```

Quando executar `vercel link`, você será perguntado:
- **Set up and deploy?** → Escolha o projeto existente ou crie um novo
- **Which scope?** → Escolha sua conta/organização
- **Link to existing project?** → Sim (se já tiver um projeto no Vercel)

## 🚀 Executar Migrations no Banco de Produção

### Opção 1: Via Vercel CLI (Recomendado)

```bash
# 1. Baixar variáveis de ambiente do Vercel
npx vercel env pull .env.local

# 2. Executar migrations (comando correto!)
npm run db:migrate:deploy

# OU diretamente:
npx prisma migrate deploy
```

### Opção 2: Via Script do package.json

O `package.json` já tem o script configurado:

```bash
npm run db:migrate:deploy
```

## 📋 Comandos Prisma - Referência Rápida

### Desenvolvimento (Local)
```bash
# Criar e aplicar migration
npm run db:migrate
# OU
npx prisma migrate dev

# Gerar Prisma Client
npm run db:generate
# OU
npx prisma generate

# Abrir Prisma Studio (interface visual)
npm run db:studio
# OU
npx prisma studio
```

### Produção (Vercel)
```bash
# Aplicar migrations (NÃO cria novas, só aplica existentes)
npm run db:migrate:deploy
# OU
npx prisma migrate deploy

# Verificar status das migrations
npx prisma migrate status
```

## ⚠️ Erros Comuns e Soluções

### Erro: "Your codebase isn't linked to a project on Vercel"

**Solução:**
```bash
npx vercel link
```

### Erro: "Unknown command 'dep'"

**Causa:** Você digitou `prisma migrate dep` (comando incorreto)

**Solução:** Use o comando correto:
```bash
npx prisma migrate deploy
# OU
npm run db:migrate:deploy
```

### Erro: "Migration not found"

**Causa:** Não há migrations criadas ainda

**Solução:**
```bash
# 1. Criar migration localmente primeiro
npm run db:migrate

# 2. Commit e push para o repositório
git add prisma/migrations
git commit -m "Add migrations"
git push

# 3. Depois execute no Vercel
npm run db:migrate:deploy
```

## 🔄 Fluxo Completo de Deploy

### 1. Preparar Localmente

```bash
# 1. Criar migrations (se necessário)
npm run db:migrate

# 2. Testar build localmente
npm run build

# 3. Commit e push
git add .
git commit -m "Preparar para deploy"
git push
```

### 2. Deploy no Vercel

```bash
# Opção A: Deploy via CLI
npx vercel --prod

# Opção B: Deploy automático via GitHub (recomendado)
# Apenas faça push para a branch main/master
```

### 3. Executar Migrations Após Deploy

```bash
# 1. Baixar variáveis de ambiente
npx vercel env pull .env.local

# 2. Executar migrations
npm run db:migrate:deploy
```

## 📝 Checklist de Deploy

- [ ] Projeto vinculado ao Vercel (`vercel link`)
- [ ] Variáveis de ambiente configuradas no dashboard do Vercel
- [ ] Migrations criadas localmente (`npm run db:migrate`)
- [ ] Build passa localmente (`npm run build`)
- [ ] Código commitado e enviado para o repositório
- [ ] Deploy realizado no Vercel
- [ ] Migrations executadas em produção (`npm run db:migrate:deploy`)

## 💡 Dicas

1. **Sempre teste localmente primeiro** antes de fazer deploy
2. **Use `prisma migrate dev`** para desenvolvimento (cria e aplica migrations)
3. **Use `prisma migrate deploy`** para produção (só aplica migrations existentes)
4. **Nunca use `prisma migrate dev` em produção** - ele pode criar migrations inesperadas
5. **Mantenha as migrations no repositório** - elas devem ser versionadas

## 🆘 Ainda com Problemas?

1. Verifique os logs do build no Vercel Dashboard
2. Verifique se as variáveis de ambiente estão configuradas
3. Verifique se o banco de dados está acessível
4. Teste localmente com as mesmas variáveis de ambiente





