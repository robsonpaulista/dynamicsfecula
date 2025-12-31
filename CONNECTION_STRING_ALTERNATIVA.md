# 🔧 Como Obter Connection String no Supabase (Método Alternativo)

## 🎯 Opção 1: Construir Manualmente

Se você tem o **Project URL** e a **senha do banco**, podemos construir a connection string:

### Formato da Connection String do Supabase:

```
postgresql://postgres:[SENHA]@[HOST]:5432/postgres
```

### Onde encontrar o HOST:

1. No **Project URL** que você tem, algo como:
   ```
   https://xxxxx.supabase.co
   ```
   
2. O HOST do banco geralmente é:
   ```
   db.xxxxx.supabase.co
   ```
   (substitua `xxxxx` pela parte do seu Project URL)

### Exemplo Completo:

Se seu Project URL é: `https://abcdefghijklmnop.supabase.co`

E sua senha do banco é: `MinhaSenha123`

A Connection String seria:
```
postgresql://postgres:MinhaSenha123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

## 🎯 Opção 2: Usar Connection Pooling

No Supabase, você também pode usar o **Connection Pooler**:

1. Em **Settings > Database**
2. Procure por **Connection pooling** (pode estar em outra seção)
3. Use a porta **6543** ao invés de **5432**

Formato:
```
postgresql://postgres:[SENHA]@[HOST]:6543/postgres?pgbouncer=true
```

## 🎯 Opção 3: Verificar Outras Seções

A Connection String pode estar em:

1. **Settings > Database** → Role até o final da página
2. **Settings > API** → Às vezes está aqui também
3. **Project Settings** → Geral → Database

## 🎯 Opção 4: Usar o Supabase CLI

Se você tem o Supabase CLI instalado:

```bash
supabase db connection-string
```

## 💡 Dica: Resetar Senha

Se você não lembra a senha do banco:

1. Em **Settings > Database**
2. Clique em **"Reset database password"**
3. Anote a nova senha
4. Use essa senha na connection string

## 🔍 Onde Está o HOST?

O HOST geralmente segue este padrão:
- Project URL: `https://xxxxx.supabase.co`
- Database HOST: `db.xxxxx.supabase.co` ou `aws-0-region.pooler.supabase.com`

---

**Me envie seu Project URL e eu te ajudo a construir a connection string!**













