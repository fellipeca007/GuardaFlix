# 🔍 DEBUG: Erro ao Adicionar Amizade

## ❌ Erro Reportado
```
Erro ao enviar solicitação de amizade. Tente novamente.
```

## 🎯 Possíveis Causas

### 1. **Políticas RLS não configuradas no Supabase** (MAIS PROVÁVEL)
As políticas de segurança (Row Level Security) podem não estar ativas na tabela `relationships`.

### 2. **Tabela `relationships` não existe**
A tabela pode não ter sido criada no banco de dados.

### 3. **Usuário não autenticado**
A sessão pode ter expirado.

### 4. **Tentativa de adicionar amizade duplicada**
Você já enviou uma solicitação para esta pessoa.

---

## 🛠️ SOLUÇÃO PASSO A PASSO

### **PASSO 1: Verificar o Console do Navegador**

1. Abra o DevTools do navegador (F12)
2. Vá para a aba **Console**
3. Tente adicionar um amigo novamente
4. Procure por mensagens de erro em vermelho
5. **Copie o erro completo** e me envie

**O que procurar:**
- `❌ Erro ao enviar solicitação:` seguido de detalhes
- Códigos de erro como `42501`, `23505`, `23503`
- Mensagens sobre "permission denied" ou "policy"

---

### **PASSO 2: Verificar Supabase - Tabela Relationships**

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Table Editor** (menu lateral)
4. Procure pela tabela `relationships`

**Se a tabela NÃO existir:**
- Vá para **SQL Editor**
- Execute o script completo do arquivo `supabase_rls_policies.sql`

**Se a tabela existir:**
- Clique na tabela `relationships`
- Verifique se tem as colunas:
  - `id` (UUID)
  - `follower_id` (UUID)
  - `following_id` (UUID)
  - `status` (TEXT)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

---

### **PASSO 3: Verificar Políticas RLS**

1. No Supabase, vá em **Authentication** → **Policies**
2. Procure pela tabela `relationships`
3. Verifique se existem 4 políticas:
   - ✅ "Users can insert their own relationships" (INSERT)
   - ✅ "Users can view their relationships" (SELECT)
   - ✅ "Users can delete their own relationships" (DELETE)
   - ✅ "Users can update relationships they received" (UPDATE)

**Se as políticas NÃO existirem:**
1. Vá para **SQL Editor**
2. Execute o script `supabase_rls_policies.sql` completo
3. Aguarde a confirmação de sucesso

---

### **PASSO 4: Verificar Autenticação**

1. No console do navegador, execute:
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Sessão:', session);
console.log('User ID:', session?.user?.id);
```

2. Verifique se:
   - `session` não é `null`
   - `session.user.id` existe e é um UUID válido

**Se a sessão for null:**
- Faça logout e login novamente

---

### **PASSO 5: Testar Inserção Manual**

1. No Supabase, vá para **SQL Editor**
2. Execute este comando (substitua os UUIDs):
```sql
-- Primeiro, veja seu user_id
SELECT auth.uid();

-- Depois, tente inserir manualmente
INSERT INTO relationships (follower_id, following_id, status)
VALUES (
  'SEU_USER_ID_AQUI',  -- Substitua pelo seu ID
  'ID_DO_AMIGO_AQUI',   -- Substitua pelo ID de outro usuário
  'pending'
);
```

**Se der erro:**
- Copie a mensagem de erro completa
- Me envie para análise

---

### **PASSO 6: Verificar Variáveis de Ambiente**

1. Abra o arquivo `.env` (não compartilhe o conteúdo!)
2. Verifique se tem:
   - `VITE_SUPABASE_URL=https://seu-projeto.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=sua-chave-anon-key`

3. Verifique se as URLs estão corretas:
   - Vá no Supabase → **Settings** → **API**
   - Compare com as variáveis do `.env`

**Se estiverem diferentes:**
- Atualize o `.env`
- Reinicie o servidor (`npm run dev`)

---

## 🔧 CORREÇÃO RÁPIDA (Executar no SQL Editor do Supabase)

Se você tem acesso ao Supabase, execute este script completo:

```sql
-- 1. Criar tabela se não existir
CREATE TABLE IF NOT EXISTS relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- 2. Habilitar RLS
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas
DROP POLICY IF EXISTS "Users can insert their own relationships" ON relationships;
DROP POLICY IF EXISTS "Users can view their relationships" ON relationships;
DROP POLICY IF EXISTS "Users can delete their own relationships" ON relationships;
DROP POLICY IF EXISTS "Users can update relationships they received" ON relationships;

-- 4. Criar políticas novas
CREATE POLICY "Users can insert their own relationships"
ON relationships FOR INSERT TO authenticated
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can view their relationships"
ON relationships FOR SELECT TO authenticated
USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can delete their own relationships"
ON relationships FOR DELETE TO authenticated
USING (auth.uid() = follower_id);

CREATE POLICY "Users can update relationships they received"
ON relationships FOR UPDATE TO authenticated
USING (auth.uid() = following_id)
WITH CHECK (auth.uid() = following_id);

-- 5. Criar índices
CREATE INDEX IF NOT EXISTS idx_relationships_follower ON relationships(follower_id);
CREATE INDEX IF NOT EXISTS idx_relationships_following ON relationships(following_id);
CREATE INDEX IF NOT EXISTS idx_relationships_status ON relationships(status);

-- 6. Verificar se funcionou
SELECT * FROM pg_policies WHERE tablename = 'relationships';
```

---

## 📊 Verificação Final

Após executar as correções, teste:

1. ✅ Abra o console do navegador (F12)
2. ✅ Vá para a aba "Amigos" → "Sugestões"
3. ✅ Clique em "Adicionar" em algum usuário
4. ✅ Verifique se aparece "✅ Solicitação de amizade enviada com sucesso!" no console
5. ✅ Vá para a aba "Solicitadas" e veja se o usuário aparece lá

---

## 🆘 Se Ainda Não Funcionar

**Me envie:**
1. O erro completo do console do navegador
2. Screenshot da tabela `relationships` no Supabase
3. Screenshot das políticas RLS no Supabase
4. Resultado do comando SQL: `SELECT * FROM pg_policies WHERE tablename = 'relationships';`

---

## 💡 Dica Extra

Para ver logs em tempo real do Supabase:
1. Vá em **Logs** no menu lateral do Supabase
2. Selecione **Postgres Logs**
3. Tente adicionar um amigo
4. Veja se aparece algum erro nos logs
