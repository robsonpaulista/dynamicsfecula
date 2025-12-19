# 🧪 Guia de Teste Local

## ✅ Checklist Antes de Testar

- [ ] Node.js 18+ instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado
- [ ] Banco de dados rodando (Docker ou na nuvem)
- [ ] Prisma Client gerado
- [ ] Migrations aplicadas
- [ ] Banco populado com dados de exemplo

## 🚀 Passo a Passo para Testar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://dynamicsadm:dynamicsadm123@localhost:5432/dynamicsadm?schema=public"
JWT_SECRET="test-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
NEXT_PUBLIC_API_URL="/api"
```

### 3. Iniciar Banco de Dados

#### Opção A: Docker (Recomendado)

```bash
# Iniciar PostgreSQL
docker-compose up -d

# Verificar se está rodando
docker ps
```

#### Opção B: PostgreSQL Local

Se você tem PostgreSQL instalado localmente, ajuste a `DATABASE_URL` no `.env`.

#### Opção C: Banco na Nuvem (Para Teste Rápido)

Use Supabase ou Neon para criar um banco rápido:

1. Crie conta em [supabase.com](https://supabase.com) (gratuito)
2. Crie um projeto
3. Copie a connection string
4. Cole no `.env` como `DATABASE_URL`

### 4. Gerar Prisma Client

```bash
npm run db:generate
```

### 5. Criar Tabelas (Migrations)

```bash
npm run db:migrate
```

Quando perguntar o nome da migration, use: `init`

### 6. Popular Banco com Dados de Exemplo

```bash
npm run db:seed
```

Isso criará:
- ✅ Usuário admin: `admin@example.com` / `senha123`
- ✅ Categorias
- ✅ Formas de pagamento
- ✅ Fornecedor exemplo
- ✅ Cliente exemplo
- ✅ Produtos exemplo

### 7. Iniciar Aplicação

```bash
npm run dev
```

A aplicação estará disponível em: **http://localhost:3000**

### 8. Testar Login

Acesse: http://localhost:3000/login

**Credenciais:**
- Email: `admin@example.com`
- Senha: `senha123`

## 🧪 Testes Básicos

### ✅ Teste 1: Login
1. Acesse `/login`
2. Faça login com as credenciais acima
3. Deve redirecionar para `/dashboard`

### ✅ Teste 2: Dashboard
1. Após login, veja o dashboard
2. Deve mostrar cards com:
   - Saldo de caixa
   - Contas a pagar/receber
   - Estoque baixo
   - Vendas/Compras do período

### ✅ Teste 3: Produtos
1. Acesse `/dashboard/products`
2. Deve listar produtos criados no seed
3. Clique em "Novo Produto"
4. Crie um produto de teste

### ✅ Teste 4: API
Teste diretamente a API:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"senha123"}'

# Listar produtos (precisa do token do login acima)
curl http://localhost:3000/api/products \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 🐛 Solução de Problemas

### Erro: "Prisma Client not generated"
```bash
npm run db:generate
```

### Erro: "Cannot connect to database"
- Verifique se o Docker está rodando: `docker ps`
- Verifique a `DATABASE_URL` no `.env`
- Teste conexão: `npx prisma db pull`

### Erro: "Migration not found"
```bash
npm run db:migrate
```

### Erro: "Port 3000 already in use"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou mude a porta no package.json
```

### Erro: "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📊 Verificar Banco de Dados

### Prisma Studio (Interface Visual)

```bash
npm run db:studio
```

Abre em: http://localhost:5555

### Verificar Tabelas

```bash
npx prisma db pull
```

## ✅ Checklist de Sucesso

- [ ] Aplicação inicia sem erros
- [ ] Login funciona
- [ ] Dashboard carrega dados
- [ ] Produtos listam corretamente
- [ ] API retorna dados
- [ ] Prisma Studio conecta ao banco

## 🎯 Próximos Passos

Após testar localmente:
1. Teste todas as funcionalidades
2. Crie mais dados de teste
3. Teste diferentes perfis de usuário
4. Quando estiver pronto, veja [DEPLOY.md](./DEPLOY.md) para produção

---

**Dica**: Use o Prisma Studio para visualizar os dados diretamente no banco!
