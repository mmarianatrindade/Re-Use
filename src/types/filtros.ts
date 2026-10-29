import type { FaixaPrecoId } from '../schemas/catalogo';

// Filtros da aba Anúncios (modal "Filtros"). Tudo vazio = sem filtro.
export type ModoLocalizacao = 'brasil' | 'cidade' | 'estado' | 'raio';

export interface FiltrosAnuncios {
  categoria: string | null;
  subcategoria: string | null;
  condicoes: string[];
  faixaPreco: FaixaPrecoId | null;
  // "Personalizado": valores digitados, em reais.
  precoMinimo: string;
  precoMaximo: string;
  localizacao: ModoLocalizacao;
  raioKm: number | null;
  maisProximos: boolean;
  entregas: string[];
  variasEntregas: boolean;
  trocaQualquerCategoria: boolean;
  trocaCategoria: string | null;
  complemento: 'aceita' | 'nao_aceita' | null;
  tenho: string;
  procuro: string;
  doacaoDestino: 'organizacoes' | 'pessoas' | null;
  doacaoImediata: boolean;
  precisaRetirar: boolean;
  possuiEntrega: boolean;
  pontoReuse: boolean;
  anunciantes: string[];
}

export const FILTROS_VAZIOS: FiltrosAnuncios = {
  categoria: null,
  subcategoria: null,
  condicoes: [],
  faixaPreco: null,
  precoMinimo: '',
  precoMaximo: '',
  localizacao: 'brasil',
  raioKm: null,
  maisProximos: false,
  entregas: [],
  variasEntregas: false,
  trocaQualquerCategoria: false,
  trocaCategoria: null,
  complemento: null,
  tenho: '',
  procuro: '',
  doacaoDestino: null,
  doacaoImediata: false,
  precisaRetirar: false,
  possuiEntrega: false,
  pontoReuse: false,
  anunciantes: [],
};

// Quantos grupos de filtro estão ativos (número no botão "Filtros").
export function contarFiltrosAtivos(filtros: FiltrosAnuncios) {
  return [
    filtros.categoria !== null,
    filtros.condicoes.length > 0,
    filtros.faixaPreco !== null,
    filtros.localizacao !== 'brasil',
    filtros.entregas.length > 0 || filtros.variasEntregas,
    filtros.trocaQualquerCategoria || filtros.trocaCategoria !== null || filtros.complemento !== null || filtros.tenho.trim() !== '' || filtros.procuro.trim() !== '',
    filtros.doacaoDestino !== null || filtros.doacaoImediata || filtros.precisaRetirar || filtros.possuiEntrega || filtros.pontoReuse,
    filtros.anunciantes.length > 0,
  ].filter(Boolean).length;
}
