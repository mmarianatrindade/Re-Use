import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';

interface AvatarProps {
  nome: string;
  uri: string | null;
  tamanho?: number;
}

function obterIniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return `${partes[0]?.[0] ?? ''}${partes.length > 1 ? partes[partes.length - 1][0] : ''}`.toUpperCase();
}

export default function Avatar({ nome, uri, tamanho = 72 }: AvatarProps) {
  const estiloTamanho = { width: tamanho, height: tamanho, borderRadius: tamanho / 2 };

  if (uri) {
    return <Image source={{ uri }} style={[styles.imagem, estiloTamanho]} accessibilityLabel={`Foto de ${nome}`} />;
  }

  return (
    <View style={[styles.iniciais, estiloTamanho]} accessibilityLabel={`${nome}, sem foto`}>
      <Text style={[styles.iniciaisTexto, { fontSize: tamanho * 0.36 }]}>{obterIniciais(nome)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  imagem: { backgroundColor: colors.surfaceAlt },
  iniciais: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  iniciaisTexto: { fontFamily: fonts.displayBold, color: colors.lime },
});
