# Checklist de Deploy - Vercel

## 🔒 Segurança

### ✅ Implementado

1. **Autenticação JWT**
   - ✅ Tokens com expiração configurável
   - ✅ Verificação em todas as rotas protegidas
   - ✅ Middleware de autenticação centralizado

2. **Autorização por Roles**
   - ✅ ADMIN, FINANCEIRO, COMPRAS, VENDAS, ESTOQUE
   - ✅ Verificação de permissões em rotas sensíveis

3. **Validação de Dados**
   - ✅ Zod em todas as rotas
   - ✅ Validação de tipos e formatos
   - ✅ Sanitização de inputs

4. **Proteção de Senhas**
   - ✅ Bcrypt com 10 rounds
   - ✅ Senhas nunca retornadas nas respostas

5. **Rate Limiting**
   - ✅ Login: 5 tentativas/minuto
   - ⚠️ Considerar Redis para múltiplas instâncias

6. **Headers de Segurança**
   - ✅ X-Content-Type-Options
   - ✅ X-Frame-Options
   - ✅ X-XSS-Protection
   - ✅ Content-Security-Policy
   - ✅ Referrer-Policy

7. **Proteção de Rotas Frontend**
   - ✅ Verificação no dashboard layout
   - ✅ Redirecionamento automático para login
   - ✅ Interceptor de API para 401

8. **Tratamento de Erros**
   - ✅ Classes de erro customizadas
   - ✅ Não exposição de detalhes em produção
   - ✅ Logs de auditoria

### ⚠️ Ações Necessárias

#### 1. Variáveis de Ambiente no Vercel

Configure no painel do Vercel:

```env
# Obrigatórias
DATABASE_URL=postgresql://user:password@host:5432/db?sslmode=require
JWT_SECRET=seu-secret-forte-aleatorio-minimo-32-caracteres
NODE_ENV=production

# Opcionais (com valores padrão)
JWT_EXPIRES_IN=24h
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
```

**⚠️ IMPORTANTE:**
- `JWT_SECRET` deve ser uma string aleatória forte (use: `openssl rand -base64 32`)
- Nunca commite o `.env` no repositório
- Use diferentes secrets para dev/staging/prod

#### 2. Database

- [ ] Configurar PostgreSQL no Vercel (ou Supabase/Neon)
- [ ] Executar migrations: `npx prisma migrate deploy`
- [ ] Verificar conexão SSL habilitada
- [ ] Configurar backup automático

#### 3. Build e Deploy

```bash
# 1. Instalar dependências
npm install

# 2. Gerar Prisma Client
npm run db:generate

# 3. Build (Vercel faz automaticamente, mas teste localmente)
npm run build

# 4. Verificar se build passou sem erros
```

#### 4. Pós-Deploy

- [ ] Testar login
- [ ] Verificar todas as rotas protegidas
- [ ] Testar rate limiting
- [ ] Verificar headers de segurança
- [ ] Monitorar logs de erro

## 📋 Rotas da API

### Públicas (sem autenticação)
- `POST /api/auth/login` - Login

### Protegidas (requer autenticação)
- `GET /api/auth/me` - Dados do usuário logado
- `GET /api/dashboard` - Dados do dashboard
- `GET /api/products` - Listar produtos
- `POST /api/products` - Criar produto (ADMIN, ESTOQUE, COMPRAS)
- `GET /api/products/[id]` - Detalhes do produto
- `PUT /api/products/[id]` - Atualizar produto (ADMIN, ESTOQUE, COMPRAS)
- `GET /api/customers` - Listar clientes
- `POST /api/customers` - Criar cliente (ADMIN, VENDAS)
- `GET /api/customers/[id]` - Detalhes do cliente
- `PUT /api/customers/[id]` - Atualizar cliente (ADMIN, VENDAS)
- `DELETE /api/customers/[id]` - Desativar cliente (ADMIN, VENDAS)
- `GET /api/suppliers` - Listar fornecedores
- `POST /api/suppliers` - Criar fornecedor (ADMIN, COMPRAS)
- `GET /api/suppliers/[id]` - Detalhes do fornecedor
- `PUT /api/suppliers/[id]` - Atualizar fornecedor (ADMIN, COMPRAS)
- `DELETE /api/suppliers/[id]` - Desativar fornecedor (ADMIN, COMPRAS)
- `GET /api/users` - Listar usuários (ADMIN)
- `POST /api/users` - Criar usuário (ADMIN)
- `GET /api/purchases` - Listar compras
- `POST /api/purchases` - Criar compra (ADMIN, COMPRAS)
- `GET /api/purchases/[id]` - Detalhes da compra
- `PUT /api/purchases/[id]` - Atualizar compra (ADMIN, COMPRAS)
- `GET /api/sales` - Listar vendas
- `POST /api/sales` - Criar venda (ADMIN, VENDAS)
- `GET /api/sales/[id]` - Detalhes da venda
- `PUT /api/sales/[id]` - Atualizar venda (ADMIN, VENDAS)
- `POST /api/sales/[id]/deliver` - Confirmar entrega (ADMIN, VENDAS)
- `GET /api/finance/ap` - Contas a pagar
- `GET /api/finance/ar` - Contas a receber
- `POST /api/finance/ap/[id]/pay` - Baixar conta a pagar
- `POST /api/finance/ar/[id]/receive` - Baixar conta a receber

## 🚀 Comandos Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (primeira vez)
vercel

# Deploy em produção
vercel --prod

# Ver logs
vercel logs

# Ver variáveis de ambiente
vercel env ls
```

## 📝 Notas Importantes

1. **Prisma no Vercel**: O Vercel executa `postinstall` automaticamente, que inclui `prisma generate`
2. **Migrations**: Execute `prisma migrate deploy` manualmente após o primeiro deploy
3. **Build**: O Vercel detecta automaticamente Next.js e executa o build
4. **Edge Functions**: Não estamos usando, mas pode ser útil para rate limiting no futuro

## 🔍 Verificações Finais

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Database conectado e migrations executadas
- [ ] Build passa sem erros
- [ ] Login funciona
- [ ] Rotas protegidas retornam 401 sem token
- [ ] Rate limiting funciona
- [ ] Headers de segurança presentes
- [ ] Logs de erro configurados










