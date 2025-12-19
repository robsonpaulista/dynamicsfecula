# 🚀 Guia Rápido de Início

## Passo a Passo para Começar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
# Edite o .env com suas configurações
```

### 3. Iniciar Banco de Dados

```bash
docker-compose up -d
```

### 4. Configurar Banco de Dados

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 5. Iniciar Aplicação

```bash
npm run dev
```

### 6. Acessar

- **Aplicação**: http://localhost:3000
- **Prisma Studio**: `npm run db:studio`

### 7. Login Inicial

- **Email**: `admin@example.com`
- **Senha**: `senha123`

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar produção
npm start

# Banco de dados
npm run db:migrate      # Criar migration
npm run db:generate     # Gerar Prisma Client
npm run db:studio       # Abrir Prisma Studio
npm run db:seed         # Popular banco
```

## 🐛 Solução de Problemas

### Erro de conexão com banco
- Verifique se o Docker está rodando: `docker ps`
- Verifique se o PostgreSQL está ativo: `docker-compose ps`
- Verifique a DATABASE_URL no `.env`

### Erro de módulo não encontrado
- Execute `npm install` novamente
- Delete `node_modules` e reinstale

### Erro de autenticação
- Verifique se o JWT_SECRET está configurado
- Limpe o localStorage do navegador
- Faça logout e login novamente

## 💡 Dicas

- Use o Prisma Studio para visualizar os dados diretamente no banco
- Os logs de auditoria estão na tabela `audit_logs`
- O sistema atualiza o estoque automaticamente
- Contas a pagar/receber são criadas automaticamente
