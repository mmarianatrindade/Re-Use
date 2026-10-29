import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import EmptyState from '../../components/EmptyState';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import TagIcon from '../../components/TagIcon';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { useSessao } from '../../contexts/SessaoContext';
import type { RootScreenProps } from '../../navigation/tipos';
import { obterMensagemErro } from '../../services/api';
import { ativarEmail } from '../../services/authService';

type Estado = { tipo: 'ativando' } | { tipo: 'sucesso'; mensagem: string } | { tipo: 'erro'; mensagem: string };

// Destino do link de ativação enviado por e-mail (/ativar?token=...).
export default function AtivarContaScreen({ navigation, route }: RootScreenProps<'AtivarConta'>) {
  const token = route.params?.token;
  const { status, recarregarUsuario } = useSessao();
  const [estado, setEstado] = useState<Estado>(
    token ? { tipo: 'ativando' } : { tipo: 'erro', mensagem: 'Link incompleto. Abra o link exatamente como chegou no e-mail.' },
  );
  const jaEnviado = useRef(false);

  useEffect(() => {
    // O token é de uso único: evita uma segunda chamada em re-renderizações.
    if (!token || jaEnviado.current) {
      return;
    }
    jaEnviado.current = true;

    ativarEmail(token)
      .then((resposta) => setEstado({ tipo: 'sucesso', mensagem: resposta.mensagem }))
      .catch((erro: unknown) => setEstado({ tipo: 'erro', mensagem: obterMensagemErro(erro) }));
  }, [token]);

  // Com sessão aberta neste aparelho, atualiza o usuário para liberar a publicação.
  // Fica num efeito separado porque, ao abrir pelo link, a sessão ainda pode estar carregando.
  useEffect(() => {
    if (estado.tipo === 'sucesso' && status === 'autenticado') {
      recarregarUsuario().catch(() => null);
    }
  }, [estado.tipo, status, recarregarUsuario]);

  const handleContinuar = () => {
    if (status === 'autenticado') {
      navigation.reset({ index: 0, routes: [{ name: 'Abas', params: { screen: 'Anunciar' } }] });
    } else {
      navigation.reset({ index: 1, routes: [{ name: 'Abas' }, { name: 'Entrar' }] });
    }
  };

  if (estado.tipo === 'ativando') {
    return (
      <Screen>
        <EmptyState titulo="Confirmando seu e-mail" carregando />
      </Screen>
    );
  }

  if (estado.tipo === 'erro') {
    return (
      <Screen>
        <EmptyState
          icone="!"
          titulo="Não deu para confirmar"
          mensagem={`${estado.mensagem} Se você já entrou no app, peça um novo link na tela de perfil.`}
          acao={{ label: 'Ir para o início', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Abas' }] }) }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <TagIcon icon="✓" size={60} />
      <Text style={styles.titulo}>E-mail confirmado</Text>
      <Text style={styles.subtitulo}>{estado.mensagem}</Text>
      <PrimaryButton label={status === 'autenticado' ? 'Publicar meu primeiro item' : 'Entrar'} onPress={handleContinuar} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titulo: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 34, color: colors.primary, marginTop: 18 },
  subtitulo: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.textMuted, marginTop: 8, marginBottom: 28 },
});
