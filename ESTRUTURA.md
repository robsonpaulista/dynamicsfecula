# 📁 Estrutura do Projeto Unificado

## ✅ Tudo em Um Só Lugar!

Este projeto usa **Next.js 14 com App Router**, onde o frontend e backend estão juntos. Não há separação confusa!

## 📂 Estrutura de Pastas

```
dynamicsadm/
├── app/                      # Next.js App Router
│   ├── api/                  # 🔥 API Routes (Backend aqui!)
│   │   ├── auth/
│   │   │   ├── login/route.js
│   │   │   └── me/route.js
│   │   ├── products/route.js
│   │   ├── dashboard/route.js
│   │   └── ...
│   ├── dashboard/            # Páginas do dashboard
│   │   ├── page.jsx
│   │   ├── layout.jsx
│   │   ├── products/
│   │   ├── purchases/
│   │   └── ...
│   ├── login/
│   │   └── page.jsx
│   ├── layout.js            # Layout raiz
│   ├── page.js              # Página inicial
│   └── globals.css          # Estilos globais
│
├── components/               # Componentes React reutilizáveis
│   └── ui/                   # Componentes UI (shadcn/ui)
│
├── lib/                      # Bibliotecas e utilitários
│   ├── prisma.js            # Cliente Prisma
│   ├── api.js               # Cliente Axios configurado
│   ├── auth.js              # Context de autenticação
│   └── utils.js             # Funções utilitárias
│
├── middleware/              # Middlewares
│   └── auth.js              # Autenticação/autorização
│
├── prisma/                   # Prisma ORM
│   ├── schema.prisma        # Schema do banco
│   └── migrations/          # Migrations (geradas)
│
├── scripts/                  # Scripts Node.js
│   └── seed.js              # Popular banco com dados
│
├── utils/                    # Utilitários
│   └── errors.js            # Classes de erro customizadas
│
├── .env                      # Variáveis de ambiente
├── .env.example             # Exemplo de .env
├── package.json             # Dependências
├── next.config.js           # Config Next.js
├── tailwind.config.js       # Config Tailwind
├── tsconfig.json            # Config TypeScript
└── docker-compose.yml       # Docker (PostgreSQL)
```

## 🔥 Como Funciona

### API Routes (Backend no Next.js)

As rotas da API ficam em `app/api/`:

```javascript
// app/api/products/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  const products = await prisma.product.findMany()
  return NextResponse.json({ data: products })
}

export async function POST(request) {
  const body = await request.json()
  // ... criar produto
  return NextResponse.json({ data: product })
}
```

### Frontend

As páginas ficam em `app/`:

```javascript
// app/dashboard/page.jsx
'use client'
import api from '@/lib/api'

export default function Dashboard() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    api.get('/dashboard').then(res => setData(res.data))
  }, [])
  
  return <div>...</div>
}
```

## ✅ Vantagens

1. **Sem CORS**: Frontend e backend no mesmo domínio
2. **Sem Proxy**: Não precisa configurar proxy reverso
3. **TypeScript Compartilhado**: Tipos compartilhados entre frontend e backend
4. **Deploy Simples**: Um único deploy na Vercel
5. **Desenvolvimento Rápido**: Mudanças instantâneas

## 🚀 Comandos

```bash
npm run dev          # Inicia tudo (frontend + API)
npm run build        # Build de produção
npm run db:migrate   # Migrations do Prisma
npm run db:studio    # Visualizar banco
```

## 💡 Dicas

- Todas as rotas da API começam com `/api`
- Use `@/` para imports absolutos
- O Prisma Client é gerado automaticamente
- As migrations ficam em `prisma/migrations/`












