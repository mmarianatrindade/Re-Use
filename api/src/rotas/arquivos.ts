import type { UploadResposta } from '../../../src/types/api';
import { gerarId } from '../cripto';
import type { Env } from '../env';
import { ErroApi, agoraIso, responderJson } from '../http';
import { montarUrlArquivo } from '../mapeadores';
import { exigirSessao } from '../sessao';

// Fotos ficam na tabela `arquivos` do D1 (app de teste, sem R2). O D1 aceita até 2 MB por linha;
// o app já envia as fotos redimensionadas (1600 px, JPEG), bem abaixo deste limite.
const TAMANHO_MAXIMO = 1.5 * 1024 * 1024;
const MENSAGEM_TAMANHO = 'A imagem pode ter no máximo 1,5 MB.';

const EXTENSOES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

type TipoUpload = 'perfil' | 'anuncio';

// Toda chave de arquivo começa pelo dono: é assim que a API confere a posse ao vincular uma foto.
export function prefixoDoUsuario(userId: string, tipo: TipoUpload) {
  return `usuarios/${userId}/${tipo}/`;
}

export async function arquivoPertenceAoUsuario(env: Env, chave: string, userId: string, tipo: TipoUpload) {
  if (!chave.startsWith(prefixoDoUsuario(userId, tipo)) || chave.includes('..')) {
    return false;
  }
  return (await env.DB.prepare('SELECT 1 FROM arquivos WHERE chave = ?').bind(chave).first()) !== null;
}

// POST /uploads?tipo=perfil|anuncio — corpo: bytes da imagem, com Content-Type da imagem.
export async function enviarArquivo(request: Request, env: Env, origem: string) {
  const sessao = await exigirSessao(env, request);
  const tipo = new URL(request.url).searchParams.get('tipo');
  if (tipo !== 'perfil' && tipo !== 'anuncio') {
    throw new ErroApi(400, 'TIPO_INVALIDO', 'Tipo de upload inválido.');
  }

  const contentType = (request.headers.get('Content-Type') ?? '').split(';')[0].trim();
  const extensao = EXTENSOES[contentType];
  if (!extensao) {
    throw new ErroApi(415, 'FORMATO_INVALIDO', 'Envie uma imagem JPG, PNG ou WebP.');
  }

  const declarado = Number(request.headers.get('Content-Length') ?? '0');
  if (declarado > TAMANHO_MAXIMO) {
    throw new ErroApi(413, 'ARQUIVO_GRANDE', MENSAGEM_TAMANHO);
  }

  const bytes = await request.arrayBuffer();
  if (bytes.byteLength === 0) {
    throw new ErroApi(400, 'ARQUIVO_VAZIO', 'Imagem vazia.');
  }
  if (bytes.byteLength > TAMANHO_MAXIMO) {
    throw new ErroApi(413, 'ARQUIVO_GRANDE', MENSAGEM_TAMANHO);
  }

  const chave = `${prefixoDoUsuario(sessao.userId, tipo)}${gerarId()}.${extensao}`;
  await env.DB.prepare('INSERT INTO arquivos (chave, user_id, content_type, tamanho, dados, criado_em) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(chave, sessao.userId, contentType, bytes.byteLength, bytes, agoraIso())
    .run();

  const resposta: UploadResposta = { chave, url: montarUrlArquivo(origem, chave) ?? '' };
  return responderJson(resposta, 201);
}

// GET /arquivos/<chave> — imagens públicas (fotos de perfil e de anúncios).
export async function lerArquivo(env: Env, chave: string) {
  const arquivo = await env.DB.prepare('SELECT content_type, dados FROM arquivos WHERE chave = ?')
    .bind(chave)
    .first<{ content_type: string; dados: ArrayBuffer | number[] }>();
  if (!arquivo) {
    throw new ErroApi(404, 'NAO_ENCONTRADO', 'Arquivo não encontrado.');
  }

  // O D1 pode devolver BLOB como ArrayBuffer ou como lista de bytes; Uint8Array aceita os dois.
  const bytes = arquivo.dados instanceof ArrayBuffer ? new Uint8Array(arquivo.dados) : Uint8Array.from(arquivo.dados);
  const headers = new Headers({ 'Content-Type': arquivo.content_type, 'Content-Length': String(bytes.byteLength) });
  // As chaves são únicas (UUID): o conteúdo de uma URL nunca muda.
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('Access-Control-Allow-Origin', '*');
  return new Response(bytes, { headers });
}

export async function removerArquivos(env: Env, chaves: string[]) {
  if (chaves.length > 0) {
    await env.DB.prepare(`DELETE FROM arquivos WHERE chave IN (${chaves.map(() => '?').join(', ')})`)
      .bind(...chaves)
      .run();
  }
}
