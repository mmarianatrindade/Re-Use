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

  const partes: Uint8Array[] = [];
  const leitor = request.body?.getReader();
  let tamanho = 0;
  if (leitor) {
    try {
      while (true) {
        const parte = await leitor.read();
        if (parte.done) break;
        tamanho += parte.value.byteLength;
        if (tamanho > TAMANHO_MAXIMO) {
          await leitor.cancel();
          throw new ErroApi(413, 'ARQUIVO_GRANDE', MENSAGEM_TAMANHO);
        }
        partes.push(parte.value);
      }
    } finally {
      leitor.releaseLock();
    }
  }
  const conteudo = new Uint8Array(tamanho);
  let deslocamento = 0;
  for (const parte of partes) { conteudo.set(parte, deslocamento); deslocamento += parte.byteLength; }
  const bytes = conteudo.buffer;
  if (bytes.byteLength === 0) {
    throw new ErroApi(400, 'ARQUIVO_VAZIO', 'Imagem vazia.');
  }
  if (bytes.byteLength > TAMANHO_MAXIMO) {
    throw new ErroApi(413, 'ARQUIVO_GRANDE', MENSAGEM_TAMANHO);
  }
  if (!imagemValida(conteudo, contentType)) throw new ErroApi(415, 'FORMATO_INVALIDO', 'O arquivo não contém uma imagem JPG, PNG ou WebP válida.');

  const chave = `${prefixoDoUsuario(sessao.userId, tipo)}${gerarId()}.${extensao}`;
  const resultado = await env.DB.prepare(`INSERT INTO arquivos (chave, user_id, content_type, tamanho, dados, criado_em)
    SELECT ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM arquivos WHERE user_id = ?) < 100
    AND (SELECT COALESCE(SUM(tamanho), 0) FROM arquivos WHERE user_id = ?) + ? <= 52428800`)
    .bind(chave, sessao.userId, contentType, bytes.byteLength, bytes, agoraIso(), sessao.userId, sessao.userId, bytes.byteLength)
    .run();
  if (resultado.meta.changes !== 1) throw new ErroApi(429, 'COTA_ARQUIVOS', 'O limite de imagens desta conta foi atingido. Remova imagens sem uso antes de enviar outras.');

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
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(bytes, { headers });
}

export async function removerArquivos(env: Env, chaves: string[]) {
  if (chaves.length > 0) {
    await env.DB.prepare(`DELETE FROM arquivos WHERE chave IN (${chaves.map(() => '?').join(', ')})`)
      .bind(...chaves)
      .run();
  }
}

function imagemValida(bytes: Uint8Array, tipo: string) {
  if (tipo === 'image/jpeg') return bytes.length > 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217;
  if (tipo === 'image/png') return bytes.length >= 33 && [137, 80, 78, 71, 13, 10, 26, 10].every((valor, indice) => bytes[indice] === valor) && String.fromCharCode(...bytes.slice(12, 16)) === 'IHDR';
  return tipo === 'image/webp' && bytes.length >= 20 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP' && ['VP8 ', 'VP8L', 'VP8X'].includes(String.fromCharCode(...bytes.slice(12, 16)));
}
