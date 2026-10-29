import { colors } from '../constants/colors';
import { CATEGORIAS, CONDICOES, ENTREGAS, STATUS_ANUNCIO, type Modalidade, type StatusAnuncio } from '../schemas/anuncio';
import { TIPOS_ANUNCIANTE, encontrarCategoria } from '../schemas/catalogo';
import { formatarCep } from '../schemas/comum';
import type { ConteudoTag } from '../data/reuseData';
import type { AnuncioProprio, AnuncioResumo, AnuncioVitrine, LocalizacaoPublica } from '../types/api';
import type { DadosCardAnuncio } from '../components/CardAnuncio';

// Cor por tipo em par (forte para texto/preço, suave para fundo de selo), casando com a tag.
export const modalidadeInfo: Record<Modalidade, { label: string; cor: string; corSuave: string; tag: ConteudoTag }> = {
  venda: { label: 'Venda', cor: colors.sale, corSuave: colors.saleSoft, tag: { label: 'R$', tipo: 'venda' } },
  troca: { label: 'Troca', cor: colors.trade, corSuave: colors.tradeSoft, tag: { icon: '⇄', tipo: 'troca' } },
  doacao: { label: 'Doação', cor: colors.donation, corSuave: colors.donationSoft, tag: { icon: '♥', tipo: 'doacao' } },
};

// Tag cinza exibida ao lado da tag da modalidade enquanto o item está em negociação.
export const tagNegociando: ConteudoTag = { icon: '…', tipo: 'negociando' };

// Status em tons discretos: só "disponível" usa o verde da marca; "negociando" usa o grafite da tag cinza.
export const statusInfo: Record<StatusAnuncio, { cor: string; fundo: string; descricao: string }> = {
  disponivel: { cor: colors.success, fundo: colors.successSoft, descricao: 'Aparece na busca e recebe propostas.' },
  reservado: { cor: colors.negotiating, fundo: colors.negotiatingSoft, descricao: 'Separado para alguém; sai das novas propostas.' },
  negociando: { cor: colors.negotiating, fundo: colors.negotiatingSoft, descricao: 'Em conversa com um interessado.' },
  concluido: { cor: colors.primaryDark, fundo: colors.surfaceAlt, descricao: 'Venda, troca ou doação finalizada.' },
  arquivado: { cor: '#5E6B68', fundo: '#EEF1EF', descricao: 'Fora da busca, com o histórico preservado.' },
};

export function obterLabelStatus(status: StatusAnuncio) {
  return STATUS_ANUNCIO.find((item) => item.id === status)?.label ?? status;
}

export function obterLabelCategoria(id: string) {
  return CATEGORIAS.find((item) => item.id === id)?.label ?? id;
}

export function obterLabelSubcategoria(categoriaId: string, subcategoriaId: string) {
  return encontrarCategoria(categoriaId)?.subcategorias.find((sub) => sub.id === subcategoriaId)?.label ?? '';
}

// Tipo de conta declarado ("Pessoa", "ONG"...): exibido como declarado até existir verificação.
export function obterLabelTipoConta(id: string) {
  return TIPOS_ANUNCIANTE.find((tipo) => tipo.id === id)?.label ?? 'Pessoa';
}

export function obterLabelCondicao(id: string) {
  return CONDICOES.find((item) => item.id === id)?.label ?? id;
}

export function obterLabelEntrega(id: string) {
  return ENTREGAS.find((item) => item.id === id)?.label ?? id;
}

export function formatarMoeda(centavos: number) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarPrecoAnuncio(modalidade: Modalidade, precoCentavos: number | null) {
  if (modalidade === 'venda' && precoCentavos !== null) {
    return formatarMoeda(precoCentavos);
  }
  return modalidade === 'doacao' ? 'Gratuito' : 'Aberto a propostas';
}

// Localização pública: bairro, cidade/UF e CEP (o número do endereço nunca aparece).
export function formatarLocalizacao(local: LocalizacaoPublica) {
  return `${local.bairro}, ${local.cidade}/${local.uf}\nCEP ${formatarCep(local.cep)}`;
}

export function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatarMesAno(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function montarMetaLocal(local: LocalizacaoPublica | null, distanciaKm?: number | null) {
  const lugar = local ? `${local.bairro}, ${local.cidade}` : '';
  return distanciaKm != null ? `a ${distanciaKm} km${lugar ? `, ${local?.bairro}` : ''}` : lugar;
}

// Adaptadores para o cartão único de anúncio (CardAnuncio).
export function cardDeVitrine(anuncio: AnuncioVitrine): DadosCardAnuncio {
  return {
    id: anuncio.id,
    titulo: anuncio.titulo,
    modalidade: anuncio.modalidade,
    precoCentavos: anuncio.precoCentavos,
    capaUrl: anuncio.capaUrl,
    emDestaque: anuncio.emDestaque,
    meta: montarMetaLocal(anuncio.localizacao, anuncio.distanciaKm),
  };
}

export function cardDeProprio(anuncio: AnuncioProprio): DadosCardAnuncio {
  return {
    id: anuncio.id,
    titulo: anuncio.titulo,
    modalidade: anuncio.modalidade,
    precoCentavos: anuncio.precoCentavos,
    capaUrl: anuncio.imagens[0]?.url ?? null,
    status: anuncio.status,
    emDestaque: anuncio.destaqueAte !== null,
  };
}

export function cardDeResumo(anuncio: AnuncioResumo): DadosCardAnuncio {
  return {
    id: anuncio.id,
    titulo: anuncio.titulo,
    modalidade: anuncio.modalidade,
    precoCentavos: anuncio.precoCentavos,
    capaUrl: anuncio.capaUrl,
    status: anuncio.status,
    emDestaque: anuncio.emDestaque,
  };
}
