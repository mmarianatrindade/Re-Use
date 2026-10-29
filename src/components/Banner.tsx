import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { radii } from '../constants/radii';

type Tom = 'info' | 'aviso' | 'erro' | 'sucesso';

interface BannerProps {
  tom?: Tom;
  titulo?: string;
  children?: ReactNode;
  acao?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

const tons: Record<Tom, { fundo: string; borda: string; texto: string }> = {
  info: { fundo: colors.surfaceAlt, borda: colors.border, texto: colors.primaryDark },
  aviso: { fundo: colors.warningSoft, borda: '#F3DDA8', texto: colors.warning },
  erro: { fundo: colors.dangerSoft, borda: '#F3C7C2', texto: colors.danger },
  sucesso: { fundo: colors.successSoft, borda: '#BFE3BC', texto: colors.success },
};

export default function Banner({ tom = 'info', titulo, children, acao, style }: BannerProps) {
  const cores = tons[tom];

  return (
    <View
      style={[styles.container, { backgroundColor: cores.fundo, borderColor: cores.borda }, style]}
      accessibilityRole={tom === 'erro' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
    >
      {titulo ? <Text style={[styles.titulo, { color: cores.texto }]}>{titulo}</Text> : null}
      {typeof children === 'string' ? <Text style={[styles.texto, { color: cores.texto }]}>{children}</Text> : children}
      {acao ? <View style={styles.acao}>{acao}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: radii.inner, padding: 14, marginBottom: 18 },
  titulo: { fontFamily: fonts.bodyBold, fontSize: 15, marginBottom: 4 },
  texto: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  acao: { marginTop: 12, alignItems: 'flex-start' },
});
