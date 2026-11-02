import { converterPrecoParaCentavos, type AnuncioApiDados, type AnuncioFormDados, type PlanoDestaqueId, type StatusAnuncio } from '../schemas/anuncio';
import { FAIXAS_PRECO } from '../schemas/catalogo';
import type { FiltrosAnuncios } from '../types/filtros';
import type { AnuncioProprio, AnuncioPublico, MensagemResposta, PaginaVitrine } from '../types/api';
import { requisitar } from './api';
import { chavesLocais, lerLocal, salvarLocal } from './armazenamento';
import { lerCache, removerCache, salvarCache, TTL_CACHE } from './cache';
import { capturarContaLocal } from './contaLocal';

// Converte o formulário no corpo da API; as fotos já precisam ter sido enviadas (chave preenchida).
export function montarDadosAnuncio(form: AnuncioFormDados, chavesImagens: string[]): AnuncioApiDados {
  const modalidade = form.modalidade as AnuncioApiDados['modalidade'];
  return {
    titulo: form.titulo,
    descricao: form.descricao,
    categoria: form.categoria,
    subcategoria: form.subcategoria,
    condicao: form.condicao as AnuncioApiDados['condicao'],
    modalidade,
    precoCentavos: modalidade === 'venda' ? converterPrecoParaCentavos(form.preco) : null,
    aceitaOfertas: modalidade === 'venda' && form.aceitaOfertas,
    preferenciaTroca: modalidade === 'troca' ? form.preferenciaTroca.trim() : null,
    valorEstimadoCentavos: modalidade === 'troca' ? converterPrecoParaCentavos(form.valorEstimado) : null,
    trocaQualquerCategoria: modalidade === 'troca' && form.trocaQualquerCategoria,
    trocaCategorias: modalidade === 'troca' && !form.trocaQualquerCategoria ? form.trocaCategorias : [],
    trocaComplemento: modalidade === 'troca' ? (form.trocaComplemento as 'aceita' | 'nao_aceita') : null,
    doacaoDestino: modalidade === 'doacao' ? (form.doacaoDestino as 'todos' | 'organizacoes' | 'pessoas') : null,
    doacaoImediata: modalidade === 'doacao' && form.doacaoImediata,
    entregas: form.entregas as AnuncioApiDados['entregas'],
    imagens: chavesImagens,
  };
}

export async function listarMeusAnuncios() {
  const conta = capturarContaLocal();
  const anuncios = await requisitar<AnuncioProprio[]>('/meus-anuncios');
  await salvarLocal(chavesLocais.meusAnuncios, anuncios, conta);
  return anuncios;
}

// Última lista recebida, para abrir a tela na hora (e sem conexão) enquanto a API responde.
export function lerMeusAnunciosEmCache() {
  return lerLocal<AnuncioProprio[]>(chavesLocais.meusAnuncios);
}

export function buscarMeuAnuncio(id: string) {
  return requisitar<AnuncioProprio>(`/meus-anuncios/${encodeURIComponent(id)}`);
}

export function publicarAnuncio(dados: AnuncioApiDados) {
  return requisitar<AnuncioProprio>('/anuncios', { metodo: 'POST', corpo: dados });
}

export function salvarEdicaoAnuncio(id: string, dados: AnuncioApiDados) {
  return requisitar<AnuncioProprio>(`/anuncios/${encodeURIComponent(id)}`, { metodo: 'PUT', corpo: dados });
}

export function alterarStatusAnuncio(id: string, status: StatusAnuncio) {
  return requisitar<AnuncioProprio>(`/anuncios/${encodeURIComponent(id)}/status`, { metodo: 'PATCH', corpo: { status } });
}

export function excluirAnuncio(id: string) {
  return requisitar<MensagemResposta>(`/anuncios/${encodeURIComponent(id)}`, { metodo: 'DELETE' });
}

export function contratarDestaque(id: string, plano: PlanoDestaqueId) {
  return requisitar<AnuncioProprio>(`/anuncios/${encodeURIComponent(id)}/destaque`, { metodo: 'POST', corpo: { plano } });
}

export function cancelarPedidoDestaque(id: string) {
  return requisitar<AnuncioProprio>(`/anuncios/${encodeURIComponent(id)}/destaque`, { metodo: 'DELETE' });
}

export interface FiltrosVitrine {
  modalidade?: string;
  categoria?: string;
  busca?: string;
  // Filtros do modal (aba Anúncios).
  avancados?: FiltrosAnuncios;
  // Ordena pelos mais próximos do endereço do perfil (a API usa o ponto aproximado salvo; sem login, os mais recentes).
  proximosDoPerfil?: boolean;
  // Onde a pessoa está: GPS para distância; cidade/UF do GPS ou do perfil para "minha cidade/estado".
  local?: { latitude: number | null; longitude: number | null; cidade: string | null; uf: string | null };
}

function montarParametrosVitrine({ modalidade, categoria, busca, avancados: f, local, proximosDoPerfil }: FiltrosVitrine) {
  const parametros: Record<string, string> = {};
  const definir = (nome: string, valor: string | number | boolean | null | undefined) => {
    if (valor === true) parametros[nome] = '1';
    else if (valor !== false && valor !== null && valor !== undefined && String(valor).trim() !== '') parametros[nome] = String(valor).trim();
  };

  definir('modalidade', modalidade);
  definir('q', busca);
  definir('categoria', f?.categoria ?? categoria);
  if (proximosDoPerfil) definir('ordenar', 'proximos');

  if (f) {
    definir('subcategoria', f.subcategoria);
    definir('condicoes', f.condicoes.join(','));

    if (f.faixaPreco === 'gratis') {
      definir('gratis', true);
    } else if (f.faixaPreco === 'personalizado') {
      definir('precoMin', converterPrecoParaCentavos(f.precoMinimo));
      definir('precoMax', converterPrecoParaCentavos(f.precoMaximo));
    } else if (f.faixaPreco) {
      const faixa = FAIXAS_PRECO.find((item) => item.id === f.faixaPreco);
      definir('precoMin', faixa?.min);
      definir('precoMax', faixa?.max);
    }

    if (local?.latitude != null && local.longitude != null && (f.localizacao === 'raio' || f.maisProximos)) {
      definir('lat', local.latitude);
      definir('lng', local.longitude);
    }
    if (f.localizacao === 'raio') definir('raioKm', f.raioKm);
    if (f.localizacao === 'cidade') {
      definir('cidade', local?.cidade);
      definir('uf', local?.uf);
    }
    if (f.localizacao === 'estado') definir('uf', local?.uf);
    if (f.maisProximos) definir('ordenar', 'proximos');

    definir('entregas', f.entregas.join(','));
    definir('variasEntregas', f.variasEntregas);
    definir('trocaQualquer', f.trocaQualquerCategoria);
    definir('trocaCategoria', f.trocaCategoria);
    definir('complemento', f.complemento);
    definir('tenho', f.tenho);
    definir('procuro', f.procuro);
    definir('destino', f.doacaoDestino);
    definir('imediata', f.doacaoImediata);
    definir('precisaRetirar', f.precisaRetirar);
    definir('possuiEntrega', f.possuiEntrega);
    definir('pontoReuse', f.pontoReuse);
    definir('anunciantes', f.anunciantes.join(','));
  }

  return Object.entries(parametros)
    .map(([nome, valor]) => `${nome}=${encodeURIComponent(valor)}`)
    .join('&');
}

// Chave do cache da 1ª página: a posição do GPS é arredondada (~1 km) para não guardar a localização exata.
function chaveCacheVitrine(filtros: FiltrosVitrine, conta = capturarContaLocal()) {
  return `${conta.usuarioId ?? 'publico'}/vitrine/${montarParametrosVitrine(filtros).replace(/(lat|lng)=(-?\d+\.\d{2})\d*/g, '$1=$2')}`;
}

// Só a 1ª página vai para o cache: é a que abre a Home e o catálogo.
export async function listarVitrine(filtros: FiltrosVitrine, pagina: number) {
  const conta = capturarContaLocal();
  const consulta = montarParametrosVitrine(filtros);
  const resposta = await requisitar<PaginaVitrine>(`/anuncios?pagina=${pagina}${consulta ? `&${consulta}` : ''}`);
  if (pagina === 0) {
    void salvarCache(chaveCacheVitrine(filtros, conta), resposta, conta);
  }
  return resposta;
}

// Última 1ª página recebida com esses mesmos filtros (null se não houver ou se estiver velha demais).
export function lerVitrineEmCache(filtros: FiltrosVitrine) {
  return lerCache<PaginaVitrine>(chaveCacheVitrine(filtros), TTL_CACHE.listagens);
}

export async function buscarAnuncioPublico(id: string) {
  const conta = capturarContaLocal();
  const anuncio = await requisitar<AnuncioPublico>(`/anuncios/${encodeURIComponent(id)}`);
  void salvarCache(`${conta.usuarioId ?? 'publico'}/anuncio/${id}`, anuncio, conta);
  return anuncio;
}

// Anúncio já aberto antes: a tela de detalhe abre na hora, mesmo sem conexão.
export function lerAnuncioPublicoEmCache(id: string) {
  return lerCache<AnuncioPublico>(`${capturarContaLocal().usuarioId ?? 'publico'}/anuncio/${id}`, TTL_CACHE.detalhe);
}

// Anúncio que a API diz não existir mais: sai do cache.
export function descartarAnuncioEmCache(id: string) {
  return removerCache(`${capturarContaLocal().usuarioId ?? 'publico'}/anuncio/${id}`);
}

// Conta a visualização no desempenho do anúncio (a API ignora quando quem vê é o dono).
export function registrarVisualizacao(id: string) {
  return requisitar<MensagemResposta>(`/anuncios/${encodeURIComponent(id)}/visualizacao`, { metodo: 'POST' }).catch(() => undefined);
}

export function denunciarAnuncio(id: string, motivo: string, detalhes: string) {
  return requisitar<MensagemResposta>(`/anuncios/${encodeURIComponent(id)}/denuncia`, { metodo: 'POST', corpo: { motivo, detalhes } });
}
