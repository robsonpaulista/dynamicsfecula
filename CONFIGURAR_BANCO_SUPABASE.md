# 🚀 Configurar Banco no Supabase (5 minutos)

## Passo a Passo Detalhado

### 1️⃣ Criar Conta no Supabase

1. Acesse: **https://supabase.com**
2. Clique em **"Start your project"** ou **"Sign Up"**
3. Faça login com GitHub, Google ou email
4. Confirme seu email se necessário

### 2️⃣ Criar Novo Projeto

1. No dashboard do Supabase, clique em **"New Project"**
2. Preencha os dados:
   - **Name**: `dynamicsadm` (ou qualquer nome)
   - **Database Password**: **ANOTE ESSA SENHA!** (você vai precisar)
   - **Region**: Escolha a mais próxima (ex: South America - São Paulo)
   - **Pricing Plan**: Free (gratuito)
3. Clique em **"Create new project"**
4. Aguarde 2-3 minutos enquanto o projeto é criado

### 3️⃣ Obter Connection String

1. No projeto criado, vá em **Settings** (ícone de engrenagem no canto inferior esquerdo)
2. Clique em **Database**
3. Role até encontrar **Connection string**
4. Selecione a aba **URI**
5. Copie a string que aparece (algo como):
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   ```

### 4️⃣ Configurar no Projeto

1. Abra o arquivo `.env` na raiz do projeto
2. Substitua a linha `DATABASE_URL` pela string que você copiou
3. **IMPORTANTE**: Substitua `[YOUR-PASSWORD]` pela senha que você criou no passo 2

Exemplo:
```env
DATABASE_URL="postgresql://postgres.xxxxx:SUA_SENHA_AQUI@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
JWT_SECRET="dev-secret-key-change-in-production-12345"
JWT_EXPIRES_IN="7d"
NEXT_PUBLIC_API_URL="/api"
```

### 5️⃣ Testar Conexão

```bash
npx prisma db pull
```

Se funcionar, você verá as tabelas sendo detectadas (mesmo que vazias).

### 6️⃣ Criar Tabelas (Migrations)

```bash
npm run db:migrate
```

Quando perguntar o nome da migration, digite: `init` e pressione Enter

### 7️⃣ Popular Banco com Dados

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

### 8️⃣ Testar Login

1. Acesse: **http://localhost:3000/login**
2. Use as credenciais:
   - Email: `admin@example.com`
   - Senha: `senha123`

## ✅ Pronto!

Agora você pode:
- ✅ Fazer login
- ✅ Ver o dashboard
- ✅ Criar produtos
- ✅ Testar todas as funcionalidades

## 🐛 Problemas Comuns

### Erro: "Connection timeout"
- Verifique se copiou a connection string correta
- Verifique se substituiu `[YOUR-PASSWORD]` pela senha real

### Erro: "Invalid password"
- Verifique se a senha está correta no `.env`
- A senha pode ter caracteres especiais - certifique-se de que está entre aspas

### Erro: "Database does not exist"
- Use a connection string da aba **URI** (não **Connection pooling**)
- Certifique-se de que o projeto foi criado completamente

## 💡 Dica

Você pode visualizar o banco diretamente no Supabase:
- Vá em **Table Editor** no menu lateral
- Veja todas as tabelas e dados

---

**Tempo estimado: 5-10 minutos**







