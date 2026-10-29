import { MODALIDADES } from '../../../src/schemas/anuncio';
import { CATEGORIA_IDS, CONDICAO_IDS, ENTREGA_IDS, TIPO_ANUNCIANTE_IDS, encontrarCategoria } from '../../../src/schemas/catalogo';
import type { AnuncioPublico, AnuncioVitrine, PaginaVitrine } from '../../../src/types/api';
import type { Env } from '../env';
import { calcularCaixa, calcularDistanciaKm, type Coordenadas } from '../geo';
import { ErroApi, agoraIso, responderJson } from '../http';
import {
  estaEmDestaque,
  extrairLocalizacao,
  mapearDetalhesTrocaDoacao,
  montarUrlArquivo,
  type AnuncioRow,
} from '../mapeadores';
import { buscarSessao } from '../sessao';

// Vitrine pública (aba Anúncios): só itens disponíveis; destaques ativos primeiro, depois os mais recentes
// (ou os mais próximos, quando a pessoa informa a localização).
const POR_PAGINA = 20;
// Com filtro/ordem por distância a paginação é feita depois do cálculo exato, sobre até este número de candidatos.
const LIMITE_CANDIDATOS = 500;

// Escapa % e _ para a busca por texto com LIKE tratar o termo literalmente.
function escaparLike(termo: string) {
  return `%${termo.replace(/[\\%_]/g, (caractere) => `\\${caractere}`)}%`;
}

function lerLista(parametros: URLSearchParams, nome: string, permitidos: readonly string[]) {
  return (parametros.get(nome) ?? '')
    .split(',')
    .map((valor) => valor.trim())
    .filter((valor) => permitidos.includes(valor));
}

function lerNumero(parametros: URLSearchParams, nome: string) {
  const valor = parametros.get(nome);
  if (valor === null || valor === '') {
    return null;
  }
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function lerTexto(parametros: URLSearchParams, nome: string) {
  return (parametros.get(nome) ?? '').trim().slice(0, 80);
}

type LinhaVitrine = AnuncioRow & { capa: string | null };

/*
 * GET /anuncios — parâmetros (todos opcionais):
 * modalidade, categoria, subcategoria, condicoes (lista), precoMin/precoMax (centavos, venda ou valor estimado da troca),
 * gratis=1 (doações), q (texto), lat/lng + raioKm, cidade, uf, ordenar=recentes|proximos, entregas (lista, qualquer uma),
 * variasEntregas=1, trocaQualquer=1, trocaCategoria, complemento=aceita|nao_aceita, tenho (texto), procuro (texto),
 * destino=organizacoes|pessoas, imediata=1, precisaRetirar=1, possuiEntrega=1, pontoReuse=1, anunciantes (lista), pagina.
 */
export async function listarVitrine(request: Request, env: Env, origem: string) {
  const p = new URL(request.url).searchParams;
  const condicoes = ["l.status = 'disponivel'"];
  const valores: (string | number)[] = [];
  const adicionar = (sql: string, ...parametros: (string | number)[]) => {
    condicoes.push(sql);
    valores.push(...parametros);
  };

  let modalidade = p.get('modalidade');
  // Filtros específicos de troca ou de doação implicam a modalidade.
  const filtrosTroca = ['trocaQualquer', 'trocaCategoria', 'complemento', 'tenho'].some((nome) => p.get(nome));
  const filtrosDoacao = ['destino', 'imediata'].some((nome) => p.get(nome)) || p.get('gratis') === '1';
  if (filtrosTroca) modalidade = 'troca';
  if (filtrosDoacao) modalidade = 'doacao';
  if (modalidade && (MODALIDADES as readonly string[]).includes(modalidade)) {
    adicionar('l.modalidade = ?', modalidade);
  }

  const categoria = p.get('categoria');
  if (categoria && CATEGORIA_IDS.includes(categoria)) {
    adicionar('l.categoria = ?', categoria);
    const subcategoria = p.get('subcategoria');
    if (subcategoria && encontrarCategoria(categoria)?.subcategorias.some((sub) => sub.id === subcategoria)) {
      adicionar('l.subcategoria = ?', subcategoria);
    }
  }

  const estados = lerLista(p, 'condicoes', CONDICAO_IDS);
  if (estados.length > 0) {
    adicionar(`l.condicao IN (${estados.map(() => '?').join(', ')})`, ...estados);
  }

  const precoMin = lerNumero(p, 'precoMin');
  const precoMax = lerNumero(p, 'precoMax');
  if (precoMin !== null) adicionar('COALESCE(l.preco_centavos, l.valor_estimado_centavos) >= ?', precoMin);
  if (precoMax !== null) adicionar('COALESCE(l.preco_centavos, l.valor_estimado_centavos) <= ?', precoMax);

  const busca = lerTexto(p, 'q');
  if (busca) {
    adicionar("(l.titulo LIKE ? ESCAPE '\\' OR l.descricao LIKE ? ESCAPE '\\')", escaparLike(busca), escaparLike(busca));
  }
  const procuro = lerTexto(p, 'procuro');
  if (procuro) {
    adicionar("(l.titulo LIKE ? ESCAPE '\\' OR l.descricao LIKE ? ESCAPE '\\' OR l.subcategoria LIKE ? ESCAPE '\\')", escaparLike(procuro), escaparLike(procuro), escaparLike(procuro));
  }

  const cidade = lerTexto(p, 'cidade');
  const uf = lerTexto(p, 'uf').toUpperCase();
  if (cidade) adicionar('l.cidade = ? COLLATE NOCASE', cidade);
  if (uf) adicionar('l.uf = ?', uf);

  // Formas de entrega: o anúncio precisa ter pelo menos uma das escolhidas.
  const entregas = lerLista(p, 'entregas', ENTREGA_IDS);
  if (entregas.length > 0) {
    adicionar(`(${entregas.map(() => 'l.entregas LIKE ?').join(' OR ')})`, ...entregas.map((id) => `%"${id}"%`));
  }
  if (p.get('variasEntregas') === '1') adicionar('json_array_length(l.entregas) > 1');

  // Troca
  if (p.get('trocaQualquer') === '1') adicionar('l.troca_qualquer_categoria = 1');
  const trocaCategoria = p.get('trocaCategoria');
  if (trocaCategoria && CATEGORIA_IDS.includes(trocaCategoria)) {
    adicionar('(l.troca_qualquer_categoria = 1 OR l.troca_categorias LIKE ?)', `%"${trocaCategoria}"%`);
  }
  const complemento = p.get('complemento');
  if (complemento === 'aceita' || complemento === 'nao_aceita') adicionar('l.troca_complemento = ?', complemento);
  const tenho = lerTexto(p, 'tenho');
  if (tenho) adicionar("(l.troca_qualquer_categoria = 1 OR l.preferencia_troca LIKE ? ESCAPE '\\')", escaparLike(tenho));

  // Doação
  const destino = p.get('destino');
  if (destino === 'organizacoes' || destino === 'pessoas') adicionar("l.doacao_destino IN (?, 'todos')", destino);
  if (p.get('imediata') === '1') adicionar('l.doacao_imediata = 1');
  if (p.get('precisaRetirar') === '1') adicionar('l.entregas LIKE ?', '%"retirada"%');
  if (p.get('possuiEntrega') === '1') {
    adicionar("(l.entregas LIKE '%\"entrega\"%' OR l.entregas LIKE '%\"correios\"%' OR l.entregas LIKE '%\"transportadora\"%')");
  }
  if (p.get('pontoReuse') === '1') adicionar('l.entregas LIKE ?', '%"ponto_reuse"%');

  const anunciantes = lerLista(p, 'anunciantes', TIPO_ANUNCIANTE_IDS);
  if (anunciantes.length > 0) {
    adicionar(`u.tipo_conta IN (${anunciantes.map(() => '?').join(', ')})`, ...anunciantes);
  }

  // Localização de quem busca (GPS do aparelho). Sem ela, não há distância nem "mais próximos".
  const latitude = lerNumero(p, 'lat');
  const longitude = lerNumero(p, 'lng');
  let origemBusca: Coordenadas | null =
    latitude !== null && longitude !== null && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : null;
  // "Mais próximos" sem GPS: usa o ponto aproximado do endereço de quem está logado (seção "Nas proximidades").
  if (!origemBusca && p.get('ordenar') === 'proximos') {
    const sessao = await buscarSessao(env, request);
    if (sessao) {
      const perfil = await env.DB.prepare('SELECT latitude, longitude FROM users WHERE id = ?')
        .bind(sessao.userId)
        .first<{ latitude: number | null; longitude: number | null }>();
      if (perfil?.latitude != null && perfil.longitude != null) {
        origemBusca = { latitude: perfil.latitude, longitude: perfil.longitude };
      }
    }
  }
  const raioKm = lerNumero(p, 'raioKm');
  const porProximidade = origemBusca !== null && (p.get('ordenar') === 'proximos' || (raioKm !== null && raioKm > 0));

  if (origemBusca && raioKm !== null && raioKm > 0) {
    const caixa = calcularCaixa(origemBusca, raioKm);
    adicionar('l.latitude BETWEEN ? AND ? AND l.longitude BETWEEN ? AND ?', caixa.latMin, caixa.latMax, caixa.lonMin, caixa.lonMax);
  }

  const pagina = Math.max(0, Number.parseInt(p.get('pagina') ?? '0', 10) || 0);
  const sql = `SELECT l.*, (SELECT chave FROM listing_images i WHERE i.listing_id = l.id ORDER BY ordem LIMIT 1) AS capa
     FROM listings l JOIN users u ON u.id = l.user_id
     WHERE ${condicoes.join(' AND ')}
     ORDER BY CASE WHEN l.destaque_ate > ? THEN 0 ELSE 1 END, l.criado_em DESC
     LIMIT ? OFFSET ?`;

  const distancia = (row: LinhaVitrine) =>
    origemBusca && row.latitude !== null && row.longitude !== null
      ? calcularDistanciaKm(origemBusca, { latitude: row.latitude, longitude: row.longitude })
      : null;

  let linhas: LinhaVitrine[];
  let temMais: boolean;

  if (porProximidade) {
    const candidatos = await env.DB.prepare(sql).bind(...valores, agoraIso(), LIMITE_CANDIDATOS, 0).all<LinhaVitrine>();
    const comDistancia = candidatos.results
      .map((row) => ({ row, km: distancia(row) }))
      .filter(({ km }) => raioKm === null || raioKm <= 0 || (km !== null && km <= raioKm));
    if (p.get('ordenar') === 'proximos') {
      comDistancia.sort((a, b) => (a.km ?? Number.POSITIVE_INFINITY) - (b.km ?? Number.POSITIVE_INFINITY));
    }
    linhas = comDistancia.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA).map(({ row }) => row);
    temMais = comDistancia.length > (pagina + 1) * POR_PAGINA;
  } else {
    // Busca um item a mais para saber se existe próxima página.
    const resultado = await env.DB.prepare(sql).bind(...valores, agoraIso(), POR_PAGINA + 1, pagina * POR_PAGINA).all<LinhaVitrine>();
    linhas = resultado.results.slice(0, POR_PAGINA);
    temMais = resultado.results.length > POR_PAGINA;
  }

  const itens: AnuncioVitrine[] = linhas.map((row) => {
    const km = distancia(row);
    return {
      id: row.id,
      titulo: row.titulo,
      modalidade: row.modalidade,
      categoria: row.categoria,
      subcategoria: row.subcategoria,
      condicao: row.condicao,
      precoCentavos: row.preco_centavos,
      valorEstimadoCentavos: row.valor_estimado_centavos,
      capaUrl: montarUrlArquivo(origem, row.capa),
      localizacao: extrairLocalizacao(row),
      // Arredondada: mostra "a 3 km", nunca a posição exata.
      distanciaKm: km === null ? null : Math.max(1, Math.round(km)),
      emDestaque: estaEmDestaque(row),
      criadoEm: row.criado_em,
    };
  });

  const resposta: PaginaVitrine = { itens, proximaPagina: temMais ? pagina + 1 : null };
  return responderJson(resposta);
}

// GET /anuncios/:id — detalhe público. Arquivados não aparecem (exceto para o dono).
export async function obterAnuncioPublico(request: Request, env: Env, anuncioId: string, origem: string) {
  const anuncio = await env.DB.prepare('SELECT * FROM listings WHERE id = ?').bind(anuncioId).first<AnuncioRow>();
  const sessao = await buscarSessao(env, request);
  const proprio = anuncio !== null && sessao?.userId === anuncio.user_id;

  if (!anuncio || (anuncio.status === 'arquivado' && !proprio)) {
    throw new ErroApi(404, 'NAO_ENCONTRADO', 'Este anúncio não está mais disponível.');
  }

  const [imagens, anunciante, reputacao] = await env.DB.batch([
    env.DB.prepare('SELECT chave FROM listing_images WHERE listing_id = ? ORDER BY ordem').bind(anuncioId),
    env.DB.prepare('SELECT id, nome_publico, tipo_conta, foto_chave, criado_em FROM users WHERE id = ?').bind(anuncio.user_id),
    env.DB.prepare('SELECT AVG(nota) AS media, COUNT(*) AS total FROM ratings WHERE avaliado_id = ?').bind(anuncio.user_id),
  ]);

  const dono = anunciante.results[0] as {
    id: string;
    nome_publico: string;
    tipo_conta: AnuncioPublico['anunciante']['tipoConta'];
    foto_chave: string | null;
    criado_em: string;
  };
  const notas = (reputacao.results[0] ?? { media: null, total: 0 }) as { media: number | null; total: number };

  const resposta: AnuncioPublico = {
    id: anuncio.id,
    titulo: anuncio.titulo,
    descricao: anuncio.descricao,
    categoria: anuncio.categoria,
    subcategoria: anuncio.subcategoria,
    condicao: anuncio.condicao,
    modalidade: anuncio.modalidade,
    precoCentavos: anuncio.preco_centavos,
    aceitaOfertas: anuncio.aceita_ofertas === 1,
    ...mapearDetalhesTrocaDoacao(anuncio),
    entregas: JSON.parse(anuncio.entregas) as AnuncioPublico['entregas'],
    localizacao: extrairLocalizacao(anuncio),
    status: anuncio.status,
    imagens: (imagens.results as { chave: string }[]).map((imagem) => montarUrlArquivo(origem, imagem.chave) ?? ''),
    emDestaque: estaEmDestaque(anuncio),
    criadoEm: anuncio.criado_em,
    anunciante: {
      id: dono.id,
      nomePublico: dono.nome_publico,
      tipoConta: dono.tipo_conta,
      fotoUrl: montarUrlArquivo(origem, dono.foto_chave),
      membroDesde: dono.criado_em,
      reputacaoMedia: notas.media === null ? null : Math.round(notas.media * 10) / 10,
      totalAvaliacoes: notas.total,
    },
    proprio,
  };
  return responderJson(resposta);
}
