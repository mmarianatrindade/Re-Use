import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { radii } from '../constants/radii';

interface StepIndicatorProps {
  etapaAtual: number;
  totalEtapas: number;
  titulo: string;
}

// Progresso de formulário em etapas: mostra onde a pessoa está e quanto falta.
export default function StepIndicator({ etapaAtual, totalEtapas, titulo }: StepIndicatorProps) {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={`Etapa ${etapaAtual} de ${totalEtapas}: ${titulo}`}>
      <Text style={styles.contador}>
        Etapa {etapaAtual} de {totalEtapas}
      </Text>
      <Text style={styles.titulo}>{titulo}</Text>
      <View style={styles.trilho}>
        {Array.from({ length: totalEtapas }, (_, indice) => (
          <View key={indice} style={[styles.segmento, indice < etapaAtual && styles.segmentoAtivo]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  contador: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  titulo: { fontFamily: fonts.displayBold, fontSize: 26, lineHeight: 30, letterSpacing: -0.6, color: colors.primary, marginTop: 4 },
  trilho: { flexDirection: 'row', gap: 6, marginTop: 14 },
  segmento: { flex: 1, height: 5, borderRadius: radii.pill, backgroundColor: colors.border },
  segmentoAtivo: { backgroundColor: colors.teal },
});
