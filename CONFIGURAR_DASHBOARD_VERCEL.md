# ⚙️ Configurar Build no Dashboard do Vercel

## 🎯 Problema

O Vercel está ignorando o `buildCommand` no `vercel.json` e executando `vercel build` em vez de `npm run build`.

## ✅ Solução: Configurar no Dashboard

Como removemos o `vercel.json`, você precisa configurar no dashboard do Vercel:

### Passo a Passo:

1. **Acesse o Dashboard do Vercel**
   - Vá em: https://vercel.com/dashboard
   - Selecione o projeto `dynamicsadm`

2. **Vá em Settings**
   - Clique em **Settings** no menu lateral
   - Clique em **General**

3. **Configure Build & Development Settings**
   - Role até a seção **Build & Development Settings**
   - Configure os seguintes campos:

   **Framework Preset:**
   - Selecione: `Next.js`

   **Build Command:**
   - Digite: `npm run build`
   - OU deixe vazio (o Vercel usará automaticamente o script `vercel-build` do `package.json`)

   **Output Directory:**
   - Deixe vazio (auto-detect)

   **Install Command:**
   - Digite: `npm install`
   - OU deixe vazio

4. **Salve as Configurações**
   - Clique em **Save**

5. **Limpar Cache**
   - Na mesma página, role até **Build Cache**
   - Clique em **Clear Build Cache**

6. **Fazer Novo Deploy**
   - Vá em **Deployments**
   - Clique nos três pontos (...) do deployment mais recente
   - Selecione **Redeploy**
   - OU faça um novo commit e push

## 📋 O Que Esperar

Após configurar, nos logs do build você deve ver:

```
Running "npm run build"
```

OU

```
Running "vercel-build"
```

E os logs devem mostrar:

```
✓ Compiled successfully
✓ Generating static pages  
✓ Build completed
```

## ⚠️ Importante

O `package.json` já tem o script `vercel-build` configurado:

```json
{
  "scripts": {
    "vercel-build": "prisma generate && next build"
  }
}
```

O Vercel **automaticamente** usa esse script se ele existir, então você pode deixar o **Build Command** vazio no dashboard.

## 🔍 Verificações Adicionais

### Variáveis de Ambiente

Certifique-se de ter configurado em **Settings** → **Environment Variables**:

```env
DATABASE_URL=postgresql://user:password@host:5432/db?sslmode=require
JWT_SECRET=seu-secret-forte-minimo-32-caracteres
NODE_ENV=production
```

### Testar Após Deploy

Após o deploy, teste:

- `https://dynamicsadm.vercel.app/` (rota raiz)
- `https://dynamicsadm.vercel.app/login`
- `https://dynamicsadm.vercel.app/api/auth/login`

## 💡 Por Que Remover o vercel.json?

O `vercel.json` estava sendo ignorado pelo Vercel. Configurando diretamente no dashboard, temos mais controle e o Vercel respeita as configurações.

---

**Após configurar no dashboard, faça um novo deploy e verifique os logs!**







