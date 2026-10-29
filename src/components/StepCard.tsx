import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import TagIcon from './TagIcon';

interface StepCardProps {
  icon: string;
  title: string;
  text: string;
  isLast?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Etapa de uma sequência: a tag numerada fica sobre uma linha que liga as etapas.
export default function StepCard({ icon, title, text, isLast = false, style }: StepCardProps) {
  return (
    <View style={[styles.step, style]}>
      <View style={styles.marker}>
        <TagIcon label={icon} size={54} />
        {!isLast ? <View style={styles.line} /> : null}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  step: { paddingRight: 12 },
  marker: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  line: { flex: 1, height: 2, marginLeft: 12, backgroundColor: colors.border },
  title: { fontFamily: fonts.displayBold, fontSize: 21, letterSpacing: -0.4, color: colors.text, marginBottom: 8 },
  text: { fontFamily: fonts.body, fontSize: 15, lineHeight: 24, color: colors.textMuted },
});
