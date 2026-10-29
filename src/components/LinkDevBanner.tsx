import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import Banner from './Banner';
import PrimaryButton from './PrimaryButton';

// Só aparece quando a API está em modo de desenvolvimento, sem envio real de e-mail configurado.
// Em produção o link nunca volta na resposta: ele chega apenas por e-mail.
export default function LinkDevBanner({ link }: { link?: string }) {
  const navigation = useNavigation();

  if (!link) {
    return null;
  }

  // Abre a tela do link dentro do próprio app (no celular, "localhost" do link não aponta para o computador).
  // O URL do React Native não implementa searchParams, então o link é lido com expressões regulares.
  const handleAbrir = () => {
    const tokenCodificado = /[?&]token=([^&#]+)/.exec(link)?.[1];
    const token = tokenCodificado ? decodeURIComponent(tokenCodificado) : undefined;
    if (/\/ativar(\?|$)/.test(link)) {
      navigation.navigate('AtivarConta', { token });
    } else if (/\/redefinir-senha(\?|$)/.test(link)) {
      navigation.navigate('RedefinirSenha', { token });
    }
  };

  return (
    <Banner
      tom="aviso"
      titulo="Ambiente de desenvolvimento"
      acao={<PrimaryButton label="Abrir link do e-mail" variante="secundario" compacto onPress={handleAbrir} />}
    >
      <Text style={styles.texto}>O envio de e-mail não está configurado na API. Use o botão para simular o clique no link.</Text>
    </Banner>
  );
}

const styles = StyleSheet.create({
  texto: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.warning },
});
