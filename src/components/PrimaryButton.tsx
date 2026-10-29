import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { radii } from '../constants/radii';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variante?: Variante;
  carregando?: boolean;
  desabilitado?: boolean;
  compacto?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

const estilosVariante: Record<Variante, { fundo: string; texto: string; borda: string }> = {
  primario: { fundo: colors.primary, texto: colors.textOnDark, borda: colors.primary },
  secundario: { fundo: colors.surface, texto: colors.primary, borda: colors.border },
  fantasma: { fundo: 'transparent', texto: colors.primary, borda: 'transparent' },
  perigo: { fundo: colors.surface, texto: colors.danger, borda: '#F3C7C2' },
};

// Botão em pílula com área de toque de 52 px (48 no compacto) e estado de carregamento.
export default function PrimaryButton({
  label,
  onPress,
  variante = 'primario',
  carregando = false,
  desabilitado = false,
  compacto = false,
  style,
  accessibilityHint,
}: PrimaryButtonProps) {
  const estilo = estilosVariante[variante];
  const inativo = desabilitado || carregando;

  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inativo, busy: carregando }}
      style={({ pressed }) => [
        styles.base,
        compacto && styles.compacto,
        { backgroundColor: estilo.fundo, borderColor: estilo.borda },
        pressed && !inativo && styles.pressionado,
        desabilitado && styles.desabilitado,
        style,
      ]}
    >
      <View style={styles.conteudo}>
        {carregando ? <ActivityIndicator color={estilo.texto} size="small" style={styles.indicador} /> : null}
        <Text style={[styles.label, compacto && styles.labelCompacto, { color: estilo.texto }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: 22,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compacto: { minHeight: 44, paddingHorizontal: 16 },
  pressionado: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  desabilitado: { opacity: 0.45 },
  conteudo: { flexDirection: 'row', alignItems: 'center' },
  indicador: { marginRight: 10 },
  label: { fontFamily: fonts.bodyBold, fontSize: 16 },
  labelCompacto: { fontSize: 14 },
});
