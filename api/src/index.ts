import type { Env } from './env';
import { ErroApi, aplicarCors, responderErro, responderJson } from './http';
import {
  alterarStatusAnuncio,
  cancelarDestaque,
  contratarDestaque,
  criarAnuncio,
  denunciarAnuncio,
  editarAnuncio,
  excluirAnuncio,
  listarMeusAnuncios,
  obterMeuAnuncio,
  registrarVisualizacao,
} from './rotas/anuncios';
import { enviarArquivo, lerArquivo } from './rotas/arquivos';
import { listarSugestoesEndereco, obterEnderecoSugerido } from './rotas/enderecos';
import { obterEstatisticas } from './rotas/estatisticas';
import { listarVitrine, obterAnuncioPublico } from './rotas/vitrine';
import {
  ativarConta,
  cadastrar,
  entrar,
  reenviarAtivacao,
  recuperarSenha,
  redefinirSenha,
  renovarSessao,
  sair,
} from './rotas/auth';
import { atualizarMinhaConta, obterMinhaConta, obterPerfilPublico } from './rotas/perfil';

type Parametros = Record<string, string>;
type Manipulador = (request: Request, env: Env, parametros: Parametros, origem: string) => Promise<Response>;

interface Rota {
  metodo: string;
  partes: string[];
  manipulador: Manipulador;
}

// Roteador mínimo: "/anuncios/:id/status" casa segmento a segmento; ":nome" captura o valor.
function definirRota(metodo: string, caminho: string, manipulador: Manipulador): Rota {
  return { metodo, partes: caminho.split('/').filter(Boolean), manipulador };
}

function casarRota(rota: Rota, metodo: string, segmentos: string[]): Parametros | null {
  if (rota.metodo !== metodo || rota.partes.length !== segmentos.length) {
    return null;
  }
  const parametros: Parametros = {};
  for (let indice = 0; indice < rota.partes.length; indice += 1) {
    const parte = rota.partes[indice];
    if (parte.startsWith(':')) {
      parametros[parte.slice(1)] = decodeURIComponent(segmentos[indice]);
    } else if (parte !== segmentos[indice]) {
      return null;
    }
  }
  return parametros;
}

const rotas: Rota[] = [
  definirRota('GET', '/saude', async () => responderJson({ ok: true })),
  definirRota('GET', '/estatisticas', (_, env) => obterEstatisticas(env)),

  definirRota('POST', '/auth/cadastro', (request, env, _, origem) => cadastrar(request, env, origem)),
  definirRota('POST', '/auth/login', (request, env, _, origem) => entrar(request, env, origem)),
  definirRota('POST', '/auth/renovar', (request, env, _, origem) => renovarSessao(request, env, origem)),
  definirRota('POST', '/auth/sair', (request, env) => sair(request, env)),
  definirRota('POST', '/auth/ativar', (request, env) => ativarConta(request, env)),
  definirRota('POST', '/auth/reenviar-ativacao', (request, env) => reenviarAtivacao(request, env)),
  definirRota('POST', '/auth/recuperar', (request, env) => recuperarSenha(request, env)),
  definirRota('POST', '/auth/redefinir', (request, env) => redefinirSenha(request, env)),

  definirRota('GET', '/me', (request, env, _, origem) => obterMinhaConta(request, env, origem)),
  definirRota('PATCH', '/me', (request, env, _, origem) => atualizarMinhaConta(request, env, origem)),
  definirRota('GET', '/usuarios/:id', (_, env, { id }, origem) => obterPerfilPublico(env, id, origem)),

  definirRota('GET', '/enderecos/sugestoes', (request, env) => listarSugestoesEndereco(request, env)),
  definirRota('GET', '/enderecos/lugar/:id', (request, env, { id }) => obterEnderecoSugerido(request, env, id)),

  definirRota('POST', '/uploads', (request, env, _, origem) => enviarArquivo(request, env, origem)),

  definirRota('GET', '/meus-anuncios', (request, env, _, origem) => listarMeusAnuncios(request, env, origem)),
  definirRota('GET', '/meus-anuncios/:id', (request, env, { id }, origem) => obterMeuAnuncio(request, env, id, origem)),
  definirRota('GET', '/anuncios', (request, env, _, origem) => listarVitrine(request, env, origem)),
  definirRota('GET', '/anuncios/:id', (request, env, { id }, origem) => obterAnuncioPublico(request, env, id, origem)),
  definirRota('POST', '/anuncios', (request, env, _, origem) => criarAnuncio(request, env, origem)),
  definirRota('PUT', '/anuncios/:id', (request, env, { id }, origem) => editarAnuncio(request, env, id, origem)),
  definirRota('PATCH', '/anuncios/:id/status', (request, env, { id }, origem) => alterarStatusAnuncio(request, env, id, origem)),
  definirRota('DELETE', '/anuncios/:id', (request, env, { id }) => excluirAnuncio(request, env, id)),
  definirRota('POST', '/anuncios/:id/destaque', (request, env, { id }, origem) => contratarDestaque(request, env, id, origem)),
  definirRota('DELETE', '/anuncios/:id/destaque', (request, env, { id }, origem) => cancelarDestaque(request, env, id, origem)),
  definirRota('POST', '/anuncios/:id/denuncia', (request, env, { id }) => denunciarAnuncio(request, env, id)),
  definirRota('POST', '/anuncios/:id/visualizacao', (request, env, { id }) => registrarVisualizacao(request, env, id)),
];

async function tratarRequisicao(request: Request, env: Env) {
  const url = new URL(request.url);
  const origem = url.origin;

  if (request.method === 'GET' && url.pathname.startsWith('/arquivos/')) {
    return lerArquivo(env, decodeURIComponent(url.pathname.slice('/arquivos/'.length)));
  }

  const segmentos = url.pathname.split('/').filter(Boolean);
  for (const rota of rotas) {
    const parametros = casarRota(rota, request.method, segmentos);
    if (parametros) {
      return rota.manipulador(request, env, parametros, origem);
    }
  }

  throw new ErroApi(404, 'ROTA_INEXISTENTE', 'Recurso não encontrado.');
}

export default {
  async fetch(request, env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return aplicarCors(request, new Response(null, { status: 204 }), env.ORIGENS_PERMITIDAS);
    }

    let resposta: Response;
    try {
      resposta = await tratarRequisicao(request, env);
    } catch (erro) {
      if (erro instanceof ErroApi) {
        resposta = responderErro(erro);
      } else {
        console.error('Erro inesperado', erro);
        resposta = responderErro(new ErroApi(500, 'ERRO_INTERNO', 'Algo deu errado. Tente novamente.'));
      }
    }

    return aplicarCors(request, resposta, env.ORIGENS_PERMITIDAS);
  },
} satisfies ExportedHandler<Env>;
