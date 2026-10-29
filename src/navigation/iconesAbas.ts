import type { AbasParamList } from './tipos';

// Símbolo desenhado dentro da tag do logo em cada aba (barra inferior do celular e cabeçalho do site).
export const ICONES_ABAS: Record<keyof AbasParamList, string> = {
  Inicio: '⌂',
  Anuncios: '♻',
  Anunciar: '+',
  Negociacoes: '⇄',
  Perfil: '☺',
};
