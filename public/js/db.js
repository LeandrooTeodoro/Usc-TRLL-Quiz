/**
 * Camada de persistência local (offline-first) + fila de sincronização com Supabase.
 *
 * Requisito da TRLL (roteiro de contato, pergunta 8): o quiz precisa funcionar
 * offline em canteiros/subestações sem cobertura de dados. Toda escrita é feita
 * primeiro no localStorage do aparelho; quando há conexão e Supabase configurado
 * (ver js/supabase-client.js), a fila é sincronizada em segundo plano.
 */

const DB = (() => {
  const KEYS = {
    profile: "trll_quiz_profile", // usuário logado neste aparelho
    attempts: "trll_quiz_attempts", // histórico local de tentativas
    syncQueue: "trll_quiz_sync_queue", // itens pendentes de envio ao Supabase
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn("DB: falha ao ler", key, e);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("DB: falha ao gravar", key, e);
    }
  }

  return {
    // ---- Perfil do colaborador logado no aparelho ----
    getProfile() {
      return read(KEYS.profile, null);
    },
    saveProfile(profile) {
      write(KEYS.profile, profile);
    },
    clearProfile() {
      localStorage.removeItem(KEYS.profile);
    },

    // ---- Tentativas de quiz (histórico local, usado no painel do gestor offline) ----
    getAttempts() {
      return read(KEYS.attempts, []);
    },
    saveAttempt(attempt) {
      const attempts = read(KEYS.attempts, []);
      attempts.unshift(attempt);
      write(KEYS.attempts, attempts);
    },

    // ---- Fila de sincronização ----
    getSyncQueue() {
      return read(KEYS.syncQueue, []);
    },
    enqueueSync(item) {
      const queue = read(KEYS.syncQueue, []);
      queue.push(item);
      write(KEYS.syncQueue, queue);
    },
    setSyncQueue(queue) {
      write(KEYS.syncQueue, queue);
    },
  };
})();
