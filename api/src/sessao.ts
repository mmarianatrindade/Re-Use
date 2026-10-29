import { calcularSha256, gerarId, gerarToken } from './cripto';
import type { Env } from './env';
import { ErroApi, agoraIso, obterDispositivo } from './http';

// Sessão com expiração: o app renova o token quando faltam menos de RENOVAR_ANTES_DIAS para vencer.
export const SESSAO_DIAS = 7;

export interface SessaoAtual {
  sessaoId: string;
  userId: string;
  expiraEm: string;
}

export async function criarSessao(env: Env, userId: string, request: Request) {
  const token = gerarToken();
  const expiraEm = new Date(Date.now() + SESSAO_DIAS * 24 * 60 * 60_000).toISOString();

  await env.DB.prepare(
    'INSERT INTO sessions (id, user_id, token_hash, dispositivo, criado_em, expira_em) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(gerarId(), userId, await calcularSha256(token), obterDispositivo(request), agoraIso(), expiraEm)
    .run();

  return { token, expiraEm };
}

function lerToken(request: Request) {
  const cabecalho = request.headers.get('Authorization') ?? '';
  const [tipo, token] = cabecalho.split(' ');
  return tipo === 'Bearer' && token ? token : null;
}

export async function buscarSessao(env: Env, request: Request): Promise<SessaoAtual | null> {
  const token = lerToken(request);
  if (!token) {
    return null;
  }

  const sessao = await env.DB.prepare(
    'SELECT id, user_id, expira_em FROM sessions WHERE token_hash = ? AND revogado_em IS NULL AND expira_em > ?',
  )
    .bind(await calcularSha256(token), agoraIso())
    .first<{ id: string; user_id: string; expira_em: string }>();

  return sessao ? { sessaoId: sessao.id, userId: sessao.user_id, expiraEm: sessao.expira_em } : null;
}

export async function exigirSessao(env: Env, request: Request) {
  const sessao = await buscarSessao(env, request);
  if (!sessao) {
    throw new ErroApi(401, 'SESSAO_INVALIDA', 'Sua sessão expirou. Entre novamente.');
  }
  return sessao;
}

export async function revogarSessao(env: Env, sessaoId: string) {
  await env.DB.prepare('UPDATE sessions SET revogado_em = ? WHERE id = ?').bind(agoraIso(), sessaoId).run();
}

export async function revogarTodasSessoes(env: Env, userId: string) {
  await env.DB.prepare('UPDATE sessions SET revogado_em = ? WHERE user_id = ? AND revogado_em IS NULL')
    .bind(agoraIso(), userId)
    .run();
}
