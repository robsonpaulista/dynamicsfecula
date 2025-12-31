# 🚀 Como Executar Migrations no Vercel - Passo a Passo

## ⚠️ Problema Atual

O deploy foi feito, mas ao tentar fazer login ocorre erro porque:
1. **As tabelas do banco ainda não foram criadas** (migrations não executadas)
2. **Não há usuário cadastrado** (seed não executado)

## ✅ Solução: Executar Migrations e Seed

### Passo 1: Criar Migration Localmente (Primeira Vez)

Se você ainda não criou a migration inicial:

```bash
# No terminal local, na pasta do projeto
cd "c:\Users\robso\OneDrive\Documentos\Coorporativo\dynamicsadm"

# Criar a migration inicial baseada no schema.prisma
npm run db:migrate

# Isso vai:
# 1. Criar a pasta prisma/migrations/
# 2. Gerar os arquivos SQL da migration
# 3. Aplicar no banco local (se tiver configurado)
```

**⚠️ IMPORTANTE**: Depois de criar a migration, faça commit e push:

```bash
git add prisma/migrations
git commit -m "Adiciona migration inicial do banco de dados"
git push
```

### Passo 2: Executar Migration no Banco de Produção (Vercel)

Você tem **3 opções** para executar as migrations:

#### Opção 1: Via Vercel CLI (Recomendado) ⭐

```bash
# 1. Instalar Vercel CLI (se ainda não tiver)
npm install -g vercel

# 2. Fazer login no Vercel
npx vercel login

# 3. Vincular o projeto (se ainda não vinculou)
npx vercel link

# 4. Baixar variáveis de ambiente do Vercel
npx vercel env pull .env.local

# 5. Executar migrations no banco de produção
npx prisma migrate deploy

# OU usando o script do package.json:
npm run db:migrate:deploy
```

#### Opção 2: Via Terminal do Vercel (Se Disponível)

1. Acesse o Vercel Dashboard
2. Vá em **Settings** → **General**
3. Role até encontrar **Shell** ou **Terminal** (se disponível)
4. Execute:
   ```bash
   npx prisma migrate deploy
   ```

#### Opção 3: Via Script de Deploy Automático

Criar um script que executa automaticamente após o deploy (mais avançado).

### Passo 3: Executar Seed (Criar Usuário Admin)

Após executar as migrations, você precisa criar o usuário admin:

```bash
# Com as variáveis de ambiente do Vercel já baixadas (.env.local)
npm run db:seed
```

Isso vai criar:
- ✅ Usuário admin: `admin@example.com` / senha: `senha123`
- ✅ Categorias
- ✅ Formas de pagamento
- ✅ Dados de exemplo (fornecedor, cliente, produtos)

### Passo 4: Testar Login

1. Acesse a URL do seu app no Vercel
2. Faça login com:
   - **Email**: `admin@example.com`
   - **Senha**: `senha123`

## 📋 Checklist Completo

- [ ] Migration criada localmente (`npm run db:migrate`)
- [ ] Migration commitada e enviada para o GitHub
- [ ] Vercel CLI instalado e logado (`npx vercel login`)
- [ ] Projeto vinculado ao Vercel (`npx vercel link`)
- [ ] Variáveis de ambiente baixadas (`npx vercel env pull .env.local`)
- [ ] Migration executada em produção (`npx prisma migrate deploy`)
- [ ] Seed executado (`npm run db:seed`)
- [ ] Login testado com sucesso

## 🔍 Verificar se Funcionou

### Verificar Status das Migrations

```bash
npx prisma migrate status
```

Deve mostrar algo como:
```
✅ Database schema is up to date!
```

### Verificar Tabelas Criadas

Você pode usar o Prisma Studio para visualizar:

```bash
npx prisma studio
```

Isso abre uma interface web em `http://localhost:5555` onde você pode ver todas as tabelas e dados.

## 🐛 Troubleshooting

### Erro: "Migration not found"

**Causa**: A migration não foi criada ou não está no repositório.

**Solução**:
```bash
# 1. Criar migration localmente
npm run db:migrate

# 2. Commit e push
git add prisma/migrations
git commit -m "Add migrations"
git push

# 3. Executar no Vercel
npx prisma migrate deploy
```

### Erro: "Your codebase isn't linked to a project on Vercel"

**Solução**:
```bash
npx vercel link
```

### Erro: "DATABASE_URL is not defined"

**Solução**: 
1. Verifique se baixou as variáveis: `npx vercel env pull .env.local`
2. Ou configure manualmente no arquivo `.env.local`:
   ```env
   DATABASE_URL=sua-connection-string-do-vercel
   ```

### Erro: "Connection timeout" ou "Can't reach database server"

**Solução**:
1. Verifique se a `DATABASE_URL` está correta no Vercel Dashboard
2. Verifique se o banco aceita conexões externas
3. Verifique se o SSL está habilitado (`?sslmode=require`)

## 💡 Dicas Importantes

1. **Sempre teste localmente primeiro** antes de executar em produção
2. **Use `prisma migrate dev`** apenas em desenvolvimento (cria migrations)
3. **Use `prisma migrate deploy`** em produção (só aplica migrations existentes)
4. **Nunca use `prisma migrate dev` em produção** - pode criar migrations inesperadas
5. **Mantenha as migrations versionadas** - sempre commit no Git

## 🎯 Comandos Rápidos (Resumo)

```bash
# 1. Criar migration (local, primeira vez)
npm run db:migrate

# 2. Commit e push
git add prisma/migrations && git commit -m "Add migrations" && git push

# 3. Baixar env do Vercel
npx vercel env pull .env.local

# 4. Executar migration em produção
npm run db:migrate:deploy

# 5. Executar seed
npm run db:seed

# 6. Verificar status
npx prisma migrate status
```

## ✅ Próximos Passos Após Migrations

Depois que as migrations estiverem executadas e o seed rodado:

1. ✅ Teste o login com `admin@example.com` / `senha123`
2. ✅ Altere a senha do admin após o primeiro login
3. ✅ Crie outros usuários conforme necessário
4. ✅ Configure outras variáveis de ambiente se necessário

---

**🎉 Pronto!** Após seguir esses passos, seu app estará funcionando no Vercel!





