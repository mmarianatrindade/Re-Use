import { Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';

interface ImagemCapaProps {
  source: ImageSourcePropType;
  // Largura ÷ altura do recorte (ex.: 560×360 → 1,55).
  proporcao: number;
  style?: StyleProp<ViewStyle>;
}

// Recorte da colagem de itens usado como ilustração de telas internas (decorativo, sem leitura por leitor de tela).
export default function ImagemCapa({ source, proporcao, style }: ImagemCapaProps) {
  return (
    <View style={[styles.moldura, { aspectRatio: proporcao }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Image source={source} style={styles.imagem} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  moldura: { width: '100%', borderRadius: radii.card, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  imagem: { width: '100%', height: '100%' },
});
