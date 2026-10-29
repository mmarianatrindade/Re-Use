import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { radii } from '../constants/radii';
import type { CartaoModalidade } from '../data/reuseData';
import PressableScale from './PressableScale';
import TagIcon from './TagIcon';

interface ModalityCardProps {
  modality: CartaoModalidade;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

// Painel de uma modalidade: o fundo levemente colorido identifica a modalidade sem precisar de borda.
export default function ModalityCard({ modality, onPress, style }: ModalityCardProps) {
  return (
    <View style={[styles.panel, { backgroundColor: `${modality.color}14` }, style]}>
      <View style={styles.header}>
        <TagIcon {...modality.tag} size={54} />
        <Text style={[styles.title, { color: modality.color }]}>{modality.title}</Text>
      </View>

      <Text style={styles.summary}>{modality.summary}</Text>

      <View style={styles.details}>
        {modality.details.map((detail) => (
          <View key={detail} style={styles.detailRow}>
            <View style={[styles.detailMark, { backgroundColor: modality.color }]} />
            <Text style={styles.detailText}>{detail}</Text>
          </View>
        ))}
      </View>

      <PressableScale onPress={onPress} style={styles.buttonWrap}>
        <View style={[styles.button, { backgroundColor: modality.color }]}>
          <Text style={styles.buttonText}>{modality.cta}</Text>
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderRadius: radii.card, padding: 26 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  title: { fontFamily: fonts.displayExtraBold, fontSize: 34, letterSpacing: -1, marginLeft: 12 },
  summary: { fontFamily: fonts.body, fontSize: 16, lineHeight: 25, color: colors.text },
  details: { marginTop: 18, marginBottom: 26 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 },
  detailMark: { width: 6, height: 6, borderRadius: 3, marginTop: 8, marginRight: 12 },
  detailText: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 22, color: colors.textMuted },
  buttonWrap: { marginTop: 'auto', alignSelf: 'flex-start' },
  button: { borderRadius: radii.pill, paddingVertical: 12, paddingHorizontal: 20 },
  buttonText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textOnDark },
});
