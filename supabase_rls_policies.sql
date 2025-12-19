-- ============================================
-- POLÍTICAS RLS PARA A TABELA RELATIONSHIPS
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Habilitar RLS na tabela relationships (se ainda não estiver habilitado)
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can insert their own relationships" ON relationships;
DROP POLICY IF EXISTS "Users can view their relationships" ON relationships;
DROP POLICY IF EXISTS "Users can delete their own relationships" ON relationships;
DROP POLICY IF EXISTS "Users can update relationships they received" ON relationships;

-- 3. Política para INSERT - Usuários podem criar solicitações de amizade
CREATE POLICY "Users can insert their own relationships"
ON relationships
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

-- 4. Política para SELECT - Usuários podem ver suas próprias relações
CREATE POLICY "Users can view their relationships"
ON relationships
FOR SELECT
TO authenticated
USING (
  auth.uid() = follower_id OR 
  auth.uid() = following_id
);

-- 5. Política para DELETE - Usuários podem deletar relações que criaram
CREATE POLICY "Users can delete their own relationships"
ON relationships
FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

-- 6. Política para UPDATE - Usuários podem aceitar solicitações recebidas
CREATE POLICY "Users can update relationships they received"
ON relationships
FOR UPDATE
TO authenticated
USING (auth.uid() = following_id)
WITH CHECK (auth.uid() = following_id);

-- ============================================
-- VERIFICAR SE A TABELA EXISTE E TEM A ESTRUTURA CORRETA
-- ============================================

-- Se a tabela não existir, crie-a com este comando:
CREATE TABLE IF NOT EXISTS relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_relationships_follower ON relationships(follower_id);
CREATE INDEX IF NOT EXISTS idx_relationships_following ON relationships(following_id);
CREATE INDEX IF NOT EXISTS idx_relationships_status ON relationships(status);

-- ============================================
-- TESTAR AS POLÍTICAS
-- ============================================

-- Execute este SELECT para verificar se as políticas foram criadas:
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'relationships';
