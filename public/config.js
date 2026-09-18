/**
 * Configuração do Supabase para o Quiz TRLL.
 *
 * A anon key do Supabase é uma chave pública por design (protegida pelas
 * políticas de RLS em supabase/schema.sql, não por sigilo) — por isso este
 * arquivo é versionado normalmente, diferente de uma service_role key.
 *
 * Enquanto os valores abaixo estiverem vazios, o app roda 100% em modo local
 * (localStorage), o que já atende ao uso offline em campo.
 */
window.TRLL_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
};
