import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import Glifo from './Glifo';

interface CheckboxProps {
  marcado: boolean;
  onAlternar: (marcado: boolean) => void;
  children: ReactNode;
  erro?: string;
  accessibilityLabel: string;
}

export default function Checkbox({ marcado, onAlternar, children, erro, accessibilityLabel }: CheckboxProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onAlternar(!marcado)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: marcado }}
        accessibilityLabel={accessibilityLabel}
        style={styles.linha}
        hitSlop={6}
      >
        <View style={[styles.caixa, marcado && styles.caixaMarcada, erro && !marcado ? styles.caixaErro : null]}>
          {marcado ? <Glifo simbolo="✓" tamanho={18} /> : null}
        </View>
        <View style={styles.texto}>{children}</View>
      </Pressable>
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  linha: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 44 },
  caixa: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  caixaMarcada: { backgroundColor: colors.primary, borderColor: colors.primary },
  caixaErro: { borderColor: colors.danger },
  check: { color: colors.textOnDark, fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 18 },
  texto: { flex: 1 },
  erro: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.danger, marginTop: 4, marginLeft: 38 },
});
