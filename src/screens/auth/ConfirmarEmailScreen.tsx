import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Banner from '../../components/Banner';
import LinkDevBanner from '../../components/LinkDevBanner';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import TagIcon from '../../components/TagIcon';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { useSessao } from '../../contexts/SessaoContext';
import type { RootScreenProps } from '../../navigation/tipos';
import { obterMensagemErro } from '../../services/api';
import { reenviarEmailAtivacao } from '../../services/authService';

// Exibida logo após o cadastro e sempre que a pessoa tenta publicar sem ter confirmado o e-mail.
export default function ConfirmarEmailScreen({ navigation, route }: RootScreenProps<'ConfirmarEmail'>) {
  const { usuario, recarregarUsuario } = useSessao();
  const [linkDev, setLinkDev] = useState(route.params?.linkDev);
  const [aviso, setAviso] = useState<{ tom: 'sucesso' | 'erro' | 'info'; texto: string } | null>(null);
  const [reenviando, setReenviando] = useState(false);
  const [verificando, setVerificando] = useState(false);

  const handleReenviar = async () => {
    setReenviando(true);
    setAviso(null);
    try {
      const resposta = await reenviarEmailAtivacao();
      setLinkDev(resposta.linkDev);
      setAviso({ tom: 'sucesso', texto: resposta.mensagem });
    } catch (erro) {
      setAviso({ tom: 'erro', texto: obterMensagemErro(erro) });
    } finally {
      setReenviando(false);
    }
  };

  const handleVerificar = async () => {
    setVerificando(true);
    setAviso(null);
    try {
      const atual = await recarregarUsuario();
      if (atual?.emailConfirmado) {
        navigation.reset({ index: 0, routes: [{ name: 'Abas', params: { screen: 'Anunciar' } }] });
      } else {
        setAviso({ tom: 'info', texto: 'Ainda não recebemos a confirmação. Abra o link do e-mail e tente de novo.' });
      }
    } catch (erro) {
      setAviso({ tom: 'erro', texto: obterMensagemErro(erro) });
    } finally {
      setVerificando(false);
    }
  };

  return (
    <Screen>
      <TagIcon icon="✉" size={56} />
      <Text style={styles.titulo}>Confirme seu e-mail</Text>
      <Text style={styles.subtitulo}>
        Enviamos um link de ativação para <Text style={styles.email}>{usuario?.email ?? 'seu e-mail'}</Text>. Ele vale por 24 horas.
        Depois de confirmar, você já pode publicar itens.
      </Text>

      {aviso ? <Banner tom={aviso.tom}>{aviso.texto}</Banner> : null}
      <LinkDevBanner link={linkDev} />

      <PrimaryButton label="Já confirmei" onPress={handleVerificar} carregando={verificando} style={styles.botao} />
      <PrimaryButton label="Reenviar e-mail" variante="secundario" onPress={handleReenviar} carregando={reenviando} style={styles.botao} />
      <PrimaryButton
        label="Explorar o ReUse enquanto isso"
        variante="fantasma"
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Abas' }] })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titulo: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 34, color: colors.primary, marginTop: 18 },
  subtitulo: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.textMuted, marginTop: 8, marginBottom: 24 },
  email: { fontFamily: fonts.bodyBold, color: colors.text },
  botao: { marginBottom: 10 },
});
