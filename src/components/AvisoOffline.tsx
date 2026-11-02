import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { useConexao } from '../hooks/useConexao';

// Faixa no topo enquanto não há internet: explica por que as telas não atualizam e que os dados salvos continuam disponíveis.
export default function AvisoOffline() {
  const conectado = useConexao();
  const insets = useSafeAreaInsets();

  if (conectado) {
    return null;
  }

  return (
    <View style={[styles.faixa, { paddingTop: insets.top + 6 }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.texto}>Sem conexão. Você vê os dados salvos neste aparelho e as mudanças voltam quando a internet voltar.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  faixa: { backgroundColor: colors.negotiating, paddingHorizontal: 16, paddingBottom: 8 },
  texto: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, color: colors.textOnDark, textAlign: 'center' },
});
