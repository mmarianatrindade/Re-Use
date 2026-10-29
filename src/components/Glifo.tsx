import type { ReactElement } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

// Ícones em vetor desenhados dentro das tags. Substituem símbolos de texto (⌂ ♻ ⇄ ♥ …), que cada
// sistema desenha de um jeito e alguns aparelhos nem têm. Traço branco, grade de 24 × 24.
const DESENHOS: Record<string, (cor: string) => ReactElement> = {
  '⌂': (cor) => <Path d="M4 11.5 12 5l8 6.5V20h-5.5v-5h-5v5H4z" stroke={cor} strokeWidth={2.2} strokeLinejoin="round" fill="none" />,
  // Setas em círculo: "de novo", "reuso". Mais legível em tamanho pequeno que o símbolo de reciclagem.
  '♻': (cor) => (
    <Path
      d="M18.5 12a6.5 6.5 0 1 1-1.9-4.6M18.5 4.5v3.4h-3.4"
      stroke={cor}
      strokeWidth={2.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  '⇄': (cor) => (
    <Path d="M5 8h13m-3.5-3.5L18 8l-3.5 3.5M19 16H6m3.5-3.5L6 16l3.5 3.5" stroke={cor} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  ),
  '♥': (cor) => <Path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill={cor} />,
  '☺': (cor) => (
    <>
      <Circle cx={12} cy={8.5} r={3.6} stroke={cor} strokeWidth={2.2} fill="none" />
      <Path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" stroke={cor} strokeWidth={2.2} strokeLinecap="round" fill="none" />
    </>
  ),
  '…': (cor) => (
    <>
      <Circle cx={6} cy={12} r={2} fill={cor} />
      <Circle cx={12} cy={12} r={2} fill={cor} />
      <Circle cx={18} cy={12} r={2} fill={cor} />
    </>
  ),
  '✓': (cor) => <Path d="m5 12.5 4.5 4.5L19 7.5" stroke={cor} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />,
  '✉': (cor) => (
    <Path d="M4 6.5h16v11H4zM4.5 7l7.5 6 7.5-6" stroke={cor} strokeWidth={2} strokeLinejoin="round" fill="none" />
  ),
  '!': (cor) => (
    <>
      <Path d="M12 5v9" stroke={cor} strokeWidth={2.8} strokeLinecap="round" />
      <Circle cx={12} cy={18.5} r={1.7} fill={cor} />
    </>
  ),
  '?': (cor) => (
    <>
      <Path d="M8.8 8.8A3.3 3.3 0 0 1 15.3 9c0 2.4-3.3 2.9-3.3 5" stroke={cor} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <Circle cx={12} cy={18.5} r={1.6} fill={cor} />
    </>
  ),
  '+': (cor) => <Path d="M12 5v14M5 12h14" stroke={cor} strokeWidth={2.8} strokeLinecap="round" />,
};

export function temGlifo(simbolo: string | undefined) {
  return simbolo !== undefined && simbolo in DESENHOS;
}

export default function Glifo({ simbolo, tamanho, cor = '#FFFFFF' }: { simbolo: string; tamanho: number; cor?: string }) {
  const desenhar = DESENHOS[simbolo];
  if (!desenhar) {
    return null;
  }
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      {desenhar(cor)}
    </Svg>
  );
}
