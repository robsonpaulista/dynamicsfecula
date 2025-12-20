# 🌱 Como Executar Seed no Ambiente Online (Vercel)

## ⚠️ Problema

Após fazer deploy na Vercel, o banco de dados está vazio. Você precisa:
1. ✅ Executar migrations (criar tabelas) - **JÁ AUTOMÁTICO**
2. ✅ Executar seed (criar usuário admin e dados iniciais) - **MANUAL**

## ✅ Solução: API Route de Seed

Criei uma API route protegida que permite executar o seed diretamente do navegador ou via curl.

### Opção 1: Via Navegador (Mais Fácil)

1. **Configure a variável de ambiente `SEED_TOKEN` no Vercel:**
   - Acesse: Vercel Dashboard → Seu Projeto → Settings → Environment Variables
   - Adicione: `SEED_TOKEN` = `seed-initial-setup-2024` (ou qualquer valor seguro)
   - Salve

2. **Acesse a URL do seed:**
   ```
   https://seu-projeto.vercel.app/api/seed
   ```
   
   Mas isso não funciona diretamente no navegador (precisa ser POST).

### Opção 2: Via cURL (Recomendado)

Após configurar `SEED_TOKEN` no Vercel:

```bash
curl -X POST https://seu-projeto.vercel.app/api/seed \
  -H "X-Seed-Token: seed-initial-setup-2024" \
  -H "Content-Type: application/json"
```

**Substitua:**
- `seu-projeto.vercel.app` pela URL do seu projeto
- `seed-initial-setup-2024` pelo valor que você configurou em `SEED_TOKEN`

### Opção 3: Via Vercel CLI (Mais Seguro)

```bash
# 1. Baixar variáveis de ambiente
npx vercel env pull .env.local

# 2. Executar seed localmente (mas conectado ao banco de produção)
npm run db:seed
```

Isso vai executar o seed no banco de produção usando as variáveis do Vercel.

## 🔒 Segurança

A API route de seed tem proteções:

1. **Token obrigatório**: Precisa do header `X-Seed-Token` com valor correto
2. **Verificação de duplicação**: Não executa se já existe usuário admin
3. **Apenas uma execução**: Depois de executado, retorna erro se tentar novamente

## 📋 Checklist Completo para Deploy

- [ ] Deploy feito na Vercel
- [ ] Variáveis de ambiente configuradas (DATABASE_URL, JWT_SECRET, etc.)
- [ ] Variável `SEED_TOKEN` configurada (opcional, mas recomendado)
- [ ] Migrations executadas automaticamente no build ✅
- [ ] Seed executado via API route ou CLI
- [ ] Login testado com `admin@example.com` / `senha123`

## 🎯 Resposta da API

### Sucesso (201):
```json
{
  "success": true,
  "message": "Seed executado com sucesso!",
  "data": {
    "admin": {
      "email": "admin@example.com",
      "name": "Administrador"
    },
    "categories": 2,
    "paymentMethods": 4,
    "products": 2
  }
}
```

### Erro - Já executado (400):
```json
{
  "success": false,
  "error": {
    "message": "Seed já foi executado. Usuário admin já existe.",
    "code": "ALREADY_SEEDED"
  }
}
```

### Erro - Token inválido (401):
```json
{
  "success": false,
  "error": {
    "message": "Token inválido. Use o header X-Seed-Token com o valor correto.",
    "code": "UNAUTHORIZED"
  }
}
```

## 💡 Dica: Testar Localmente

Antes de fazer deploy, teste a API route localmente:

```bash
# 1. Iniciar servidor
npm run dev

# 2. Em outro terminal, executar seed via API
curl -X POST http://localhost:3000/api/seed \
  -H "X-Seed-Token: seed-initial-setup-2024" \
  -H "Content-Type: application/json"
```

## 🚀 Próximos Passos

Após executar o seed:

1. ✅ Faça login com `admin@example.com` / `senha123`
2. ✅ Altere a senha do admin (Dashboard → Usuários)
3. ✅ Crie outros usuários conforme necessário
4. ✅ Comece a usar o sistema!

---

**Nota:** As migrations agora são executadas automaticamente no build do Vercel. Você só precisa executar o seed uma vez após o primeiro deploy.

