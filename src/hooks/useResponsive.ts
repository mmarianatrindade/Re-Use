import { Platform, useWindowDimensions } from 'react-native';

export const MAX_CONTENT_WIDTH = 1200;

// Na web em tela larga o menu vira um cabeçalho no topo (logo, links, Anunciar e perfil).
export const ALTURA_CABECALHO_WEB = 68;

export function usaCabecalhoWeb(larguraJanela: number) {
  return Platform.OS === 'web' && larguraJanela >= 900;
}

// Breakpoints simples para adaptar o layout entre celular, tablet e desktop.
export function useResponsive() {
  const { width: larguraJanela, height } = useWindowDimensions();
  const width = larguraJanela;
  const cabecalhoWeb = usaCabecalhoWeb(larguraJanela);
  const isTablet = width >= 700;
  const isDesktop = larguraJanela >= 1024;
  const gutter = isDesktop ? 40 : isTablet ? 28 : 20;
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH) - gutter * 2;

  return { width, height, isTablet, isDesktop, gutter, contentWidth, cabecalhoWeb };
}

export function columnWidth(contentWidth: number, columns: number, gap: number) {
  return (contentWidth - gap * (columns - 1)) / columns;
}
