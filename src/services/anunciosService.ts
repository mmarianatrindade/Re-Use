import { converterPrecoParaCentavos, type AnuncioApiDados, type AnuncioFormDados, type PlanoDestaqueId, type StatusAnuncio } from '../schemas/anuncio';
import { FAIXAS_PRECO } from '../schemas/catalogo';
import type { FiltrosAnuncios } from '../types/filtros';
import type { AnuncioProprio, AnuncioPublico, MensagemResposta, PaginaVitrine } from '../types/api';
import { requisitar } from './api';
import { chavesLocais, lerLocal, salvarLocal } from './armazenamento';

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
  const anuncios = await requisitar<AnuncioProprio[]>('/meus-anuncios');
  await salvarLocal(chavesLocais.meusAnuncios, anuncios);
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

export function listarVitrine(filtros: FiltrosVitrine, pagina: number) {
  const consulta = montarParametrosVitrine(filtros);
  return requisitar<PaginaVitrine>(`/anuncios?pagina=${pagina}${consulta ? `&${consulta}` : ''}`);
}

export function buscarAnuncioPublico(id: string) {
  return requisitar<AnuncioPublico>(`/anuncios/${encodeURIComponent(id)}`);
}

// Conta a visualização no desempenho do anúncio (a API ignora quando quem vê é o dono).
export function registrarVisualizacao(id: string) {
  return requisitar<MensagemResposta>(`/anuncios/${encodeURIComponent(id)}/visualizacao`, { metodo: 'POST' }).catch(() => undefined);
}

export function denunciarAnuncio(id: string, motivo: string, detalhes: string) {
  return requisitar<MensagemResposta>(`/anuncios/${encodeURIComponent(id)}/denuncia`, { metodo: 'POST', corpo: { motivo, detalhes } });
}
