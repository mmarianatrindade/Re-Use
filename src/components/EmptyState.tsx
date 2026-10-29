import { ActivityIndicator, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import ImagemCapa from './ImagemCapa';
import PrimaryButton from './PrimaryButton';
import TagIcon from './TagIcon';

interface EmptyStateProps {
  titulo: string;
  mensagem?: string;
  icone?: string;
  acao?: { label: string; onPress: () => void };
  carregando?: boolean;
  // Ilustração (recorte da colagem) no lugar da tag.
  imagem?: { source: ImageSourcePropType; proporcao: number };
}

// Estado vazio, de carregamento ou de erro: sempre diz o que aconteceu e qual o próximo passo.
export default function EmptyState({ titulo, mensagem, icone = '♻', acao, carregando = false, imagem }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {carregando ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : imagem ? (
        <ImagemCapa source={imagem.source} proporcao={imagem.proporcao} style={styles.imagem} />
      ) : (
        <TagIcon icon={icone} size={52} />
      )}
      <Text style={styles.titulo}>{titulo}</Text>
      {mensagem ? <Text style={styles.mensagem}>{mensagem}</Text> : null}
      {acao ? <PrimaryButton label={acao.label} onPress={acao.onPress} style={styles.botao} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-start', paddingVertical: 32 },
  imagem: { maxWidth: 420, marginBottom: 4 },
  titulo: { fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 28, color: colors.primary, marginTop: 16 },
  mensagem: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textMuted, marginTop: 8, maxWidth: 420 },
  botao: { marginTop: 20, alignSelf: 'stretch' },
});
