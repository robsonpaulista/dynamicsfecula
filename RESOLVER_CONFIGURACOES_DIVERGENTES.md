# 🔧 Resolver: Configurações Divergentes no Vercel

## 🚨 Problema

Quando você seleciona Next.js no dashboard, aparece:
> "Configuration Settings in the current Production deployment differ from your current Project Settings"

Isso significa que o Vercel está usando configurações antigas do deployment em vez das configurações do projeto.

## ✅ SOLUÇÃO

### Opção 1: Fazer Novo Deploy Limpo (Recomendado)

1. **Configure no Dashboard:**
   - Settings → General → Build & Development Settings
   - **Root Directory**: Deixe vazio
   - **Framework Preset**: `Next.js`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: Deixe vazio
   - **Install Command**: `npm install`
   - Clique em **Save**

2. **Limpar Cache:**
   - Na mesma página, **Clear Build Cache**

3. **Fazer Novo Deploy:**
   - Vá em **Deployments**
   - Clique nos três pontos (...) do deployment mais recente
   - Selecione **Redeploy**
   - **OU** faça um novo commit e push (o Vercel fará deploy automático)

### Opção 2: Ignorar o Aviso e Forçar

Se a mensagem aparecer mas você quiser continuar:

1. **Configure no Dashboard** (mesmo com o aviso)
2. **Clique em Save** (mesmo com o aviso)
3. **Faça um novo deploy** - o próximo deployment usará as novas configurações

### Opção 3: Usar vercel.json (Já Configurado)

O `vercel.json` já está configurado com:
```json
{
  "buildCommand": "npm run vercel-build",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

Isso força o Vercel a usar essas configurações, ignorando as antigas.

## 📋 Passo a Passo Completo

1. **No Dashboard do Vercel:**
   - Settings → General
   - **Root Directory**: Deixe vazio (CRÍTICO!)
   - **Framework Preset**: `Next.js`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: Vazio
   - **Install Command**: `npm install`
   - **Save**

2. **Limpar Cache:**
   - Build Cache → Clear Build Cache

3. **Fazer Novo Deploy:**
   - Deployments → (...) → Redeploy
   - **OU** faça commit e push de qualquer mudança

## ⚠️ Importante

- O `vercel.json` no repositório **sobrescreve** as configurações antigas
- Um novo deploy sempre usa as configurações do projeto, não as do deployment antigo
- A mensagem de aviso é apenas informativa - o próximo deploy usará as novas configurações

## 🔍 Verificar

Após fazer um novo deploy, os logs devem mostrar:
```
Running "npm run vercel-build"
✓ Compiled successfully
```

Se ainda aparecer `vercel build`, o `vercel.json` não está sendo respeitado e você precisa verificar se está na raiz do projeto.

---

**A solução é fazer um novo deploy após configurar no dashboard!**



