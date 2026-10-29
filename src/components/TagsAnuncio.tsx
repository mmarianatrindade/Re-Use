import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Modalidade, StatusAnuncio } from '../schemas/anuncio';
import { modalidadeInfo, tagNegociando } from '../utils/formatarAnuncio';
import TagIcon from './TagIcon';

interface TagsAnuncioProps {
  modalidade: Modalidade;
  status?: StatusAnuncio;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

// Tag da modalidade (venda, troca ou doação) e, em negociação, a tag cinza "negociando" ao lado.
export default function TagsAnuncio({ modalidade, status, size = 28, style }: TagsAnuncioProps) {
  return (
    <View style={[styles.linha, style]}>
      <TagIcon {...modalidadeInfo[modalidade].tag} size={size} />
      {status === 'negociando' ? <TagIcon {...tagNegociando} size={size} style={{ marginLeft: -size * 0.2 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'flex-end' },
});
