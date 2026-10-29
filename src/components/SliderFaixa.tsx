import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent, type PanResponderInstance } from 'react-native';
import { colors } from '../constants/colors';

// ==TIPOS==
interface SliderFaixaProps {
  // Quantidade de posições do trilho (0 … total - 1).
  total: number;
  // Sem "inicio": slider de uma alça só (ex.: raio em km), preenchido a partir da primeira posição.
  inicio?: number;
  fim: number;
  onChange: (inicio: number, fim: number) => void;
  // Texto lido pelo leitor de tela para cada posição.
  descrever: (posicao: number) => string;
}

type Alca = 'inicio' | 'fim';

// ==CONSTANTES==
const TAMANHO_ALCA = 28;

// Slider com duas alças (valor inicial e final) ou uma só, andando por posições fixas.
// Feito com PanResponder: funciona igual no celular e no navegador, sem biblioteca extra.
export default function SliderFaixa({ total, inicio, fim, onChange, descrever }: SliderFaixaProps) {
  const unico = inicio === undefined;
  // Uma alça: o "início" fica uma posição antes do trilho, para o fim poder chegar à posição 0.
  const inicioEfetivo = inicio ?? -1;
  // ==ESTADOS==
  const [largura, setLargura] = useState(0);
  // Os gestos são criados uma vez: leem os valores atuais por referência.
  const atual = useRef({ inicio: inicioEfetivo, fim, largura, total, onChange });
  atual.current = { inicio: inicioEfetivo, fim, largura, total, onChange };
  const origem = useRef(0);

  // ==FUNCOES==
  const posicaoParaX = (posicao: number) => (largura * posicao) / Math.max(total - 1, 1);

  const moverAlca = (alca: Alca, posicao: number) => {
    const { inicio: i, fim: f, total: t, onChange: alterar } = atual.current;
    // As alças não se cruzam: o início fica sempre ao menos uma posição antes do fim.
    if (alca === 'inicio') {
      const nova = Math.min(Math.max(posicao, 0), f - 1);
      if (nova !== i) alterar(nova, f);
    } else {
      const nova = Math.max(Math.min(posicao, t - 1), i + 1);
      if (nova !== f) alterar(i, nova);
    }
  };

  const criarGesto = (alca: Alca): PanResponderInstance =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Não deixa a rolagem da tela roubar o arraste da alça.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        const { largura: l, total: t } = atual.current;
        origem.current = (l * atual.current[alca]) / Math.max(t - 1, 1);
      },
      onPanResponderMove: (_evento, gesto) => {
        const { largura: l, total: t } = atual.current;
        if (l <= 0) return;
        const x = Math.min(Math.max(origem.current + gesto.dx, 0), l);
        moverAlca(alca, Math.round((x / l) * (t - 1)));
      },
    });

  const gestos = useRef({ inicio: criarGesto('inicio'), fim: criarGesto('fim') }).current;

  // ==HANDLERS==
  const handleLayout = (evento: LayoutChangeEvent) => setLargura(evento.nativeEvent.layout.width);

  // ==RENDER==
  const renderizarAlca = (alca: Alca, posicao: number, rotulo: string) => (
    <View
      {...gestos[alca].panHandlers}
      style={[styles.alca, { left: posicaoParaX(posicao) - TAMANHO_ALCA / 2 }]}
      hitSlop={12}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={rotulo}
      accessibilityValue={{ text: descrever(posicao) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(evento) => moverAlca(alca, posicao + (evento.nativeEvent.actionName === 'increment' ? 1 : -1))}
    />
  );

  return (
    <View style={styles.area}>
      <View style={styles.trilhoArea} onLayout={handleLayout}>
        <View style={styles.trilho} />
        <View style={[styles.trilhoAtivo, { left: posicaoParaX(inicio ?? 0), width: posicaoParaX(fim) - posicaoParaX(inicio ?? 0) }]} />
        {largura > 0 ? (
          <>
            {inicio !== undefined ? renderizarAlca('inicio', inicio, 'Valor inicial') : null}
            {renderizarAlca('fim', fim, unico ? 'Valor' : 'Valor final')}
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Margem lateral de meia alça: as alças nas pontas não ficam cortadas.
  area: { paddingHorizontal: TAMANHO_ALCA / 2, paddingVertical: 8 },
  trilhoArea: { height: TAMANHO_ALCA, justifyContent: 'center' },
  trilho: { height: 4, borderRadius: 2, backgroundColor: colors.border },
  trilhoAtivo: { position: 'absolute', height: 4, borderRadius: 2, backgroundColor: colors.primary },
  alca: {
    position: 'absolute',
    top: 0,
    width: TAMANHO_ALCA,
    height: TAMANHO_ALCA,
    borderRadius: TAMANHO_ALCA / 2,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.ink,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
