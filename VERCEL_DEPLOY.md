# 🚀 Guia de Deploy no Vercel

## Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Repositório no GitHub conectado
3. Banco de dados PostgreSQL (Vercel Postgres, Supabase, Neon, etc.)

## Passo a Passo

### 1. Preparar o Repositório

```bash
# Verificar se está tudo commitado
git status

# Adicionar todos os arquivos (exceto os ignorados pelo .gitignore)
git add .

# Commit inicial
git commit -m "Initial commit - Sistema DynamicsADM"

# Conectar ao repositório remoto (se ainda não conectado)
git remote add origin https://github.com/robsonpaulista/dynamicsadm.git

# Push para o GitHub
git push -u origin main
```

### 2. Criar Projeto no Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New Project"**
3. Importe o repositório `robsonpaulista/dynamicsadm`
4. O Vercel detectará automaticamente que é um projeto Next.js

### 3. Configurar Banco de Dados

#### Opção A: Vercel Postgres (Recomendado - Integrado)

1. No projeto Vercel, vá em **Storage** → **Create Database**
2. Selecione **Postgres**
3. Escolha um nome para o banco
4. O Vercel criará automaticamente a variável `POSTGRES_PRISMA_URL` e `POSTGRES_URL_NON_POOLING`

#### Opção B: Supabase (Gratuito - 500MB)

1. Crie conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **Settings** → **Database**
4. Copie a **Connection String** (URI mode)

### 4. Configurar Variáveis de Ambiente

No painel do Vercel, vá em **Settings** → **Environment Variables** e adicione:

#### Obrigatórias:

```env
# Database (se usar Vercel Postgres, já vem configurado)
DATABASE_URL=postgresql://user:password@host:5432/db?sslmode=require

# JWT (GERE UM NOVO SECRET FORTE!)
JWT_SECRET=seu-secret-aleatorio-forte-minimo-32-caracteres
NODE_ENV=production
```

#### Opcionais (com valores padrão):

```env
JWT_EXPIRES_IN=24h
NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app
```

**⚠️ IMPORTANTE - Gerar JWT_SECRET:**

```bash
# No terminal (Linux/Mac)
openssl rand -base64 32

# Ou use um gerador online seguro
# https://generate-secret.vercel.app/32
```

### 5. Configurar Build Settings

O Vercel detecta automaticamente Next.js, mas verifique:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (ou deixe vazio para auto-detect)
- **Output Directory**: `.next` (auto-detect)
- **Install Command**: `npm install` (auto-detect)

### 6. Fazer Deploy

1. Clique em **Deploy**
2. Aguarde o build completar
3. Se houver erros, verifique os logs

### 7. Executar Migrations

Após o primeiro deploy, execute as migrations:

```bash
# Opção 1: Via Vercel CLI
npx vercel env pull .env.local
npx prisma migrate deploy

# Opção 2: Via terminal do Vercel (se disponível)
# Ou adicione um script de post-deploy
```

**Alternativa**: Adicione ao `package.json`:

```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

### 8. Popular Banco de Dados (Opcional)

Se quiser dados de exemplo:

```bash
# Via Vercel CLI
npx vercel env pull .env.local
npm run db:seed
```

## 🔧 Configurações Adicionais

### Atualizar vercel.json (se necessário)

```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["gru1"]
}
```

### Configurar Domínio Customizado (Opcional)

1. No projeto Vercel, vá em **Settings** → **Domains**
2. Adicione seu domínio
3. Configure DNS conforme instruções

## ✅ Verificações Pós-Deploy

- [ ] Aplicação carrega sem erros
- [ ] Login funciona
- [ ] Rotas protegidas retornam 401 sem token
- [ ] Database conectado
- [ ] Migrations executadas
- [ ] Headers de segurança presentes
- [ ] Rate limiting funciona

## 🐛 Troubleshooting

### Erro: "Prisma Client not generated"

**Solução**: Adicione ao `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Erro: "Database connection failed"

**Solução**: 
- Verifique se `DATABASE_URL` está configurada
- Verifique se o banco aceita conexões externas
- Verifique se SSL está habilitado (`?sslmode=require`)

### Erro: "JWT_SECRET not found"

**Solução**: 
- Configure `JWT_SECRET` nas variáveis de ambiente
- Use um secret forte (mínimo 32 caracteres)

### Build falha

**Solução**:
- Verifique os logs de build no Vercel
- Teste build localmente: `npm run build`
- Verifique se todas as dependências estão no `package.json`

## 📊 Monitoramento

Após o deploy, monitore:

1. **Logs**: Vercel Dashboard → Deployments → Logs
2. **Analytics**: Vercel Dashboard → Analytics
3. **Errors**: Vercel Dashboard → Functions → Errors

## 🔄 Atualizações Futuras

Para atualizar a aplicação:

```bash
# Fazer alterações no código
git add .
git commit -m "Descrição das mudanças"
git push origin main

# O Vercel fará deploy automático!
```

## 📝 Notas Importantes

1. **Prisma no Vercel**: O script `postinstall` executa `prisma generate` automaticamente
2. **Migrations**: Execute `prisma migrate deploy` após o primeiro deploy
3. **Variáveis de Ambiente**: Nunca commite `.env` no repositório
4. **Build Time**: Primeiro build pode demorar mais (gera Prisma Client)

## 🎉 Pronto!

Sua aplicação estará disponível em: `https://seu-projeto.vercel.app`

Para mais detalhes de segurança, veja: **[DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)**











