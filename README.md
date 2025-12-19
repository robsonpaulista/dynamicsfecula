# DynamicsADM - Sistema de Gestão Empresarial

Sistema completo de gestão empresarial desenvolvido com **Next.js 14** (App Router) e **Prisma**. Tudo em um único projeto - sem separação de frontend e backend! 🚀

## ⚡ Prisma é 100% Gratuito!

**SIM, o Prisma é totalmente gratuito e open-source!** Não precisa de conta, não precisa pagar nada. O Prisma Client roda localmente no seu projeto **e também na Vercel** durante o build/runtime.

**Para produção**: Você só precisa de um **PostgreSQL na nuvem** (gratuito!):
- ✅ Vercel Postgres (integrado)
- ✅ Supabase (500MB grátis)
- ✅ Neon (serverless gratuito)
- ✅ Railway ($5 grátis/mês)

Veja o guia completo de deploy: **[DEPLOY.md](./DEPLOY.md)**

## 🚀 Funcionalidades

### Módulos Principais

- **Compras**: Cadastro de fornecedores, pedidos/entradas, custos, atualização de estoque
- **Estoque**: Saldo por produto, movimentações, estoque mínimo com alertas
- **Vendas**: Pedidos/saídas, dedução automática do estoque, emissão de contas a receber
- **Financeiro**: 
  - Contas a pagar (compras, despesas)
  - Contas a receber (vendas)
  - Fluxo de caixa automático
- **Auditoria**: Trilha de eventos (quem fez o quê, quando)
- **RBAC**: Perfis de usuário (Admin, Financeiro, Compras, Vendas, Estoque)

## 🛠️ Stack Tecnológica

- **Next.js 14** (App Router) - Frontend + API Routes (tudo junto!)
- **React 18** + **TypeScript**
- **Prisma** + **PostgreSQL** (100% gratuito!)
- **Tailwind CSS** + **shadcn/ui**
- **JWT** para autenticação
- **Zod** para validação

## 📋 Pré-requisitos

- Node.js 18+
- Docker e Docker Compose (para desenvolvimento local)
- npm ou yarn

## 🔧 Instalação Local

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd dynamicsadm
```

### 2. Configure o ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
DATABASE_URL="postgresql://dynamicsadm:dynamicsadm123@localhost:5432/dynamicsadm?schema=public"
JWT_SECRET="seu-secret-jwt-aqui"
JWT_EXPIRES_IN="7d"
NEXT_PUBLIC_API_URL="/api"
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Inicie o banco de dados local

```bash
docker-compose up -d
```

### 5. Configure o banco de dados

```bash
# Gerar Prisma Client
npm run db:generate

# Criar tabelas
npm run db:migrate

# Popular com dados de exemplo
npm run db:seed
```

### 6. Inicie a aplicação

```bash
npm run dev
```

### 7. Acesse

- **Aplicação**: http://localhost:3000
- **Prisma Studio**: `npm run db:studio`

### 8. Login Inicial

- **Email**: `admin@example.com`
- **Senha**: `senha123`

## 🚀 Deploy na Vercel

### Opção Rápida: Vercel Postgres

1. Crie projeto na Vercel
2. Adicione **Vercel Postgres** (Storage → Create Database)
3. Configure variáveis de ambiente:
   - `DATABASE_URL` (gerada automaticamente)
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN=7d`
   - `NEXT_PUBLIC_API_URL=/api`
4. Faça deploy: `vercel` ou conecte GitHub
5. Rode migrations: `npx prisma migrate deploy`

### Opção Recomendada: Supabase

1. Crie conta em [supabase.com](https://supabase.com) (gratuito)
2. Crie um projeto
3. Copie a connection string
4. Configure na Vercel como variável de ambiente
5. Deploy e migrations

**Guia completo**: Veja **[DEPLOY.md](./DEPLOY.md)**

## 📁 Estrutura do Projeto

```
dynamicsadm/
├── app/
│   ├── api/              # API Routes (Backend aqui!)
│   ├── dashboard/        # Páginas do dashboard
│   ├── login/           # Página de login
│   └── layout.js        # Layout principal
├── components/          # Componentes React
├── lib/                 # Utilitários (prisma, api, auth)
├── prisma/
│   └── schema.prisma   # Schema do banco
├── scripts/
│   └── seed.js         # Script de seed
└── package.json
```

## 🔄 Fluxos Principais

### Compra → Entrada → AP → Caixa

1. Criar Pedido de Compra
2. Ao Receber: atualiza estoque e cria conta a pagar
3. Ao Pagar: registra no fluxo de caixa

### Venda → Saída → AR → Caixa

1. Criar Pedido de Venda
2. Ao Confirmar: baixa estoque e cria conta a receber
3. Ao Receber: registra no fluxo de caixa

## 🎨 Design e UX

- Interface 100% responsiva (mobile/desktop/tablet)
- Design moderno com Tailwind CSS
- Componentes acessíveis com Radix UI
- Animações com Framer Motion

## 🔒 Segurança

- Autenticação JWT
- RBAC (Role-Based Access Control)
- Validação com Zod
- Logs de auditoria

## 📊 API Endpoints

Todas as rotas estão em `app/api/`:

- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário
- `GET /api/products` - Listar produtos
- `POST /api/products` - Criar produto
- `GET /api/dashboard` - Dados do dashboard
- E mais...

## 🧪 Scripts Disponíveis

```bash
npm run dev          # Modo desenvolvimento
npm run build        # Build de produção
npm run start        # Iniciar produção
npm run db:migrate   # Executar migrations (dev)
npm run db:migrate:deploy  # Migrations (produção)
npm run db:generate  # Gerar Prisma Client
npm run db:studio    # Abrir Prisma Studio
npm run db:seed      # Popular banco com dados exemplo
```

## 💡 Vantagens da Estrutura Unificada

✅ **Simplicidade**: Tudo em um único projeto  
✅ **Menos configuração**: Sem CORS, sem proxy  
✅ **Deploy fácil**: Um único deploy na Vercel  
✅ **Desenvolvimento rápido**: Mudanças instantâneas  
✅ **TypeScript**: Tipagem compartilhada  

## 📝 Próximos Passos

- [ ] Implementar mais rotas da API
- [ ] Adicionar testes
- [ ] Melhorar relatórios
- [ ] Exportação de dados

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

---

**Desenvolvido com ❤️ usando Next.js e Prisma (100% gratuito!)**

**Deploy**: Veja **[DEPLOY.md](./DEPLOY.md)** para guia completo de deploy na Vercel.
