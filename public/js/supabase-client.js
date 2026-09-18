/**
 * Cliente Supabase minimalista via REST/PostgREST (sem dependência do bundle
 * supabase-js, para manter o app leve e não quebrar o funcionamento offline).
 *
 * Preencha SUPABASE_URL e SUPABASE_ANON_KEY em config.js (carregado antes
 * deste arquivo) com os dados do projeto Supabase real.
 * Enquanto não configurado, o app funciona inteiramente em modo local
 * (localStorage) — o que já atende ao requisito de uso offline da TRLL.
 */

const SUPABASE_URL = window.TRLL_CONFIG?.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = window.TRLL_CONFIG?.SUPABASE_ANON_KEY || "";

const SupabaseClient = (() => {
  const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

  async function request(path, { method = "GET", body, accessToken } = {}) {
    if (!isConfigured) throw new Error("Supabase não configurado (modo offline/local).");
    const res = await fetch(`${SUPABASE_URL}${path}`, {
      method,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Supabase ${method} ${path} falhou (${res.status}): ${text}`);
    }
    return res.status === 204 ? null : res.json();
  }

  return {
    isConfigured,

    async upsertProfile(profile, accessToken) {
      return request("/rest/v1/profiles?on_conflict=id", {
        method: "POST",
        body: {
          id: profile.id,
          full_name: profile.fullName,
          cargo: profile.cargo,
          empresa_setor: profile.empresaSetor,
          role: profile.role,
        },
        accessToken,
      });
    },

    async insertAttempt(attempt, accessToken) {
      return request("/rest/v1/quiz_attempts", {
        method: "POST",
        body: {
          profile_id: attempt.profileId,
          score: attempt.score,
          total_questions: attempt.total,
          started_at: attempt.startedAt,
          finished_at: attempt.finishedAt,
          answers: attempt.answers,
        },
        accessToken,
      });
    },

    async listAttemptsForGestor(accessToken) {
      return request(
        "/rest/v1/quiz_attempts?select=*,profiles(full_name,cargo,empresa_setor)&order=finished_at.desc",
        { accessToken }
      );
    },
  };
})();

/**
 * Tenta drenar a fila de sincronização local (db.js) contra o Supabase.
 * Chamado ao iniciar o app e sempre que o navegador voltar a ficar online.
 */
async function trySyncQueue() {
  if (!SupabaseClient.isConfigured || !navigator.onLine) return { synced: 0, pending: DB.getSyncQueue().length };

  const queue = DB.getSyncQueue();
  if (queue.length === 0) return { synced: 0, pending: 0 };

  const remaining = [];
  let synced = 0;

  for (const item of queue) {
    try {
      if (item.type === "profile") {
        await SupabaseClient.upsertProfile(item.payload);
      } else if (item.type === "attempt") {
        await SupabaseClient.insertAttempt(item.payload);
      }
      synced += 1;
    } catch (e) {
      console.warn("Sync: item ainda não sincronizado", item, e);
      remaining.push(item);
    }
  }

  DB.setSyncQueue(remaining);
  return { synced, pending: remaining.length };
}

window.addEventListener("online", () => {
  trySyncQueue().then((r) => {
    if (r.synced > 0) console.info(`Sincronizados ${r.synced} registro(s) pendente(s) com o Supabase.`);
  });
});
