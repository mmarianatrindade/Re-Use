import { Image, type ImageStyle } from 'expo-image';
import type { StyleProp } from 'react-native';
import { colors } from '../constants/colors';

interface FotoProps {
  uri: string;
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain';
  accessibilityLabel?: string;
}

// Foto remota com cache em memória e disco, transição suave e fundo neutro enquanto carrega.
// Sem rótulo, é tratada como decorativa (o cartão que a contém já descreve o anúncio).
export default function Foto({ uri, style, contentFit = 'cover', accessibilityLabel }: FotoProps) {
  return (
    <Image
      source={{ uri }}
      style={[{ backgroundColor: colors.surfaceAlt }, style]}
      contentFit={contentFit}
      transition={200}
      cachePolicy="memory-disk"
      recyclingKey={uri}
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
