import {
  PLANOS_DESTAQUE,
  STATUS_EDITAVEIS,
  STATUS_EXCLUIVEIS,
  TRANSICOES_STATUS,
  alterarStatusApiSchema,
  anuncioApiSchema,
  denunciaApiSchema,
  destaqueApiSchema,
  exigeLocalizacao,
} from '../../../src/schemas/anuncio';
import type { z } from 'zod';
import type { MensagemResposta } from '../../../src/types/api';
import { gerarId } from '../cripto';
import { geocodificarCep } from '../geo';
import { exigeConfirmacaoEmail, type Env } from '../env';
import { ErroApi, agoraIso, lerCorpo, responderJson } from '../http';
import { buscarUsuario, carregarAnunciosProprios, type AnuncioRow, type UsuarioRow } from '../mapeadores';
import { buscarSessao, exigirSessao } from '../sessao';
import { arquivoPertenceAoUsuario, removerArquivos } from './arquivos';

// Publicar exige e-mail confirmado e foto de rosto (identificação na entrega de trocas e doações).
function verificarPodePublicar(usuario: UsuarioRow, env: Env) {
  if (exigeConfirmacaoEmail(env) && !usuario.email_confirmado_em) {
    throw new ErroApi(403, 'EMAIL_NAO_CONFIRMADO', 'Confirme seu e-mail para publicar itens.');
  }
  if (!usuario.foto_chave) {
    throw new ErroApi(403, 'FOTO_OBRIGATORIA', 'Adicione uma foto do rosto ao seu perfil para publicar itens.');
  }
}

async function buscarAnuncioDoUsuario(env: Env, anuncioId: string, userId: string) {
  const anuncio = await env.DB.prepare('SELECT * FROM listings WHERE id = ?').bind(anuncioId).first<AnuncioRow>();
  // Anúncio de outra pessoa responde como inexistente, para não revelar ids.
  if (!anuncio || anuncio.user_id !== userId) {
    throw new ErroApi(404, 'NAO_ENCONTRADO', 'Anúncio não encontrado.');
  }
  return anuncio;
}

async function validarImagens(env: Env, chaves: string[], userId: string) {
  for (const chave of chaves) {
    if (!(await arquivoPertenceAoUsuario(env, chave, userId, 'anuncio'))) {
      throw new ErroApi(422, 'FOTO_INVALIDA', 'Uma das fotos não foi encontrada. Envie novamente.', {
        imagens: 'Foto não encontrada.',
      });
    }
  }
}

// Localização pública (CEP, bairro, cidade, UF) e ponto aproximado copiados do perfil: permitem filtrar por
// cidade, estado e distância. Endereço é obrigatório quando a entrega parte do anunciante.
async function montarLocalizacao(env: Env, usuario: UsuarioRow, entregas: string[]) {
  if (!usuario.cep || !usuario.bairro || !usuario.cidade || !usuario.uf) {
    if (exigeLocalizacao(entregas)) {
      throw new ErroApi(422, 'ENDERECO_OBRIGATORIO', 'Cadastre seu endereço no perfil para usar retirada, Correios ou transportadora.', {
        entregas: 'Cadastre seu endereço no perfil.',
      });
    }
    return { cep: null, bairro: null, cidade: null, uf: null, latitude: null, longitude: null };
  }

  let latitude = usuario.latitude;
  let longitude = usuario.longitude;
  // Contas criadas antes do filtro por distância: calcula o ponto agora e guarda no perfil.
  if (latitude === null || longitude === null) {
    const coordenadas = await geocodificarCep(usuario.cep, env.GOOGLE_PLACES_API_KEY);
    if (coordenadas) {
      latitude = coordenadas.latitude;
      longitude = coordenadas.longitude;
      await env.DB.prepare('UPDATE users SET latitude = ?, longitude = ? WHERE id = ?').bind(latitude, longitude, usuario.id).run();
    }
  }
  return { cep: usuario.cep, bairro: usuario.bairro, cidade: usuario.cidade, uf: usuario.uf, latitude, longitude };
}

type Localizacao = Awaited<ReturnType<typeof montarLocalizacao>>;

// Colunas gravadas na criação e na edição (mesma ordem de COLUNAS_ANUNCIO).
const COLUNAS_ANUNCIO = [
  'titulo', 'descricao', 'categoria', 'subcategoria', 'condicao', 'modalidade', 'preco_centavos', 'aceita_ofertas',
  'preferencia_troca', 'valor_estimado_centavos', 'troca_qualquer_categoria', 'troca_categorias', 'troca_complemento',
  'doacao_destino', 'doacao_imediata', 'entregas', 'cep', 'bairro', 'cidade', 'uf', 'latitude', 'longitude',
];

function montarValoresAnuncio(dados: z.output<typeof anuncioApiSchema>, local: Localizacao) {
  const troca = dados.modalidade === 'troca';
  const doacao = dados.modalidade === 'doacao';
  return [
    dados.titulo,
    dados.descricao,
    dados.categoria,
    dados.subcategoria,
    dados.condicao,
    dados.modalidade,
    dados.precoCentavos,
    dados.modalidade === 'venda' && dados.aceitaOfertas ? 1 : 0,
    troca ? dados.preferenciaTroca : null,
    troca ? dados.valorEstimadoCentavos : null,
    troca && dados.trocaQualquerCategoria ? 1 : 0,
    JSON.stringify(troca ? dados.trocaCategorias : []),
    troca ? dados.trocaComplemento : null,
    doacao ? dados.doacaoDestino : null,
    doacao && dados.doacaoImediata ? 1 : 0,
    JSON.stringify(dados.entregas),
    local.cep,
    local.bairro,
    local.cidade,
    local.uf,
    local.latitude,
    local.longitude,
  ];
}

async function responderAnuncio(env: Env, userId: string, anuncioId: string, origem: string, status = 200) {
  const [anuncio] = await carregarAnunciosProprios(env, userId, origem, anuncioId);
  return responderJson(anuncio, status);
}

export async function listarMeusAnuncios(request: Request, env: Env, origem: string) {
  const sessao = await exigirSessao(env, request);
  return responderJson(await carregarAnunciosProprios(env, sessao.userId, origem));
}

export async function obterMeuAnuncio(request: Request, env: Env, anuncioId: string, origem: string) {
  const sessao = await exigirSessao(env, request);
  await buscarAnuncioDoUsuario(env, anuncioId, sessao.userId);
  return responderAnuncio(env, sessao.userId, anuncioId, origem);
}

export async function criarAnuncio(request: Request, env: Env, origem: string) {
  const sessao = await exigirSessao(env, request);
  const usuario = await buscarUsuario(env, sessao.userId);
  if (!usuario) {
    throw new ErroApi(401, 'SESSAO_INVALIDA', 'Sua sessão expirou. Entre novamente.');
  }
  verificarPodePublicar(usuario, env);

  const dados = await lerCorpo(request, anuncioApiSchema);
  await validarImagens(env, dados.imagens, usuario.id);
  const local = await montarLocalizacao(env, usuario, dados.entregas);

  const anuncioId = gerarId();
  const agora = agoraIso();
  const colunas = ['id', 'user_id', ...COLUNAS_ANUNCIO, 'criado_em', 'atualizado_em'];
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO listings (${colunas.join(', ')}) VALUES (${colunas.map(() => '?').join(', ')})`).bind(
      anuncioId,
      usuario.id,
      ...montarValoresAnuncio(dados, local),
      agora,
      agora,
    ),
    ...dados.imagens.map((chave, ordem) =>
      env.DB.prepare('INSERT INTO listing_images (id, listing_id, chave, ordem) VALUES (?, ?, ?, ?)').bind(
        gerarId(),
        anuncioId,
        chave,
        ordem,
      ),
    ),
  ]);

  return responderAnuncio(env, usuario.id, anuncioId, origem, 201);
}

export async function editarAnuncio(request: Request, env: Env, anuncioId: string, origem: string) {
  const sessao = await exigirSessao(env, request);
  const anuncio = await buscarAnuncioDoUsuario(env, anuncioId, sessao.userId);
  // Um item concluído e depois arquivado continua congelado: o histórico reflete o que foi negociado.
  if (!STATUS_EDITAVEIS.includes(anuncio.status) || anuncio.concluido_em) {
    throw new ErroApi(409, 'NAO_EDITAVEL', 'Anúncios reservados, em negociação ou concluídos não podem ser editados.');
  }

  const usuario = await buscarUsuario(env, sessao.userId);
  if (!usuario) {
    throw new ErroApi(401, 'SESSAO_INVALIDA', 'Sua sessão expirou. Entre novamente.');
  }

  const dados = await lerCorpo(request, anuncioApiSchema);
  await validarImagens(env, dados.imagens, usuario.id);
  const local = await montarLocalizacao(env, usuario, dados.entregas);

  const anteriores = await env.DB.prepare('SELECT chave FROM listing_images WHERE listing_id = ?')
    .bind(anuncioId)
    .all<{ chave: string }>();
  const removidas = anteriores.results.map((linha) => linha.chave).filter((chave) => !dados.imagens.includes(chave));

  await env.DB.batch([
    env.DB.prepare(
      `UPDATE listings SET ${COLUNAS_ANUNCIO.map((coluna) => `${coluna} = ?`).join(', ')}, atualizado_em = ? WHERE id = ?`,
    ).bind(...montarValoresAnuncio(dados, local), agoraIso(), anuncioId),
    env.DB.prepare('DELETE FROM listing_images WHERE listing_id = ?').bind(anuncioId),
    ...dados.imagens.map((chave, ordem) =>
      env.DB.prepare('INSERT INTO listing_images (id, listing_id, chave, ordem) VALUES (?, ?, ?, ?)').bind(
        gerarId(),
        anuncioId,
        chave,
        ordem,
      ),
    ),
  ]);

  await removerArquivos(env, removidas);
  return responderAnuncio(env, sessao.userId, anuncioId, origem);
}

export async function alterarStatusAnuncio(request: Request, env: Env, anuncioId: string, origem: string) {
  const sessao = await exigirSessao(env, request);
  const anuncio = await buscarAnuncioDoUsuario(env, anuncioId, sessao.userId);
  const { status } = await lerCorpo(request, alterarStatusApiSchema);

  if (status === anuncio.status) {
    return responderAnuncio(env, sessao.userId, anuncioId, origem);
  }
  if (!TRANSICOES_STATUS[anuncio.status].includes(status)) {
    throw new ErroApi(409, 'TRANSICAO_INVALIDA', 'Esta mudança de status não é permitida.');
  }
  if (anuncio.status === 'arquivado' && status === 'disponivel' && anuncio.concluido_em) {
    throw new ErroApi(409, 'JA_CONCLUIDO', 'Um item já concluído fica arquivado para preservar o histórico.');
  }

  const agora = agoraIso();
  await env.DB.prepare(
    'UPDATE listings SET status = ?, concluido_em = CASE WHEN ? = \'concluido\' THEN ? ELSE concluido_em END, atualizado_em = ? WHERE id = ?',
  )
    .bind(status, status, agora, agora, anuncioId)
    .run();

  return responderAnuncio(env, sessao.userId, anuncioId, origem);
}

export async function excluirAnuncio(request: Request, env: Env, anuncioId: string) {
  const sessao = await exigirSessao(env, request);
  const anuncio = await buscarAnuncioDoUsuario(env, anuncioId, sessao.userId);

  if (!STATUS_EXCLUIVEIS.includes(anuncio.status) || anuncio.concluido_em) {
    throw new ErroApi(
      409,
      'NAO_EXCLUIVEL',
      anuncio.concluido_em
        ? 'Itens concluídos não podem ser excluídos: arquive para tirar da busca e manter o histórico.'
        : 'Com reserva ou negociação em andamento, volte o anúncio para disponível ou arquive.',
    );
  }

  const imagens = await env.DB.prepare('SELECT chave FROM listing_images WHERE listing_id = ?')
    .bind(anuncioId)
    .all<{ chave: string }>();
  await env.DB.prepare('DELETE FROM listings WHERE id = ?').bind(anuncioId).run();
  await removerArquivos(env, imagens.results.map((linha) => linha.chave));

  const resposta: MensagemResposta = { mensagem: 'Anúncio excluído.' };
  return responderJson(resposta);
}

// Registra o pedido de destaque. A ativação depende da confirmação de pagamento (integração da Fase 6).
export async function contratarDestaque(request: Request, env: Env, anuncioId: string, origem: string) {
  const sessao = await exigirSessao(env, request);
  const anuncio = await buscarAnuncioDoUsuario(env, anuncioId, sessao.userId);
  const { plano: planoId } = await lerCorpo(request, destaqueApiSchema);

  if (anuncio.status !== 'disponivel') {
    throw new ErroApi(409, 'NAO_DISPONIVEL', 'Só anúncios disponíveis podem ser destacados.');
  }

  const pendente = await env.DB.prepare(
    "SELECT 1 FROM highlight_orders WHERE listing_id = ? AND status = 'aguardando_pagamento' LIMIT 1",
  )
    .bind(anuncioId)
    .first();
  if (pendente) {
    throw new ErroApi(409, 'PEDIDO_PENDENTE', 'Já existe um pedido de destaque aguardando pagamento para este anúncio.');
  }

  const plano = PLANOS_DESTAQUE.find((opcao) => opcao.id === planoId);
  if (!plano) {
    throw new ErroApi(422, 'PLANO_INVALIDO', 'Plano inválido.');
  }

  await env.DB.prepare(
    'INSERT INTO highlight_orders (id, listing_id, user_id, plano, dias, preco_centavos, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(gerarId(), anuncioId, sessao.userId, plano.id, plano.dias, plano.precoCentavos, agoraIso())
    .run();

  return responderAnuncio(env, sessao.userId, anuncioId, origem, 201);
}

export async function cancelarDestaque(request: Request, env: Env, anuncioId: string, origem: string) {
  const sessao = await exigirSessao(env, request);
  await buscarAnuncioDoUsuario(env, anuncioId, sessao.userId);
  await env.DB.prepare(
    "UPDATE highlight_orders SET status = 'cancelado' WHERE listing_id = ? AND status = 'aguardando_pagamento'",
  )
    .bind(anuncioId)
    .run();
  return responderAnuncio(env, sessao.userId, anuncioId, origem);
}

// Visualização pública de um anúncio (base da tela de detalhe). Conta visualizações de quem não é o dono.
export async function registrarVisualizacao(request: Request, env: Env, anuncioId: string) {
  const anuncio = await env.DB.prepare("SELECT user_id FROM listings WHERE id = ? AND status <> 'arquivado'")
    .bind(anuncioId)
    .first<{ user_id: string }>();
  if (!anuncio) {
    throw new ErroApi(404, 'NAO_ENCONTRADO', 'Anúncio não encontrado.');
  }

  const sessao = await buscarSessao(env, request);
  if (sessao?.userId !== anuncio.user_id) {
    await env.DB.prepare('UPDATE listings SET visualizacoes = visualizacoes + 1 WHERE id = ?').bind(anuncioId).run();
  }

  const resposta: MensagemResposta = { mensagem: 'ok' };
  return responderJson(resposta);
}

// POST /anuncios/:id/denuncia — uma por pessoa e anúncio; a análise é feita pela moderação.
export async function denunciarAnuncio(request: Request, env: Env, anuncioId: string) {
  const sessao = await exigirSessao(env, request);
  const { motivo, detalhes } = await lerCorpo(request, denunciaApiSchema);
  const anuncio = await env.DB.prepare('SELECT user_id FROM listings WHERE id = ?').bind(anuncioId).first<{ user_id: string }>();
  if (!anuncio) {
    throw new ErroApi(404, 'NAO_ENCONTRADO', 'Anúncio não encontrado.');
  }
  if (anuncio.user_id === sessao.userId) {
    throw new ErroApi(409, 'PROPRIO_ANUNCIO', 'Você não pode denunciar o próprio anúncio.');
  }

  await env.DB.prepare(
    `INSERT INTO reports (id, listing_id, autor_id, motivo, detalhes, criado_em) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (listing_id, autor_id) DO UPDATE SET motivo = excluded.motivo, detalhes = excluded.detalhes, criado_em = excluded.criado_em`,
  )
    .bind(gerarId(), anuncioId, sessao.userId, motivo, detalhes || null, agoraIso())
    .run();

  const resposta: MensagemResposta = { mensagem: 'Denúncia enviada. A moderação vai analisar o anúncio.' };
  return responderJson(resposta, 201);
}
