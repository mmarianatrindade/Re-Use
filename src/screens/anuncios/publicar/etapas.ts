import type { AnuncioFormDados } from '../../../schemas/anuncio';

export interface EtapaAnuncio {
  titulo: string;
  campos: (keyof AnuncioFormDados)[];
}

export const ETAPAS_ANUNCIO: EtapaAnuncio[] = [
  { titulo: 'Fotos do item', campos: ['fotos'] },
  { titulo: 'O que você está anunciando', campos: ['titulo', 'descricao', 'categoria', 'subcategoria', 'condicao'] },
  {
    titulo: 'Vender, trocar ou doar',
    campos: ['modalidade', 'preco', 'aceitaOfertas', 'preferenciaTroca', 'valorEstimado', 'trocaComplemento', 'doacaoDestino'],
  },
  { titulo: 'Como entregar', campos: ['entregas'] },
  { titulo: 'Confira antes de publicar', campos: [] },
];

export function encontrarEtapaDoCampoAnuncio(campo: string) {
  const indice = ETAPAS_ANUNCIO.findIndex((etapa) => (etapa.campos as string[]).includes(campo));
  return indice === -1 ? 0 : indice;
}

export const VALORES_INICIAIS_ANUNCIO: AnuncioFormDados = {
  fotos: [],
  titulo: '',
  descricao: '',
  categoria: '',
  subcategoria: '',
  condicao: '',
  modalidade: '',
  preco: '',
  aceitaOfertas: false,
  preferenciaTroca: '',
  valorEstimado: '',
  trocaQualquerCategoria: false,
  trocaCategorias: [],
  trocaComplemento: 'nao_aceita',
  doacaoDestino: 'todos',
  doacaoImediata: true,
  entregas: [],
};
