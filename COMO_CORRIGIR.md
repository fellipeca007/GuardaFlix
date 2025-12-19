# 🔧 CORREÇÃO DEFINITIVA - Erro ao Adicionar Amizade

## ❌ ERRO IDENTIFICADO:
```
Could not find the 'status' column of 'relationships' in the schema cache
Code: PGRST204
```

**Causa:** A coluna `status` não existe na tabela `relationships` do seu banco de dados Supabase.

---

## ✅ SOLUÇÃO RÁPIDA (5 minutos)

### **PASSO 1: Acesse o Supabase**

1. Vá para: https://supabase.com/dashboard
2. Faça login
3. Selecione seu projeto GuardaFlix

---

### **PASSO 2: Abra o SQL Editor**

1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique em **New Query** (botão verde no canto superior direito)

---

### **PASSO 3: Execute o Script de Correção**

1. Abra o arquivo `FIX_RELATIONSHIPS_TABLE.sql` (está na raiz do projeto)
2. **Copie TODO o conteúdo** do arquivo
3. **Cole** no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

**Aguarde a execução.** Você verá mensagens como:
```
✅ Tabela relationships já existe.
✅ Coluna status adicionada com sucesso!
✅ Constraint adicionada com sucesso!
```

---

### **PASSO 4: Verificar se Funcionou**

Após executar o script, você verá duas tabelas de resultado:

**Tabela 1 - Estrutura da tabela:**
```
column_name       | data_type | column_default | is_nullable
------------------|-----------|----------------|------------
id                | uuid      | gen_random...  | NO
follower_id       | uuid      | NULL           | NO
following_id      | uuid      | NULL           | NO
status            | text      | 'pending'      | NO  ← DEVE APARECER!
created_at        | timestamp | now()          | YES
updated_at        | timestamp | now()          | YES
```

**Tabela 2 - Políticas RLS:**
```
policyname                                      | cmd
------------------------------------------------|--------
Users can insert their own relationships        | INSERT
Users can view their relationships              | SELECT
Users can delete their own relationships        | DELETE
Users can update relationships they received    | UPDATE
```

✅ **Se você vê 6 colunas e 4 políticas, está tudo certo!**

---

### **PASSO 5: Testar no Aplicativo**

1. Volte para http://localhost:3000
2. **Recarregue a página** (F5 ou Ctrl+R)
3. Vá para **Amigos** → **Sugestões**
4. Clique em **Adicionar** em algum usuário
5. Abra o Console (F12) e verifique:

**Você DEVE ver:**
```
🔄 Tentando criar relacionamento: { follower_id: "...", following_id: "...", status: "pending" }
✅ Relacionamento criado com sucesso: [...]
✅ Solicitação de amizade enviada com sucesso!
```

6. Vá para a aba **Solicitadas** e veja se o usuário aparece lá com status "Aguardando"

---

## 🎯 CHECKLIST DE VERIFICAÇÃO

Marque cada item conforme completa:

- [ ] Executei o script `FIX_RELATIONSHIPS_TABLE.sql` no Supabase
- [ ] Vi a mensagem "Coluna status adicionada com sucesso!"
- [ ] Verifiquei que a coluna `status` aparece na estrutura da tabela
- [ ] Verifiquei que existem 4 políticas RLS
- [ ] Recarreguei a página do aplicativo (F5)
- [ ] Tentei adicionar um amigo
- [ ] Vi a mensagem de sucesso no console
- [ ] O usuário apareceu na aba "Solicitadas"

---

## 🆘 SE AINDA NÃO FUNCIONAR

### **Opção A: Recriar a Tabela do Zero**

Se o script acima não resolver, execute este script alternativo:

```sql
-- ATENÇÃO: Isso vai DELETAR todos os relacionamentos existentes!
DROP TABLE IF EXISTS relationships CASCADE;

-- Criar tabela nova e completa
CREATE TABLE relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Habilitar RLS
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

-- Criar políticas
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

-- Criar índices
CREATE INDEX idx_relationships_follower ON relationships(follower_id);
CREATE INDEX idx_relationships_following ON relationships(following_id);
CREATE INDEX idx_relationships_status ON relationships(status);
```

### **Opção B: Verificação Manual**

1. No Supabase, vá em **Table Editor**
2. Clique na tabela `relationships`
3. Verifique se a coluna `status` existe
4. Se não existir, clique em **Add Column**:
   - **Name:** `status`
   - **Type:** `text`
   - **Default value:** `pending`
   - **Is nullable:** Desmarque (NOT NULL)
5. Clique em **Save**

---

## 📊 RESULTADO ESPERADO

Após a correção, quando você adicionar um amigo:

1. **No Console do Navegador:**
   ```
   🔄 Tentando criar relacionamento: {...}
   ✅ Relacionamento criado com sucesso: [...]
   ✅ Solicitação de amizade enviada com sucesso!
   ```

2. **Na Interface:**
   - O usuário desaparece da aba "Sugestões"
   - O usuário aparece na aba "Solicitadas" com status "Aguardando"
   - Nenhum alert de erro aparece

3. **No Supabase (Table Editor → relationships):**
   - Uma nova linha é criada com:
     - `follower_id`: Seu ID
     - `following_id`: ID do amigo
     - `status`: `pending`

---

## 💡 POR QUE ISSO ACONTECEU?

A tabela `relationships` foi criada sem a coluna `status`, mas o código do aplicativo espera que essa coluna exista. Isso pode ter acontecido se:

1. A tabela foi criada manualmente sem seguir o script completo
2. Uma migração antiga foi executada sem a coluna `status`
3. A tabela foi criada antes do sistema de status ser implementado

O script de correção adiciona a coluna faltante e configura tudo corretamente.

---

## ✅ CONFIRMAÇÃO FINAL

Após executar o script, me envie:

1. Screenshot da estrutura da tabela `relationships` (mostrando todas as colunas)
2. Screenshot do console do navegador após tentar adicionar um amigo
3. Confirmação se funcionou ou não

Isso me ajudará a garantir que tudo está correto! 🎯
