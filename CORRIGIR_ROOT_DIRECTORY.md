# 🔧 Corrigir Erro: package.json não encontrado

## 🚨 Erro

```
npm error path /vercel/path0/package.json
npm error errno -2
npm error enoent Could not read package.json
```

## ✅ Solução: Configurar Root Directory no Dashboard

O Vercel não está encontrando o `package.json` porque pode estar olhando no diretório errado.

### Passo a Passo:

1. **Acesse o Dashboard do Vercel**
   - https://vercel.com/dashboard
   - Selecione o projeto `dynamicsadm`

2. **Vá em Settings → General**
   - Role até **Build & Development Settings**

3. **Configure o Root Directory**
   - **Root Directory**: Deixe vazio OU coloque `.` (ponto)
   - Isso indica que o `package.json` está na raiz do repositório

4. **Configure os outros campos:**
   - **Framework Preset**: `Next.js`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: Deixe vazio
   - **Install Command**: `npm install`

5. **Salve as Configurações**
   - Clique em **Save**

6. **Limpar Cache**
   - Na mesma página, role até **Build Cache**
   - Clique em **Clear Build Cache**

7. **Fazer Novo Deploy**
   - Vá em **Deployments**
   - Clique nos três pontos (...) do deployment mais recente
   - Selecione **Redeploy**

## 📋 Estrutura do Projeto

O `package.json` está na raiz:
```
dynamicsadm/
├── package.json  ← AQUI
├── app/
├── lib/
├── prisma/
└── ...
```

## ⚠️ Importante

- O **Root Directory** deve estar vazio ou `.` (ponto)
- Não coloque `frontend/` ou `backend/` - o projeto principal está na raiz
- O Vercel precisa encontrar o `package.json` na raiz para funcionar

## 🔍 Verificar

Após configurar, nos logs você deve ver:
```
Running "install" command: `npm install`...
✓ Installed dependencies
Running "npm run vercel-build"
```

Se ainda der erro, verifique se há algum subdiretório configurado incorretamente.






