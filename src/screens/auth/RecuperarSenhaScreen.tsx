import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, Text } from 'react-native';
import Banner from '../../components/Banner';
import FormTextField from '../../components/FormTextField';
import LinkDevBanner from '../../components/LinkDevBanner';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import type { RootScreenProps } from '../../navigation/tipos';
import { recuperarSenhaSchema, type RecuperarSenhaDados } from '../../schemas/usuario';
import { obterMensagemErro } from '../../services/api';
import { solicitarRecuperacaoSenha } from '../../services/authService';

export default function RecuperarSenhaScreen({ navigation }: RootScreenProps<'RecuperarSenha'>) {
  const [enviado, setEnviado] = useState<{ mensagem: string; linkDev?: string } | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<RecuperarSenhaDados>({
    resolver: zodResolver(recuperarSenhaSchema),
    defaultValues: { email: '' },
  });

  const handleEnviar = handleSubmit(async ({ email }) => {
    setErroGeral(null);
    try {
      setEnviado(await solicitarRecuperacaoSenha(email));
    } catch (erro) {
      setErroGeral(obterMensagemErro(erro));
    }
  });

  return (
    <Screen>
      <Text style={styles.titulo}>Recuperar acesso</Text>
      <Text style={styles.subtitulo}>
        Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha; ele vale por 30 minutos.
      </Text>

      {erroGeral ? <Banner tom="erro">{erroGeral}</Banner> : null}

      {enviado ? (
        <>
          <Banner tom="sucesso" titulo="Confira seu e-mail">
            {`${enviado.mensagem} Veja também a caixa de spam.`}
          </Banner>
          <LinkDevBanner link={enviado.linkDev} />
          <PrimaryButton label="Voltar para entrar" onPress={() => navigation.navigate('Entrar')} />
        </>
      ) : (
        <>
          <FormTextField
            control={control}
            name="email"
            label="E-mail"
            placeholder="voce@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="send"
            onSubmitEditing={handleEnviar}
          />
          <PrimaryButton label="Enviar link" onPress={handleEnviar} carregando={formState.isSubmitting} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titulo: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 34, letterSpacing: -0.6, color: colors.primary },
  subtitulo: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.textMuted, marginTop: 8, marginBottom: 24 },
});
