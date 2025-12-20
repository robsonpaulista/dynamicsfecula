# 🚨 URGENTE: Corrigir Root Directory no Vercel

## ❌ Erro Atual

```
npm error path /vercel/path0/package.json
npm error errno -2
npm error enoent Could not read package.json
```

## ✅ SOLUÇÃO IMEDIATA

### Passo a Passo OBRIGATÓRIO:

1. **Acesse o Dashboard do Vercel**
   - https://vercel.com/dashboard
   - Selecione o projeto `dynamicsadm`

2. **Vá em Settings → General**
   - Clique em **Settings** (menu lateral esquerdo)
   - Clique em **General** (primeira opção)

3. **Role até "Build & Development Settings"**
   - Procure pela seção **Build & Development Settings**

4. **CONFIGURE O ROOT DIRECTORY (CRÍTICO!)**
   
   **IMPORTANTE**: Procure pelo campo **"Root Directory"** ou **"Project Root"**
   
   - Se estiver preenchido com algo como `frontend/` ou `backend/`, **APAGUE TUDO**
   - Deixe **COMPLETAMENTE VAZIO** ou coloque apenas `.` (ponto)
   - Isso faz o Vercel procurar o `package.json` na raiz do repositório

5. **Configure os outros campos:**
   - **Framework Preset**: `Next.js`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: Deixe vazio
   - **Install Command**: `npm install`

6. **SALVE**
   - Clique no botão **Save** (geralmente no topo ou final da página)

7. **Limpar Cache (OBRIGATÓRIO)**
   - Na mesma página, role até **Build Cache**
   - Clique em **Clear Build Cache**
   - Confirme a limpeza

8. **Fazer Redeploy**
   - Vá em **Deployments** (menu lateral)
   - Clique nos **três pontos (...)** do deployment mais recente
   - Selecione **Redeploy**

## 📍 Onde Está o Root Directory?

O campo **Root Directory** pode estar em diferentes lugares:

- **Opção 1**: Na seção **Build & Development Settings**
- **Opção 2**: Na seção **General Settings** (no topo)
- **Opção 3**: Como um campo separado acima de "Build Command"

**Procure por qualquer campo que mencione "Root", "Directory" ou "Project Root"**

## ⚠️ O Que NÃO Fazer

- ❌ NÃO coloque `frontend/` no Root Directory
- ❌ NÃO coloque `backend/` no Root Directory  
- ❌ NÃO deixe nenhum caminho configurado
- ✅ DEIXE VAZIO ou coloque apenas `.` (ponto)

## 🔍 Verificar se Está Correto

Após configurar, nos logs do próximo deploy você deve ver:

```
Running "install" command: `npm install`...
✓ Installed dependencies
Running "npm run vercel-build"
```

Se ainda aparecer o erro `Could not read package.json`, o Root Directory ainda está errado.

## 💡 Dica

Se não encontrar o campo "Root Directory", pode ser que ele esteja oculto ou tenha outro nome. Procure em:
- **Settings → General → Build & Development Settings**
- Ou tente recriar o projeto no Vercel apontando para a raiz do repositório

---

**O problema é 100% o Root Directory configurado incorretamente no dashboard!**

