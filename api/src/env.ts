export interface Env {
  DB: D1Database;
  // Presente só quando o binding send_email estiver habilitado no wrangler.jsonc.
  EMAIL?: SendEmail;
  AMBIENTE: 'desenvolvimento' | 'producao';
  APP_URL: string;
  ORIGENS_PERMITIDAS: string;
  EMAIL_REMETENTE: string;
  // "false" libera publicar sem confirmar o e-mail (enquanto não há domínio para envio). Padrão: exigir.
  EXIGIR_CONFIRMACAO_EMAIL: string;
  // Segredo (wrangler secret / .dev.vars): chave AES de 32 bytes em base64 para cifrar o CPF.
  CPF_CHAVE: string;
  // Segredo opcional: sem ele a busca de endereço fica indisponível e a geocodificação usa só as fontes gratuitas.
  GOOGLE_PLACES_API_KEY?: string;
}

export function exigeConfirmacaoEmail(env: Env) {
  return env.EXIGIR_CONFIRMACAO_EMAIL !== 'false';
}

export function emDesenvolvimento(env: Env) {
  return env.AMBIENTE === 'desenvolvimento';
}
