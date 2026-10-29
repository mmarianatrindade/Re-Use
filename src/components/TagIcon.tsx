import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { tags, type TipoTag } from '../constants/images';
import Glifo, { temGlifo } from './Glifo';

interface TagIconProps {
  // Símbolo (⌂ ♻ ⇄ ♥ … ✓ ✉ ! ? +): desenhado em vetor (Glifo); outros caem para texto.
  icon?: string;
  // Texto curto (R$, 01...) renderizado com a fonte de títulos.
  label?: string;
  // Cor da tag: modalidade (venda, troca, doacao), negociando ou a tag do logo (padrão).
  tipo?: TipoTag;
  size?: number;
  // Proporção do símbolo em relação à tag (padrão 0.42). Maior em ícones pequenos, como no menu.
  iconScale?: number;
  // Espessura de um contorno branco em volta do formato da tag (0 = sem contorno).
  contorno?: number;
  style?: StyleProp<ViewStyle>;
}

// Proporção da imagem logo_tag.webp (292 × 358).
const ASPECT_RATIO = 358 / 292;

// Tag do ReUse com um ícone ou texto curto no corpo, longe do furo.
export default function TagIcon({ icon, label, tipo = 'padrao', size = 40, iconScale = 0.42, contorno = 0, style }: TagIconProps) {
  const height = size * ASPECT_RATIO;
  const content = label ?? icon;
  const fontSize = label ? size * (label.length > 2 ? 0.24 : 0.3) : size * iconScale;

  return (
    <View style={[{ width: size, height }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {/* Contorno: a mesma tag pintada de branco (tintColor) e um pouco maior, atrás da original.
          Funciona igual em web, Android e iOS, ao contrário de filtros de sombra. */}
      {contorno > 0 ? (
        <Image
          source={tags[tipo]}
          resizeMode="contain"
          style={{ position: 'absolute', tintColor: colors.surface, left: -contorno, top: -contorno * ASPECT_RATIO, width: size + contorno * 2, height: height + contorno * 2 * ASPECT_RATIO }}
        />
      ) : null}
      <Image source={tags[tipo]} style={styles.image} resizeMode="contain" />
      {!label && temGlifo(icon) ? (
        <View style={styles.body}>
          <Glifo simbolo={icon as string} tamanho={size * iconScale * 1.15} />
        </View>
      ) : content ? (
        <View style={styles.body}>
          <Text
            style={[label ? styles.label : styles.icon, { fontSize, lineHeight: fontSize * 1.15 }]}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {content}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  // Área do corpo da tag: centralizada em ~48% × 58% da imagem.
  body: {
    position: 'absolute',
    left: '14%',
    right: '10%',
    top: '36%',
    bottom: '12%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    color: colors.textOnDark,
    textAlign: 'center',
    textShadowColor: 'rgba(2, 32, 28, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  label: {
    fontFamily: fonts.displayExtraBold,
    color: colors.textOnDark,
    textAlign: 'center',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(2, 32, 28, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
