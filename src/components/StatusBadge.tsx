import { StyleSheet, Text, View } from 'react-native';
import { fonts } from '../constants/fonts';
import { radii } from '../constants/radii';
import type { StatusAnuncio } from '../schemas/anuncio';
import { obterLabelStatus, statusInfo, tagNegociando } from '../utils/formatarAnuncio';
import TagIcon from './TagIcon';

export default function StatusBadge({ status }: { status: StatusAnuncio }) {
  const info = statusInfo[status];

  return (
    <View style={[styles.badge, { backgroundColor: info.fundo }]} accessibilityLabel={`Status: ${obterLabelStatus(status)}`}>
      {status === 'negociando' ? (
        <TagIcon {...tagNegociando} size={14} style={styles.tag} />
      ) : (
        <View style={[styles.ponto, { backgroundColor: info.cor }]} />
      )}
      <Text style={[styles.texto, { color: info.cor }]}>{obterLabelStatus(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  tag: { marginRight: 5, marginVertical: -3 },
  ponto: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  texto: { fontFamily: fonts.bodyBold, fontSize: 12 },
});
