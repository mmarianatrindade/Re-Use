import type { TextStyle } from 'react-native';
import { colors } from './colors';
import { fonts } from './fonts';

// Escala tipográfica do app. Corpo em 16/24 (≈1,5) e descrição longa em 17/26, como pedem as diretrizes
// atuais de leitura no celular; nada abaixo de 13 px. Bricolage só em títulos, Plus Jakarta no resto.
export const tipografia = {
  tituloTela: { fontFamily: fonts.displayBold, fontSize: 28, lineHeight: 32, letterSpacing: -0.6, color: colors.primary },
  tituloSecao: { fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 27, letterSpacing: -0.4, color: colors.text },
  tituloBloco: { fontFamily: fonts.bodyBold, fontSize: 17, lineHeight: 23, color: colors.text },
  preco: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 34, letterSpacing: -0.6, color: colors.text, fontVariant: ['tabular-nums'] },
  leitura: { fontFamily: fonts.body, fontSize: 17, lineHeight: 26, color: colors.text },
  corpo: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.text },
  corpoSuave: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.textMuted },
  apoio: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  legenda: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, color: colors.textMuted },
} satisfies Record<string, TextStyle>;

// Largura máxima de blocos de texto: ~60 caracteres por linha em telas largas.
export const LARGURA_LEITURA = 600;
