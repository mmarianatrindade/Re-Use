import type { Env } from './env';
import { calcularSha256 } from './cripto';
import { ErroApi, obterIp } from './http';

export async function limitarRequisicoes(request: Request, env: Env) {
  const caminho = new URL(request.url).pathname;
  let grupo: string;
  let maximo: number;
  let janelaMs: number;
  if (caminho === '/ecopontos') {
    grupo = 'ecopontos'; maximo = 30; janelaMs = 60_000;
  } else if (caminho.startsWith('/enderecos/')) {
    grupo = 'enderecos'; maximo = 60; janelaMs = 60_000;
  } else if (caminho === '/auth/cadastro') {
    grupo = 'cadastro'; maximo = 5; janelaMs = 60 * 60_000;
  } else if (caminho === '/auth/login') {
    grupo = 'login'; maximo = 20; janelaMs = 60_000;
  } else if (caminho === '/auth/recuperar' || caminho === '/auth/reenviar-ativacao') {
    grupo = 'email'; maximo = 5; janelaMs = 10 * 60_000;
  } else if (caminho === '/uploads' && request.method === 'POST') {
    grupo = 'uploads'; maximo = 40; janelaMs = 10 * 60_000;
  } else {
    return;
  }
  const agora = Date.now();
  const janela = Math.floor(agora / janelaMs);
  const chave = `${grupo}/${await calcularSha256(obterIp(request) ?? 'local')}/${janela}`;
  const registro = await env.DB.prepare(`INSERT INTO request_limits (chave, quantidade, expira_em) VALUES (?, 1, ?)
    ON CONFLICT(chave) DO UPDATE SET quantidade = quantidade + 1 WHERE quantidade < ? RETURNING quantidade`)
    .bind(chave, (janela + 1) * janelaMs, maximo)
    .first<{ quantidade: number }>();
  if (!registro) throw new ErroApi(429, 'LIMITE_REQUISICOES', 'Muitas solicitações. Aguarde alguns instantes e tente novamente.');
  if (registro.quantidade === 1) await env.DB.prepare('DELETE FROM request_limits WHERE expira_em <= ?').bind(agora).run();
}
