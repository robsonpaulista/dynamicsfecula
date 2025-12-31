# 🗄️ Como Iniciar o Banco de Dados

O banco de dados não está rodando. Escolha uma das opções abaixo:

## 🐳 Opção 1: Docker (Recomendado)

### Instalar Docker Desktop

1. Baixe em: https://www.docker.com/products/docker-desktop
2. Instale e reinicie o computador
3. Abra o Docker Desktop

### Iniciar Banco

```bash
docker-compose up -d
```

### Verificar

```bash
docker ps
```

Deve mostrar o container `dynamicsadm_db` rodando.

---

## 💻 Opção 2: PostgreSQL Local

Se você já tem PostgreSQL instalado:

### 1. Criar Banco

```sql
CREATE DATABASE dynamicsadm;
CREATE USER dynamicsadm WITH PASSWORD 'dynamicsadm123';
GRANT ALL PRIVILEGES ON DATABASE dynamicsadm TO dynamicsadm;
```

### 2. Ajustar .env

Se usar credenciais diferentes, ajuste o `.env`:

```env
DATABASE_URL="postgresql://seu_usuario:sua_senha@localhost:5432/dynamicsadm?schema=public"
```

---

## ☁️ Opção 3: Banco na Nuvem (Mais Rápido para Teste)

### Supabase (Recomendado - Gratuito)

1. Acesse: https://supabase.com
2. Crie uma conta (gratuita)
3. Clique em "New Project"
4. Preencha:
   - Nome: `dynamicsadm-test`
   - Senha do banco: (anote essa senha!)
   - Região: escolha a mais próxima
5. Aguarde a criação (2-3 minutos)
6. Vá em **Settings** → **Database**
7. Copie a **Connection String** (URI)
8. Cole no `.env`:

```env
DATABASE_URL="postgresql://postgres.SUA_SENHA_AQUI@db.xxxxx.supabase.co:5432/postgres"
```

### Neon (Alternativa)

1. Acesse: https://neon.tech
2. Crie conta gratuita
3. Crie projeto
4. Copie a connection string
5. Cole no `.env`

---

## ✅ Após Escolher uma Opção

Depois que o banco estiver rodando:

```bash
# 1. Gerar Prisma Client (já feito)
npm run db:generate

# 2. Criar tabelas
npm run db:migrate
# Quando perguntar o nome: digite "init" e Enter

# 3. Popular banco
npm run db:seed

# 4. Iniciar aplicação
npm run dev
```

---

## 🧪 Teste Rápido

Para testar se o banco está funcionando:

```bash
npx prisma db pull
```

Se funcionar, você verá as tabelas sendo detectadas.

---

## 💡 Recomendação

Para desenvolvimento local: **Docker** (Opção 1)  
Para teste rápido: **Supabase** (Opção 3)

Qual opção você prefere usar?












