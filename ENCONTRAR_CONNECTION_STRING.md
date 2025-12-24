# 🔍 Como Encontrar a Connection String no Supabase

## 📍 Onde Está a Connection String?

A Connection String **NÃO** está na página inicial do projeto. Você precisa ir em **Settings**.

## 🎯 Passo a Passo

### 1. No Dashboard do Supabase

1. No menu lateral esquerdo, procure por **Settings** (ícone de ⚙️ engrenagem)
2. Clique em **Settings**

### 2. Dentro de Settings

1. No menu lateral dentro de Settings, clique em **Database**
2. Role a página para baixo
3. Procure pela seção **Connection string** ou **Connection pooling**

### 3. Copiar a Connection String

Você verá algo assim:

```
Connection string
URI
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

**IMPORTANTE:**
- Use a aba **URI** (não "Connection pooling")
- A string tem `[YOUR-PASSWORD]` - você precisa substituir isso pela senha do banco

### 4. Qual é a Senha?

A senha é a que você criou quando fez o projeto. Se não lembrar:
- Vá em **Settings** → **Database**
- Role até **Database password**
- Você pode ver a senha ou resetá-la

## 📝 Exemplo Completo

Se você vê:
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

E sua senha é `MinhaSenha123`, você deve colocar no `.env`:
```
DATABASE_URL="postgresql://postgres.xxxxx:MinhaSenha123@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
```

## 🎯 Caminho Visual

```
Dashboard do Projeto
  └── Settings (⚙️ no menu lateral)
      └── Database (no submenu)
          └── Connection string
              └── URI (aba)
                  └── Copiar string aqui
```

## ⚠️ Não Confunda

- ❌ **Project URL** - Não é isso
- ❌ **API Key** - Não é isso
- ✅ **Connection string** (em Settings > Database) - É isso!

## 💡 Dica

Se não encontrar, tente:
1. Settings → Database
2. Procure por "Connection string" ou "Connection info"
3. Use a string da aba **URI** (não "Connection pooling")

---

**A Connection String está em Settings > Database, não na página inicial!**










