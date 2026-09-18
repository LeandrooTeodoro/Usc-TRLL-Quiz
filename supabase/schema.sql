-- ============================================================================
-- Segurança em Içamento — Quiz TRLL
-- Schema Supabase (PostgreSQL + Supabase Auth + Row Level Security)
--
-- Modelo de acesso:
--   - "colaborador": só enxerga e grava o próprio perfil e as próprias tentativas.
--   - "gestor": enxerga (somente leitura) o perfil e as tentativas de todos.
-- ============================================================================

-- ---------- Tabela de perfis ----------
create table if not exists public.profiles (
  id uuid primary key default auth.uid(),
  full_name text not null,
  cargo text not null,
  empresa_setor text,
  role text not null default 'colaborador' check (role in ('colaborador', 'gestor')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Colaborador só vê/edita o próprio perfil
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_upsert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Gestor vê todos os perfis (leitura)
create policy "profiles_select_gestor"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'gestor'
    )
  );

-- ---------- Tabela de tentativas de quiz ----------
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null,
  total_questions integer not null,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  answers jsonb not null default '[]'::jsonb, -- [{questionId, category, isCorrect, userAnswer}]
  device_synced_from text, -- identificador opcional do aparelho de origem
  created_at timestamptz not null default now()
);

alter table public.quiz_attempts enable row level security;

-- Colaborador grava e lê apenas as próprias tentativas
create policy "attempts_insert_own"
  on public.quiz_attempts for insert
  with check (auth.uid() = profile_id);

create policy "attempts_select_own"
  on public.quiz_attempts for select
  using (auth.uid() = profile_id);

-- Gestor lê todas as tentativas (para o painel de acompanhamento)
create policy "attempts_select_gestor"
  on public.quiz_attempts for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'gestor'
    )
  );

-- ---------- Índices úteis ----------
create index if not exists idx_quiz_attempts_profile_id on public.quiz_attempts (profile_id);
create index if not exists idx_quiz_attempts_finished_at on public.quiz_attempts (finished_at desc);

-- ---------- View agregada para o painel do gestor (nota média por categoria) ----------
create or replace view public.gestor_resumo_por_categoria as
select
  (answer->>'category') as category,
  count(*) filter (where (answer->>'isCorrect')::boolean) as acertos,
  count(*) as total_respostas
from public.quiz_attempts qa,
     jsonb_array_elements(qa.answers) as answer
group by (answer->>'category');

-- Observação: esta view herda a RLS das tabelas subjacentes apenas se exposta via
-- RPC/policy própria; para uso direto pelo painel do gestor, prefira consultar
-- quiz_attempts com o join a profiles já implementado em js/supabase-client.js
-- (SupabaseClient.listAttemptsForGestor), que já respeita a policy "attempts_select_gestor".
