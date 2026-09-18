-- ============================================================================
-- Segurança em Içamento — Quiz TRLL
-- Schema Supabase (PostgreSQL + Row Level Security)
--
-- O app usa login local (sem senha, ver README "Próximos passos" e
-- js/app.js#handleCadastro) — não há sessão de Supabase Auth, então não existe
-- auth.uid() para restringir o dono da linha. As políticas abaixo liberam
-- leitura/escrita para qualquer requisição autenticada com a anon key (que já
-- é pública no bundle do cliente, como em qualquer app Supabase). É um
-- trade-off aceitável para este uso interno (treinamento NR-11, sem dados
-- sensíveis) — upgrade para Supabase Auth real é o próximo passo documentado
-- no README caso isso mude.
-- ============================================================================

-- ---------- Tabela de perfis ----------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  cargo text not null,
  empresa_setor text,
  role text not null default 'colaborador' check (role in ('colaborador', 'gestor')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_insert_anon"
  on public.profiles for insert
  with check (true);

create policy "profiles_select_anon"
  on public.profiles for select
  using (true);

create policy "profiles_update_anon"
  on public.profiles for update
  using (true);

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

create policy "attempts_insert_anon"
  on public.quiz_attempts for insert
  with check (true);

create policy "attempts_select_anon"
  on public.quiz_attempts for select
  using (true);

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
