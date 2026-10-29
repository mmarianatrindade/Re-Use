import { useNavigation } from '@react-navigation/native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { fundo } from '../constants/images';
import { fonts } from '../constants/fonts';
import { useSessao } from '../contexts/SessaoContext';
import EmptyState from './EmptyState';
import ImagemCapa from './ImagemCapa';
import PrimaryButton from './PrimaryButton';
import Screen from './Screen';

interface AuthGateProps {
  children: ReactNode;
  titulo: string;
  mensagem: string;
}

// Protege as áreas privadas: sem sessão, explica o motivo e leva para entrar ou criar conta.
export default function AuthGate({ children, titulo, mensagem }: AuthGateProps) {
  const { status } = useSessao();
  const navigation = useNavigation();

  if (status === 'carregando') {
    return (
      <Screen>
        <EmptyState titulo="Carregando" carregando />
      </Screen>
    );
  }

  if (status === 'anonimo') {
    return (
      <Screen>
        <View style={styles.container}>
          <ImagemCapa source={fundo.lazer} proporcao={560 / 420} style={styles.imagem} />
          <Text style={styles.titulo}>{titulo}</Text>
          <Text style={styles.mensagem}>{mensagem}</Text>
          <PrimaryButton label="Entrar" onPress={() => navigation.navigate('Entrar')} style={styles.botao} />
          <PrimaryButton label="Criar conta grátis" variante="secundario" onPress={() => navigation.navigate('Cadastro')} />
        </View>
      </Screen>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  container: { paddingTop: 8 },
  imagem: { maxHeight: 260 },
  titulo: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 34, letterSpacing: -0.6, color: colors.primary, marginTop: 22 },
  mensagem: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.textMuted, marginTop: 10, marginBottom: 28 },
  botao: { marginBottom: 12 },
});
