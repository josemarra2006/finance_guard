-- ============================================================
-- PASSO 1: Tabela de perfis (espelha auth.users)
-- Criada automaticamente via trigger quando um usuário se cadastra
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  name        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PASSO 2: Tabela de transações (privada por usuário)
-- Espelha a tabela SQLite local, com user_id para RLS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id          BIGSERIAL   PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  amount      REAL        NOT NULL,
  type        TEXT        NOT NULL CHECK(type IN ('gasto', 'entrada', 'economia')),
  date        TEXT        NOT NULL,
  synced_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PASSO 3: Tabela de metas (privada agora, preparada para compartilhamento futuro)
-- is_shared e shared_with permitem a lógica colaborativa no futuro
-- sem precisar fazer ALTER TABLE depois
-- ============================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id              BIGSERIAL   PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  target_amount   REAL        NOT NULL,
  current_amount  REAL        NOT NULL DEFAULT 0.0,
  deadline_date   TEXT        NOT NULL,
  is_shared       BOOLEAN     NOT NULL DEFAULT FALSE,
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PASSO 4: Índices para performance de consulta
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_id
  ON public.transactions (user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_date
  ON public.transactions (date);

CREATE INDEX IF NOT EXISTS idx_transactions_type
  ON public.transactions (type);

CREATE INDEX IF NOT EXISTS idx_goals_user_id
  ON public.goals (user_id);

CREATE INDEX IF NOT EXISTS idx_goals_deadline
  ON public.goals (deadline_date);

-- ============================================================
-- PASSO 5: Função e Trigger para criar perfil automaticamente
-- Toda vez que um novo usuário se cadastra no Auth do Supabase,
-- esta função insere automaticamente uma linha em public.profiles
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Remove o trigger se já existir para evitar duplicação ao rodar novamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();