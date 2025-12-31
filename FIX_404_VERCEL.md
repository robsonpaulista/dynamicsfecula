# 🔧 Corrigir Erro 404 NOT_FOUND no Vercel

## Diagnóstico do Erro

O erro `404: NOT_FOUND` no Vercel geralmente ocorre quando:
1. O build falhou silenciosamente
2. As rotas não estão sendo reconhecidas
3. O Prisma Client não foi gerado
4. Problema com variáveis de ambiente

## ✅ Soluções

### 1. Verificar Logs de Build no Vercel

1. Acesse o dashboard do Vercel
2. Vá em **Deployments** → Selecione o deployment mais recente
3. Clique em **View Function Logs**
4. Procure por erros relacionados a:
   - `Prisma Client`
   - `Cannot find module`
   - `Build failed`

### 2. Verificar Variáveis de Ambiente

No painel do Vercel, vá em **Settings** → **Environment Variables** e verifique:

```env
# Obrigatórias
DATABASE_URL=postgresql://...
JWT_SECRET=seu-secret-forte
NODE_ENV=production

# Opcionais
JWT_EXPIRES_IN=24h
```

### 3. Verificar Build Command

O `vercel.json` está configurado corretamente:

```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

**Importante**: O `postinstall` no `package.json` também executa `prisma generate`:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### 4. Verificar se Prisma Client está sendo gerado

Adicione um script de verificação no `package.json`:

```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

**OU** atualize o `vercel.json`:

```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build"
}
```

⚠️ **ATENÇÃO**: `prisma migrate deploy` só deve ser executado **após o primeiro deploy** e quando o banco estiver configurado.

### 5. Verificar Estrutura de Rotas

Certifique-se de que as rotas estão na estrutura correta:

```
app/
├── api/
│   ├── auth/
│   │   ├── login/
│   │   │   └── route.js
│   │   └── me/
│   │       └── route.js
│   ├── products/
│   │   └── route.js
│   └── ...
├── dashboard/
│   └── page.jsx
├── login/
│   └── page.jsx
└── page.js
```

### 6. Verificar Output Directory

O Vercel detecta automaticamente Next.js, mas verifique em **Settings** → **General**:

- **Output Directory**: Deixe vazio (auto-detect)
- **Build Command**: `npm run build` ou deixe vazio
- **Install Command**: `npm install` ou deixe vazio

### 7. Testar Build Localmente

Antes de fazer deploy, teste localmente:

```bash
# 1. Instalar dependências
npm install

# 2. Gerar Prisma Client
npm run db:generate

# 3. Build
npm run build

# 4. Testar produção localmente
npm run start
```

Se o build local falhar, corrija os erros antes de fazer deploy.

### 8. Verificar Middleware

O `middleware.js` pode estar bloqueando rotas. Verifique se está permitindo as rotas corretas:

```javascript
// middleware.js
export function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Rotas públicas
  const publicRoutes = ['/login', '/api/auth/login']
  
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // ... resto do código
}
```

### 9. Verificar Imports

Certifique-se de que todos os imports estão corretos:

```javascript
// ✅ Correto
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/middleware/auth'

// ❌ Errado (caminhos relativos podem falhar no build)
import { prisma } from '../../lib/prisma'
```

### 10. Limpar Cache e Rebuild

No Vercel:

1. Vá em **Settings** → **General**
2. Role até **Build & Development Settings**
3. Clique em **Clear Build Cache**
4. Faça um novo deploy

## 🔍 Comandos de Debug

### Verificar se Prisma Client foi gerado:

```bash
ls -la node_modules/.prisma/client
```

### Verificar estrutura do projeto:

```bash
# Verificar se app/ existe
ls -la app/

# Verificar rotas da API
ls -la app/api/
```

### Testar rota específica:

```bash
# Após npm run start
curl http://localhost:3000/api/auth/login
```

## 🚨 Erros Comuns

### Erro: "Prisma Client not generated"

**Solução**: Adicione ao `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "vercel-build": "prisma generate && next build"
  }
}
```

### Erro: "Cannot find module '@/lib/prisma'"

**Solução**: Verifique o `tsconfig.json` ou `jsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Erro: "Database connection failed"

**Solução**: 
- Verifique se `DATABASE_URL` está configurada
- Verifique se o banco aceita conexões externas
- Adicione `?sslmode=require` na connection string

## 📋 Checklist de Verificação

- [ ] Build passa localmente (`npm run build`)
- [ ] Prisma Client foi gerado (`node_modules/.prisma/client` existe)
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] `DATABASE_URL` está correta
- [ ] `JWT_SECRET` está configurado
- [ ] Logs do Vercel não mostram erros
- [ ] Estrutura de pastas está correta
- [ ] Imports estão usando `@/` corretamente
- [ ] Middleware não está bloqueando rotas públicas

## 🎯 Próximos Passos

1. **Verifique os logs** no Vercel Dashboard
2. **Teste o build localmente** antes de fazer deploy
3. **Verifique as variáveis de ambiente**
4. **Execute migrations** após o primeiro deploy: `npx prisma migrate deploy`

## 📞 Se o problema persistir

1. Copie os logs completos do Vercel
2. Verifique se há erros no console do navegador
3. Teste acessando rotas específicas:
   - `https://seu-projeto.vercel.app/api/auth/login`
   - `https://seu-projeto.vercel.app/login`
   - `https://seu-projeto.vercel.app/dashboard`











