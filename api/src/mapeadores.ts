import type { CategoriaId, CondicaoId, EntregaId, Modalidade, PlanoDestaqueId, StatusAnuncio } from '../../src/schemas/anuncio';
import type { ComplementoTrocaId, DestinoDoacaoId, TipoAnuncianteId } from '../../src/schemas/catalogo';
import type {
  AnuncioProprio,
  AnuncioResumo,
  Avaliacao,
  LocalizacaoPublica,
  PedidoDestaque,
  Selo,
  UsuarioPrivado,
  UsuarioPublico,
} from '../../src/types/api';
import { exigeConfirmacaoEmail, type Env } from './env';
import { agoraIso } from './http';

// Converte linhas do D1 nos contratos da API, separando dados públicos e privados.

export interface UsuarioRow {
  id: string;
  email: string;
  senha_hash: string;
  nome_completo: string;
  nome_publico: string;
  descricao: string;
  telefone: string;
  cpf_final: string;
  foto_chave: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  email_confirmado_em: string | null;
  tipo_conta: TipoAnuncianteId;
  latitude: number | null;
  longitude: number | null;
  tentativas_login: number;
  bloqueado_ate: string | null;
  criado_em: string;
}

export interface AnuncioRow {
  id: string;
  user_id: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaId;
  subcategoria: string;
  condicao: CondicaoId;
  modalidade: Modalidade;
  preco_centavos: number | null;
  aceita_ofertas: number;
  preferencia_troca: string | null;
  valor_estimado_centavos: number | null;
  troca_qualquer_categoria: number;
  troca_categorias: string;
  troca_complemento: ComplementoTrocaId | null;
  doacao_destino: DestinoDoacaoId | null;
  doacao_imediata: number;
  latitude: number | null;
  longitude: number | null;
  entregas: string;
  cep: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  status: StatusAnuncio;
  visualizacoes: number;
  contatos: number;
  destaque_ate: string | null;
  concluido_em: string | null;
  criado_em: string;
  atualizado_em: string;
}

interface ImagemRow {
  listing_id: string;
  chave: string;
}

interface PedidoRow {
  id: string;
  listing_id: string;
  plano: PlanoDestaqueId;
  status: PedidoDestaque['status'];
  criado_em: string;
}

// Campos de troca e doação comuns ao detalhe público e aos anúncios do próprio usuário.
export function mapearDetalhesTrocaDoacao(row: AnuncioRow) {
  return {
    preferenciaTroca: row.preferencia_troca,
    valorEstimadoCentavos: row.valor_estimado_centavos,
    trocaQualquerCategoria: row.troca_qualquer_categoria === 1,
    trocaCategorias: JSON.parse(row.troca_categorias) as CategoriaId[],
    trocaComplemento: row.troca_complemento,
    doacaoDestino: row.doacao_destino,
    doacaoImediata: row.doacao_imediata === 1,
  };
}

export function montarUrlArquivo(origem: string, chave: string | null) {
  return chave ? `${origem}/arquivos/${chave}` : null;
}

// Nome público padrão: primeiro nome + inicial do último sobrenome ("Maria S.").
export function gerarNomePublico(nomeCompleto: string) {
  const partes = nomeCompleto.trim().split(/\s+/);
  const ultimo = partes.length > 1 ? ` ${partes[partes.length - 1][0].toUpperCase()}.` : '';
  return `${partes[0]}${ultimo}`;
}

export function extrairLocalizacao(row: Pick<UsuarioRow, 'cep' | 'bairro' | 'cidade' | 'uf'>): LocalizacaoPublica | null {
  return row.cep && row.bairro && row.cidade && row.uf
    ? { cep: row.cep, bairro: row.bairro, cidade: row.cidade, uf: row.uf }
    : null;
}

export function mapearUsuarioPrivado(row: UsuarioRow, origem: string, env: Env): UsuarioPrivado {
  const localizacao = extrairLocalizacao(row);
  return {
    id: row.id,
    email: row.email,
    emailConfirmado: row.email_confirmado_em !== null,
    exigeConfirmacaoEmail: exigeConfirmacaoEmail(env),
    nomeCompleto: row.nome_completo,
    nomePublico: row.nome_publico,
    tipoConta: row.tipo_conta,
    fotoUrl: montarUrlArquivo(origem, row.foto_chave),
    descricao: row.descricao,
    telefone: row.telefone,
    cpfMascarado: `***.***.***-${row.cpf_final}`,
    endereco: localizacao
      ? { ...localizacao, logradouro: row.logradouro ?? '', numero: row.numero ?? '', complemento: row.complemento ?? '' }
      : null,
    criadoEm: row.criado_em,
  };
}

export async function buscarUsuario(env: Env, userId: string) {
  return env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UsuarioRow>();
}

export function estaEmDestaque(row: Pick<AnuncioRow, 'destaque_ate'>) {
  return row.destaque_ate !== null && row.destaque_ate > agoraIso();
}

// Selos com critérios objetivos e verificáveis pelo sistema, nunca atribuídos manualmente.
function calcularSelos(usuario: UsuarioRow, concluidas: number, media: number | null, totalAvaliacoes: number): Selo[] {
  const selos: Selo[] = [];
  const seisMesesAtras = new Date(Date.now() - 182 * 24 * 60 * 60_000).toISOString();

  if (usuario.email_confirmado_em) {
    selos.push({ id: 'email', label: 'E-mail confirmado', descricao: 'Confirmou o e-mail pelo link de ativação.' });
  }
  if (usuario.foto_chave) {
    selos.push({ id: 'foto', label: 'Foto de rosto', descricao: 'Tem foto de rosto para identificação na entrega.' });
  }
  if (concluidas >= 1) {
    selos.push({ id: 'primeira', label: 'Primeira operação', descricao: 'Concluiu pelo menos uma venda, troca ou doação.' });
  }
  if (concluidas >= 10) {
    selos.push({ id: 'experiente', label: 'Experiente', descricao: 'Concluiu 10 ou mais operações.' });
  }
  if (media !== null && media >= 4.5 && totalAvaliacoes >= 5) {
    selos.push({ id: 'bem-avaliado', label: 'Bem avaliado', descricao: 'Média 4,5 ou mais em pelo menos 5 avaliações.' });
  }
  if (usuario.criado_em < seisMesesAtras) {
    selos.push({ id: 'veterano', label: 'Membro há 6 meses', descricao: 'Conta criada há mais de seis meses.' });
  }
  return selos;
}

export async function carregarUsuarioPublico(env: Env, userId: string, origem: string): Promise<UsuarioPublico | null> {
  const usuario = await buscarUsuario(env, userId);
  if (!usuario) {
    return null;
  }

  const [resumoAvaliacoes, ultimas, impactoRows, anuncios] = await env.DB.batch([
    env.DB.prepare('SELECT AVG(nota) AS media, COUNT(*) AS total FROM ratings WHERE avaliado_id = ?').bind(userId),
    env.DB.prepare(
      `SELECT r.id, r.nota, r.comentario, r.criado_em, u.nome_publico AS autor_nome
       FROM ratings r JOIN users u ON u.id = r.autor_id
       WHERE r.avaliado_id = ? ORDER BY r.criado_em DESC LIMIT 5`,
    ).bind(userId),
    env.DB.prepare(
      "SELECT modalidade, COUNT(*) AS total FROM listings WHERE user_id = ? AND concluido_em IS NOT NULL GROUP BY modalidade",
    ).bind(userId),
    env.DB.prepare(
      `SELECT l.*, (SELECT chave FROM listing_images i WHERE i.listing_id = l.id ORDER BY ordem LIMIT 1) AS capa
       FROM listings l WHERE l.user_id = ? AND l.status IN ('disponivel', 'reservado', 'negociando')
       ORDER BY l.atualizado_em DESC LIMIT 20`,
    ).bind(userId),
  ]);

  const resumo = (resumoAvaliacoes.results[0] ?? { media: null, total: 0 }) as { media: number | null; total: number };
  const media = resumo.media === null ? null : Math.round(resumo.media * 10) / 10;

  const porModalidade = Object.fromEntries(
    (impactoRows.results as { modalidade: Modalidade; total: number }[]).map((linha) => [linha.modalidade, linha.total]),
  ) as Partial<Record<Modalidade, number>>;
  const impacto = {
    vendas: porModalidade.venda ?? 0,
    trocas: porModalidade.troca ?? 0,
    doacoes: porModalidade.doacao ?? 0,
    itensReutilizados: (porModalidade.venda ?? 0) + (porModalidade.troca ?? 0) + (porModalidade.doacao ?? 0),
  };

  const avaliacoes: Avaliacao[] = (
    ultimas.results as { id: string; nota: number; comentario: string | null; criado_em: string; autor_nome: string }[]
  ).map((linha) => ({
    id: linha.id,
    nota: linha.nota,
    comentario: linha.comentario,
    autorNome: linha.autor_nome,
    criadoEm: linha.criado_em,
  }));

  const anunciosAtivos: AnuncioResumo[] = (anuncios.results as (AnuncioRow & { capa: string | null })[]).map((row) => ({
    id: row.id,
    titulo: row.titulo,
    modalidade: row.modalidade,
    precoCentavos: row.preco_centavos,
    capaUrl: montarUrlArquivo(origem, row.capa),
    status: row.status,
    localizacao: extrairLocalizacao(row),
    emDestaque: estaEmDestaque(row),
  }));

  return {
    id: usuario.id,
    nomePublico: usuario.nome_publico,
    tipoConta: usuario.tipo_conta,
    fotoUrl: montarUrlArquivo(origem, usuario.foto_chave),
    descricao: usuario.descricao,
    localizacao: extrairLocalizacao(usuario),
    membroDesde: usuario.criado_em,
    emailConfirmado: usuario.email_confirmado_em !== null,
    reputacao: { media, total: resumo.total, ultimas: avaliacoes },
    selos: calcularSelos(usuario, impacto.itensReutilizados, media, resumo.total),
    impacto,
    anunciosAtivos,
  };
}

// Anúncios do próprio usuário com imagens, métricas e pedido de destaque pendente.
export async function carregarAnunciosProprios(env: Env, userId: string, origem: string, anuncioId?: string) {
  const filtro = anuncioId ? 'AND l.id = ?' : '';
  const parametros = anuncioId ? [userId, anuncioId] : [userId];

  const [anuncios, imagens, pedidos] = await env.DB.batch([
    env.DB.prepare(`SELECT l.* FROM listings l WHERE l.user_id = ? ${filtro} ORDER BY l.atualizado_em DESC`).bind(...parametros),
    env.DB.prepare(
      `SELECT i.listing_id, i.chave FROM listing_images i JOIN listings l ON l.id = i.listing_id
       WHERE l.user_id = ? ${filtro} ORDER BY i.ordem`,
    ).bind(...parametros),
    env.DB.prepare(
      `SELECT h.id, h.listing_id, h.plano, h.status, h.criado_em FROM highlight_orders h
       WHERE h.user_id = ? AND h.status = 'aguardando_pagamento' ${anuncioId ? 'AND h.listing_id = ?' : ''}
       ORDER BY h.criado_em DESC`,
    ).bind(...parametros),
  ]);

  const imagensPorAnuncio = new Map<string, ImagemRow[]>();
  for (const imagem of imagens.results as ImagemRow[]) {
    imagensPorAnuncio.set(imagem.listing_id, [...(imagensPorAnuncio.get(imagem.listing_id) ?? []), imagem]);
  }

  const pedidoPorAnuncio = new Map<string, PedidoRow>();
  for (const pedido of pedidos.results as PedidoRow[]) {
    if (!pedidoPorAnuncio.has(pedido.listing_id)) {
      pedidoPorAnuncio.set(pedido.listing_id, pedido);
    }
  }

  return (anuncios.results as AnuncioRow[]).map((row): AnuncioProprio => {
    const pedido = pedidoPorAnuncio.get(row.id);
    return {
      id: row.id,
      titulo: row.titulo,
      descricao: row.descricao,
      categoria: row.categoria,
      subcategoria: row.subcategoria,
      condicao: row.condicao,
      modalidade: row.modalidade,
      precoCentavos: row.preco_centavos,
      aceitaOfertas: row.aceita_ofertas === 1,
      ...mapearDetalhesTrocaDoacao(row),
      entregas: JSON.parse(row.entregas) as EntregaId[],
      localizacao: extrairLocalizacao(row),
      status: row.status,
      imagens: (imagensPorAnuncio.get(row.id) ?? []).map((imagem) => ({
        chave: imagem.chave,
        url: montarUrlArquivo(origem, imagem.chave) ?? '',
      })),
      visualizacoes: row.visualizacoes,
      contatos: row.contatos,
      destaqueAte: estaEmDestaque(row) ? row.destaque_ate : null,
      pedidoDestaque: pedido
        ? { id: pedido.id, plano: pedido.plano, status: pedido.status, criadoEm: pedido.criado_em }
        : null,
      jaConcluido: row.concluido_em !== null,
      criadoEm: row.criado_em,
      atualizadoEm: row.atualizado_em,
    };
  });
}
