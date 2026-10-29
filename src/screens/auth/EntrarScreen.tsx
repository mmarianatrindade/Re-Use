import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View, useWindowDimensions, type TextInput } from 'react-native';
import Banner from '../../components/Banner';
import ImagemCapa from '../../components/ImagemCapa';
import FormTextField from '../../components/FormTextField';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { fundo } from '../../constants/images';
import { useSessao } from '../../contexts/SessaoContext';
import type { RootScreenProps } from '../../navigation/tipos';
import { loginSchema, type LoginDados } from '../../schemas/usuario';
import { ApiError, obterMensagemErro } from '../../services/api';
import { chavesLocais, lerLocal } from '../../services/armazenamento';

export default function EntrarScreen({ navigation }: RootScreenProps<'Entrar'>) {
  const { entrar } = useSessao();
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const senhaRef = useRef<TextInput>(null);
  // Em telas baixas a imagem sai: com o teclado aberto, o campo de senha precisa continuar visível.
  const { height } = useWindowDimensions();

  const { control, handleSubmit, setValue, formState } = useForm<LoginDados>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', senha: '' },
  });

  // Preenche o último e-mail usado neste aparelho (guardado no AsyncStorage).
  useEffect(() => {
    lerLocal<string>(chavesLocais.ultimoEmail).then((email) => {
      if (email) {
        setValue('email', email);
      }
    });
  }, [setValue]);

  const handleEntrar = handleSubmit(async (dados) => {
    setErroGeral(null);
    try {
      await entrar(dados);
      // Aberta direto por URL (web), não há tela anterior: vai para o início.
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Abas' }] });
      }
    } catch (erro) {
      setErroGeral(erro instanceof ApiError ? erro.message : obterMensagemErro(erro));
    }
  });

  return (
    <Screen>
      {height >= 760 ? <ImagemCapa source={fundo.casa} proporcao={560 / 360} style={styles.imagem} /> : null}
      <Text style={styles.titulo}>Que bom ver você de novo</Text>
      <Text style={styles.subtitulo}>Entre para publicar itens, acompanhar seus anúncios e ver seu perfil.</Text>

      {erroGeral ? <Banner tom="erro">{erroGeral}</Banner> : null}

      <FormTextField
        control={control}
        name="email"
        label="E-mail"
        placeholder="voce@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => senhaRef.current?.focus()}
        submitBehavior="submit"
      />
      <FormTextField
        control={control}
        name="senha"
        label="Senha"
        ref={senhaRef}
        senha
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleEntrar}
      />

      <Pressable
        onPress={() => navigation.navigate('RecuperarSenha')}
        accessibilityRole="link"
        style={styles.link}
        hitSlop={8}
      >
        <Text style={styles.linkTexto}>Esqueci minha senha</Text>
      </Pressable>

      <PrimaryButton label="Entrar" onPress={handleEntrar} carregando={formState.isSubmitting} />

      <View style={styles.rodape}>
        <Text style={styles.rodapeTexto}>Ainda não tem conta?</Text>
        <PrimaryButton label="Criar conta grátis" variante="secundario" onPress={() => navigation.replace('Cadastro')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  imagem: { marginBottom: 22, maxHeight: 220 },
  titulo: { fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 36, letterSpacing: -0.8, color: colors.primary },
  subtitulo: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.textMuted, marginTop: 8, marginBottom: 28 },
  link: { alignSelf: 'flex-start', marginTop: -4, marginBottom: 24, minHeight: 32, justifyContent: 'center' },
  linkTexto: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.teal },
  rodape: { marginTop: 36, paddingTop: 24, borderTopWidth: 1, borderTopColor: colors.border, gap: 12 },
  rodapeTexto: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text },
});
