import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  tone?: 'dark' | 'light';
  large?: boolean;
  // Título em uma linha só: diminui a fonte em vez de quebrar.
  umaLinha?: boolean;
}

export default function SectionHeader({ title, subtitle, tone = 'dark', large = false, umaLinha = false }: SectionHeaderProps) {
  const isLight = tone === 'light';

  return (
    <View style={styles.container}>
      <Text
        style={[styles.title, large && styles.titleLarge, isLight && styles.titleLight]}
        numberOfLines={umaLinha ? 1 : undefined}
        adjustsFontSizeToFit={umaLinha}
        minimumFontScale={0.6}
      >
        {title}
      </Text>
      {subtitle ? <Text style={[styles.subtitle, isLight && styles.subtitleLight]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 36, maxWidth: 680 },
  title: { fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 36, letterSpacing: -0.8, color: colors.primary },
  titleLarge: { fontSize: 46, lineHeight: 50, letterSpacing: -1.4 },
  titleLight: { color: colors.textOnDark },
  subtitle: { fontFamily: fonts.body, marginTop: 14, fontSize: 17, lineHeight: 27, color: colors.textMuted, maxWidth: 560 },
  subtitleLight: { color: colors.textOnDarkMuted },
});
