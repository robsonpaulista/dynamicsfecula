# 📁 Estrutura Visual do Projeto

## 🎯 Visão Geral

```
dynamicsadm/
│
├── 📱 app/                          # Next.js App Router
│   ├── api/                         # 🔥 Backend (API Routes)
│   │   ├── auth/
│   │   │   ├── login/route.js      # POST /api/auth/login
│   │   │   └── me/route.js         # GET /api/auth/me
│   │   ├── dashboard/route.js       # GET /api/dashboard
│   │   └── products/route.js        # GET/POST /api/products
│   │
│   ├── dashboard/                   # 🎨 Frontend (Páginas)
│   │   ├── layout.jsx              # Layout com sidebar
│   │   ├── page.jsx                # Dashboard principal
│   │   ├── products/
│   │   │   ├── page.jsx            # Lista de produtos
│   │   │   └── new/page.jsx        # Criar produto
│   │   ├── purchases/page.jsx       # Compras
│   │   ├── sales/page.jsx           # Vendas
│   │   ├── finance/page.jsx         # Financeiro
│   │   └── users/page.jsx           # Usuários
│   │
│   ├── login/
│   │   └── page.jsx                # Página de login
│   │
│   ├── layout.js                    # Layout raiz
│   ├── page.js                      # Página inicial (redirect)
│   └── globals.css                  # Estilos globais
│
├── 🧩 components/                   # Componentes React
│   └── ui/                          # Componentes UI (shadcn/ui)
│       ├── button.jsx
│       ├── card.jsx
│       ├── input.jsx
│       ├── label.jsx
│       ├── toast.jsx
│       └── toaster.jsx
│
├── 🛠️ lib/                          # Bibliotecas e Utilitários
│   ├── prisma.js                    # Cliente Prisma
│   ├── api.js                       # Cliente Axios configurado
│   ├── auth.js                      # Context de autenticação
│   └── utils.js                     # Funções utilitárias
│
├── 🔐 middleware/                    # Middlewares
│   └── auth.js                      # Autenticação/autorização
│
├── 📊 prisma/                       # Prisma ORM
│   ├── schema.prisma                # Schema do banco
│   └── migrations/                  # Migrations (geradas)
│
├── 📜 scripts/                      # Scripts Node.js
│   └── seed.js                      # Popular banco com dados
│
├── 🎨 utils/                        # Utilitários
│   └── errors.js                    # Classes de erro
│
├── 🎣 hooks/                        # React Hooks
│   └── use-toast.js                 # Hook para toasts
│
└── ⚙️ Configurações
    ├── package.json                 # Dependências e scripts
    ├── next.config.js               # Config Next.js
    ├── tailwind.config.js           # Config Tailwind
    ├── tsconfig.json                # Config TypeScript
    ├── vercel.json                  # Config Vercel
    └── docker-compose.yml           # Docker (PostgreSQL)
```

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────┐
│           FRONTEND (app/dashboard/)            │
│                                                 │
│  ┌──────────────┐    ┌──────────────┐         │
│  │   Login      │───▶│  Dashboard   │         │
│  │   page.jsx   │    │   page.jsx   │         │
│  └──────────────┘    └──────────────┘         │
│         │                    │                 │
│         │                    │                 │
│         ▼                    ▼                 │
│  ┌──────────────────────────────────┐         │
│  │      lib/api.js                  │         │
│  │      (Cliente Axios)              │         │
│  └──────────────────────────────────┘         │
└─────────────────┬───────────────────────────────┘
                   │
                   │ HTTP Request
                   │
┌──────────────────▼───────────────────────────────┐
│         BACKEND (app/api/)                      │
│                                                  │
│  ┌──────────────────────────────────┐          │
│  │   route.js                       │          │
│  │   (API Route Handler)           │          │
│  └──────────────────────────────────┘          │
│           │                                     │
│           │                                     │
│           ▼                                     │
│  ┌──────────────────────────────────┐          │
│  │   middleware/auth.js            │          │
│  │   (Autenticação)                │          │
│  └──────────────────────────────────┘          │
│           │                                     │
│           ▼                                     │
│  ┌──────────────────────────────────┐          │
│  │   lib/prisma.js                 │          │
│  │   (Cliente Prisma)              │          │
│  └──────────────────────────────────┘          │
└──────────────────┬───────────────────────────────┘
                   │
                   │ SQL Query
                   │
┌──────────────────▼───────────────────────────────┐
│         PostgreSQL Database                     │
│         (Docker/Supabase/Neon)                  │
└──────────────────────────────────────────────────┘
```

## 📋 Rotas da API

### Autenticação
- `POST /api/auth/login` - Login do usuário
- `GET /api/auth/me` - Dados do usuário logado

### Produtos
- `GET /api/products` - Listar produtos
- `POST /api/products` - Criar produto
- `GET /api/products/:id` - Detalhes do produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Deletar produto

### Dashboard
- `GET /api/dashboard` - Dados do dashboard

### (Outras rotas serão criadas conforme necessário)

## 🎨 Páginas do Frontend

### Públicas
- `/` - Redireciona para login ou dashboard
- `/login` - Página de login

### Protegidas (requerem autenticação)
- `/dashboard` - Dashboard principal
- `/dashboard/products` - Lista de produtos
- `/dashboard/products/new` - Criar produto
- `/dashboard/purchases` - Compras
- `/dashboard/sales` - Vendas
- `/dashboard/finance` - Financeiro
- `/dashboard/users` - Usuários

## 🔐 Autenticação

### Fluxo de Autenticação

```
1. Usuário acessa /login
   ↓
2. Preenche email/senha
   ↓
3. POST /api/auth/login
   ↓
4. Backend valida credenciais
   ↓
5. Retorna JWT token
   ↓
6. Token salvo no localStorage
   ↓
7. Redireciona para /dashboard
   ↓
8. Todas as requisições incluem token no header
   ↓
9. Middleware valida token em cada request
```

## 🎯 Componentes Principais

### UI Components (shadcn/ui)
- `Button` - Botões estilizados
- `Card` - Cards para conteúdo
- `Input` - Inputs de formulário
- `Label` - Labels para formulários
- `Toast` - Notificações

### Layout Components
- `DashboardLayout` - Layout com sidebar
- `AuthProvider` - Context de autenticação

## 📊 Banco de Dados (Prisma)

### Modelos Principais

- `User` - Usuários do sistema
- `Product` - Produtos
- `StockBalance` - Saldo de estoque
- `StockMovement` - Movimentações de estoque
- `Supplier` - Fornecedores
- `Customer` - Clientes
- `PurchaseOrder` - Pedidos de compra
- `SalesOrder` - Pedidos de venda
- `AccountsPayable` - Contas a pagar
- `AccountsReceivable` - Contas a receber
- `CashTransaction` - Transações de caixa
- `AuditLog` - Logs de auditoria

## 🚀 Como Funciona

1. **Frontend** faz requisição via `lib/api.js`
2. **API Route** (`app/api/*/route.js`) recebe a requisição
3. **Middleware** valida autenticação se necessário
4. **Prisma** executa query no banco
5. **Resposta** retorna para o frontend
6. **React** atualiza a UI

## 💡 Próximos Passos

1. ✅ Estrutura criada
2. ⏳ Configurar banco de dados
3. ⏳ Testar funcionalidades
4. ⏳ Adicionar mais rotas
5. ⏳ Deploy na Vercel

---

**Tudo está organizado e pronto!** 🎉













