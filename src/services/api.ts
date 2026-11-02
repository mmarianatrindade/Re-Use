import { Platform } from 'react-native';
import type { ErroResposta } from '../types/api';

// ApiClient: requisições HTTP para a API ReUse (Cloudflare Workers), com token e tratamento de erros.

// Definida em .env (EXPO_PUBLIC_API_URL). No emulador Android, "localhost" é o próprio emulador:
// use o IP da máquina na rede (ex.: http://192.168.0.10:8787).
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    mensagem: string,
    public readonly campos?: Record<string, string>,
  ) {
    super(mensagem);
  }
}

// Tempo máximo de espera por resposta (uploads de foto têm mais folga) e tentativa extra só para leituras (GET).
const TEMPO_LIMITE_MS = 15_000;
const TEMPO_LIMITE_UPLOAD_MS = 60_000;
const ESPERA_ENTRE_TENTATIVAS_MS = 600;
// Falhas passageiras do servidor/borda (Cloudflare) que valem uma nova tentativa.
const STATUS_TRANSITORIOS = new Set([502, 503, 504]);

let obterToken: () => string | null = () => null;
let aoExpirarSessao: (token: string) => void = () => undefined;

// O contexto de sessão registra aqui como ler o token e o que fazer quando ele expira.
export function configurarSessaoApi(opcoes: { obterToken: () => string | null; aoExpirarSessao: (token: string) => void }) {
  obterToken = opcoes.obterToken;
  aoExpirarSessao = opcoes.aoExpirarSessao;
}

interface OpcoesRequisicao {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  corpo?: unknown;
  // Corpo binário (upload de imagem).
  arquivo?: { dados: Blob; tipo: string };
  token?: string | null;
}

export async function requisitar<T>(caminho: string, opcoes: OpcoesRequisicao = {}): Promise<T> {
  const token = opcoes.token === undefined ? obterToken() : opcoes.token;
  const headers: Record<string, string> = { Accept: 'application/json', 'X-ReUse-Dispositivo': `app-${Platform.OS}` };
  let body: BodyInit | undefined;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (opcoes.arquivo) {
    headers['Content-Type'] = opcoes.arquivo.tipo;
    body = opcoes.arquivo.dados;
  } else if (opcoes.corpo !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opcoes.corpo);
  }

  const metodo = opcoes.metodo ?? 'GET';
  const limiteMs = opcoes.arquivo ? TEMPO_LIMITE_UPLOAD_MS : TEMPO_LIMITE_MS;
  // Só leituras repetem: repetir POST/PUT/DELETE poderia duplicar uma ação.
  const tentativas = metodo === 'GET' ? 2 : 1;

  let resposta: { ok: boolean; status: number; texto: string } | null = null;
  let esgotouTempo = false;

  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), limiteMs);
    try {
      const retorno = await fetch(`${API_URL}${caminho}`, { method: metodo, headers, body, signal: controlador.signal });
      // O corpo também conta no limite: o timer só é desligado depois de ler o texto.
      resposta = { ok: retorno.ok, status: retorno.status, texto: await retorno.text() };
      esgotouTempo = false;
      if (!STATUS_TRANSITORIOS.has(resposta.status) || tentativa === tentativas) {
        break;
      }
    } catch {
      resposta = null;
      esgotouTempo = controlador.signal.aborted;
      if (tentativa === tentativas) {
        break;
      }
    } finally {
      clearTimeout(temporizador);
    }
    await new Promise((resolver) => setTimeout(resolver, ESPERA_ENTRE_TENTATIVAS_MS));
  }

  if (!resposta) {
    throw esgotouTempo
      ? new ApiError(0, 'TEMPO_ESGOTADO', 'O servidor demorou demais para responder. Tente novamente.')
      : new ApiError(0, 'SEM_CONEXAO', 'Não foi possível falar com o servidor. Verifique sua conexão.');
  }

  const json = lerJson(resposta.texto);

  if (!resposta.ok) {
    const erro = (json ?? {}) as Partial<ErroResposta>;
    if (resposta.status === 401 && token && token === obterToken()) {
      aoExpirarSessao(token);
    }
    const padrao = resposta.status >= 500 ? 'O servidor está instável no momento. Tente novamente em instantes.' : 'Algo deu errado. Tente novamente.';
    throw new ApiError(resposta.status, erro.codigo ?? 'ERRO', erro.erro ?? padrao, erro.campos);
  }

  // Resposta de sucesso que não é JSON (ex.: página de erro de um proxy): trata como falha em vez de quebrar a tela.
  if (resposta.texto && json === null) {
    throw new ApiError(resposta.status, 'RESPOSTA_INVALIDA', 'O servidor respondeu algo inesperado. Tente novamente.');
  }

  return json as T;
}

// JSON.parse que não derruba o app quando o servidor devolve HTML ou texto solto.
function lerJson(texto: string): unknown {
  if (!texto) {
    return null;
  }
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

export function obterMensagemErro(erro: unknown) {
  return erro instanceof Error ? erro.message : 'Algo deu errado. Tente novamente.';
}
