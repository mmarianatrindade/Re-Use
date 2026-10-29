import type { ZodType } from 'zod';
import type { ErroResposta } from '../../src/types/api';

// Erro de regra de negócio ou de entrada, convertido em resposta JSON pelo roteador.
export class ErroApi extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    mensagem: string,
    public readonly campos?: Record<string, string>,
  ) {
    super(mensagem);
  }
}

export function responderJson(dados: unknown, status = 200) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export function responderErro(erro: ErroApi) {
  const corpo: ErroResposta = { erro: erro.message, codigo: erro.codigo, campos: erro.campos };
  return responderJson(corpo, erro.status);
}

// Lê e valida o corpo JSON; erros de validação voltam com a mensagem por campo (422).
export async function lerCorpo<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw new ErroApi(400, 'JSON_INVALIDO', 'Corpo da requisição inválido.');
  }

  const resultado = schema.safeParse(json);
  if (!resultado.success) {
    const campos: Record<string, string> = {};
    for (const issue of resultado.error.issues) {
      const caminho = issue.path.join('.') || '_';
      campos[caminho] ??= issue.message;
    }
    throw new ErroApi(422, 'DADOS_INVALIDOS', 'Confira os dados informados.', campos);
  }
  return resultado.data;
}

export function aplicarCors(request: Request, resposta: Response, origensPermitidas: string) {
  const origem = request.headers.get('Origin');
  const permitidas = origensPermitidas.split(',').map((valor) => valor.trim());
  const headers = new Headers(resposta.headers);

  // Apps nativos não enviam Origin; o CORS só se aplica ao navegador.
  if (origem && permitidas.includes(origem)) {
    headers.set('Access-Control-Allow-Origin', origem);
    headers.set('Vary', 'Origin');
    headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-ReUse-Dispositivo');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    headers.set('Access-Control-Max-Age', '86400');
  }

  return new Response(resposta.body, { status: resposta.status, statusText: resposta.statusText, headers });
}

export function obterIp(request: Request) {
  return request.headers.get('CF-Connecting-IP');
}

export function obterDispositivo(request: Request) {
  return request.headers.get('X-ReUse-Dispositivo') ?? request.headers.get('User-Agent')?.slice(0, 200) ?? null;
}

export function agoraIso() {
  return new Date().toISOString();
}

export function somarMinutos(minutos: number) {
  return new Date(Date.now() + minutos * 60_000).toISOString();
}
