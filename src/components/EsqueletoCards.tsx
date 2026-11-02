import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../constants/colors';
import { useReduceMotion } from '../hooks/useReduceMotion';

interface EsqueletoCardsProps {
  largura: number;
  colunas: number;
  espaco: number;
  // Quantas linhas de cartões desenhar.
  linhas?: number;
}

// Cartões cinza no formato da grade do catálogo, enquanto a lista carrega: a tela não "pula" quando os anúncios chegam.
export default function EsqueletoCards({ largura, colunas, espaco, linhas = 2 }: EsqueletoCardsProps) {
  const reduzirMovimento = useReduceMotion();
  const brilho = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    if (reduzirMovimento) {
      brilho.setValue(0.8);
      return;
    }
    const animacao = Animated.loop(
      Animated.sequence([
        Animated.timing(brilho, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(brilho, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ]),
    );
    animacao.start();
    return () => animacao.stop();
  }, [brilho, reduzirMovimento]);

  return (
    <View
      style={[styles.grade, { gap: espaco }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando anúncios"
    >
      {Array.from({ length: colunas * linhas }, (_, indice) => (
        <Animated.View key={indice} style={{ width: largura, opacity: brilho }}>
          <View style={styles.foto} />
          <View style={[styles.linha, { width: '45%', marginTop: 12 }]} />
          <View style={[styles.linha, { width: '90%', marginTop: 8 }]} />
          <View style={[styles.linha, { width: '60%', marginTop: 6 }]} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grade: { flexDirection: 'row', flexWrap: 'wrap' },
  foto: { width: '100%', aspectRatio: 4 / 5, borderRadius: 16, backgroundColor: colors.surfaceAlt },
  linha: { height: 12, borderRadius: 6, backgroundColor: colors.surfaceAlt },
});
