-- ============================================
-- CORREÇÃO URGENTE: Coluna 'status' Ausente
-- ============================================
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Verificar se a tabela relationships existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'relationships') THEN
        RAISE NOTICE 'Tabela relationships não existe. Criando...';
        
        -- Criar a tabela completa
        CREATE TABLE relationships (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(follower_id, following_id)
        );
        
        RAISE NOTICE 'Tabela relationships criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela relationships já existe.';
    END IF;
END $$;

-- PASSO 2: Adicionar a coluna 'status' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'relationships' AND column_name = 'status'
    ) THEN
        RAISE NOTICE 'Coluna status não existe. Adicionando...';
        
        ALTER TABLE relationships
        ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
        
        RAISE NOTICE 'Coluna status adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna status já existe.';
    END IF;
END $$;

-- PASSO 3: Adicionar constraint CHECK se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_constraint 
        WHERE conname = 'relationships_status_check'
    ) THEN
        RAISE NOTICE 'Constraint de status não existe. Adicionando...';
        
        ALTER TABLE relationships
        ADD CONSTRAINT relationships_status_check 
        CHECK (status IN ('pending', 'accepted', 'rejected'));
        
        RAISE NOTICE 'Constraint adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Constraint já existe.';
    END IF;
END $$;

-- PASSO 4: Habilitar RLS
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

-- PASSO 5: Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can insert their own relationships" ON relationships;
DROP POLICY IF EXISTS "Users can view their relationships" ON relationships;
DROP POLICY IF EXISTS "Users can delete their own relationships" ON relationships;
DROP POLICY IF EXISTS "Users can update relationships they received" ON relationships;

-- PASSO 6: Criar políticas RLS
CREATE POLICY "Users can insert their own relationships"
ON relationships
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can view their relationships"
ON relationships
FOR SELECT
TO authenticated
USING (
  auth.uid() = follower_id OR 
  auth.uid() = following_id
);

CREATE POLICY "Users can delete their own relationships"
ON relationships
FOR DELETE
TO authenticated
USING (
  auth.uid() = follower_id OR 
  auth.uid() = following_id
);

CREATE POLICY "Users can update relationships they received"
ON relationships
FOR UPDATE
TO authenticated
USING (auth.uid() = following_id)
WITH CHECK (auth.uid() = following_id);

-- PASSO 7: Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_relationships_follower ON relationships(follower_id);
CREATE INDEX IF NOT EXISTS idx_relationships_following ON relationships(following_id);
CREATE INDEX IF NOT EXISTS idx_relationships_status ON relationships(status);

-- PASSO 8: Verificar a estrutura final
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'relationships'
ORDER BY ordinal_position;

-- PASSO 9: Verificar políticas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'relationships';

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Se tudo correr bem, você verá:
-- ✅ Tabela relationships com todas as colunas
-- ✅ 4 políticas RLS ativas
-- ✅ 3 índices criados
-- ============================================
