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

let obterToken: () => string | null = () => null;
let aoExpirarSessao: () => void = () => undefined;

// O contexto de sessão registra aqui como ler o token e o que fazer quando ele expira.
export function configurarSessaoApi(opcoes: { obterToken: () => string | null; aoExpirarSessao: () => void }) {
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

  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, { method: opcoes.metodo ?? 'GET', headers, body });
  } catch {
    throw new ApiError(0, 'SEM_CONEXAO', 'Não foi possível falar com o servidor. Verifique sua conexão.');
  }

  const texto = await resposta.text();
  const json: unknown = texto ? JSON.parse(texto) : null;

  if (!resposta.ok) {
    const erro = (json ?? {}) as Partial<ErroResposta>;
    if (resposta.status === 401 && token) {
      aoExpirarSessao();
    }
    throw new ApiError(resposta.status, erro.codigo ?? 'ERRO', erro.erro ?? 'Algo deu errado. Tente novamente.', erro.campos);
  }

  return json as T;
}

export function obterMensagemErro(erro: unknown) {
  return erro instanceof Error ? erro.message : 'Algo deu errado. Tente novamente.';
}
