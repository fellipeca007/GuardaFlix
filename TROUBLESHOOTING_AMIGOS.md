# 🔧 Guia de Solução de Problemas - Botão "Adicionar Amigo"

## ❌ Problema Reportado
Ao clicar no botão "Adicionar" na seção de Amizades, aparece o erro: **"Erro ao enviar solicitação de amizade"**

---

## 🎯 Soluções por Tipo de Erro

### 1️⃣ **Erro de Permissão RLS (Mais Comum)**

**Mensagem:** "Erro de permissão. Verifique se você está autenticado e se as políticas RLS estão configuradas corretamente no Supabase."

**Causa:** As políticas RLS (Row Level Security) não estão configuradas na tabela `relationships`.

**Solução:**
1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute o script `supabase_rls_policies.sql` que foi criado na raiz do projeto
4. Verifique se as políticas foram criadas com sucesso

**Verificação:**
```sql
-- Execute este comando no SQL Editor para verificar as políticas:
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'relationships';
```

Você deve ver 4 políticas:
- `Users can insert their own relationships` (INSERT)
- `Users can view their relationships` (SELECT)
- `Users can delete their own relationships` (DELETE)
- `Users can update relationships they received` (UPDATE)

---

### 2️⃣ **Erro de Duplicação**

**Mensagem:** "Você já enviou uma solicitação para esta pessoa."

**Causa:** Já existe uma solicitação pendente para este usuário.

**Solução:**
- Verifique a aba "Solicitadas" para ver se a solicitação já foi enviada
- Se quiser cancelar, clique em "Cancelar" na aba "Solicitadas"

---

### 3️⃣ **Erro de Autenticação**

**Mensagem:** "Sessão expirada. Por favor, faça login novamente."

**Causa:** O token JWT expirou ou é inválido.

**Solução:**
1. Faça logout
2. Faça login novamente
3. Tente adicionar o amigo novamente

---

### 4️⃣ **Erro de Conexão**

**Mensagem:** "Erro de conexão. Verifique sua internet e tente novamente."

**Causa:** Problema de rede ou Supabase fora do ar.

**Solução:**
1. Verifique sua conexão com a internet
2. Verifique se o Supabase está online: https://status.supabase.com/
3. Tente novamente em alguns segundos

---

### 5️⃣ **Erro de Usuário Não Encontrado**

**Mensagem:** "Usuário não encontrado. Tente atualizar a página."

**Causa:** O usuário foi deletado ou não existe mais.

**Solução:**
1. Atualize a página (F5)
2. Verifique se o usuário ainda aparece nas sugestões

---

## 🔍 Como Identificar o Erro Específico

### Passo 1: Abrir o Console do Navegador
1. Pressione **F12** no navegador
2. Vá na aba **Console**
3. Clique no botão "Adicionar"
4. Veja a mensagem de erro que aparece

### Passo 2: Verificar o Erro no Console
Procure por mensagens que começam com:
- `❌ Erro ao enviar solicitação:`
- `🔒 RLS Policy Error`
- `Error in followUser:`

### Passo 3: Verificar a Aba Network
1. Vá na aba **Network** do DevTools
2. Clique no botão "Adicionar"
3. Procure pela requisição para `/rest/v1/relationships`
4. Clique nela e veja:
   - **Status Code:** (200 = sucesso, 400/401/403 = erro)
   - **Response:** Mensagem de erro detalhada

---

## 📋 Checklist de Verificação

Antes de reportar o erro, verifique:

- [ ] Você está logado na aplicação?
- [ ] As variáveis de ambiente estão configuradas? (`.env` ou `.env.local`)
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- [ ] A tabela `relationships` existe no Supabase?
- [ ] As políticas RLS estão configuradas?
- [ ] O usuário que você está tentando adicionar existe?
- [ ] Você já enviou uma solicitação para este usuário?

---

## 🛠️ Comandos Úteis para Debug

### Ver logs do servidor de desenvolvimento:
```bash
# No terminal onde está rodando npm run dev
# Procure por erros relacionados a Supabase
```

### Testar conexão com Supabase:
```javascript
// Cole no Console do navegador (F12):
const { data, error } = await supabase.from('relationships').select('*').limit(1);
console.log('Teste de conexão:', { data, error });
```

### Ver usuário atual:
```javascript
// Cole no Console do navegador (F12):
const { data: { user } } = await supabase.auth.getUser();
console.log('Usuário atual:', user);
```

---

## 📞 Informações para Suporte

Se o erro persistir, forneça as seguintes informações:

1. **Mensagem de erro completa** (do alert e do console)
2. **Status Code** da requisição (da aba Network)
3. **Response** da requisição (da aba Network)
4. **Screenshot** do console com o erro
5. **Confirmação** de que as políticas RLS foram executadas

---

## ✅ Solução Aplicada no Código

As seguintes melhorias foram implementadas:

1. ✅ **Mensagens de erro específicas** - Agora você sabe exatamente qual é o problema
2. ✅ **Atualização otimista** - O usuário desaparece da lista imediatamente
3. ✅ **Reversão em caso de erro** - Se falhar, o usuário volta para a lista
4. ✅ **Logs detalhados** - Erros são registrados no console para debug
5. ✅ **Tratamento de duplicação** - Detecta se já existe solicitação pendente

---

## 🎓 Próximos Passos

1. Execute o script SQL `supabase_rls_policies.sql` no Supabase
2. Faça logout e login novamente
3. Tente adicionar um amigo
4. Se o erro persistir, abra o console (F12) e veja a mensagem específica
5. Use este guia para identificar e resolver o problema

---

**Última atualização:** 2025-12-17
**Versão:** 1.0
