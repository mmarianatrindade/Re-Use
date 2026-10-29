import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, Text, type TextInput } from 'react-native';
import Banner from '../../components/Banner';
import FormTextField from '../../components/FormTextField';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { useSessao } from '../../contexts/SessaoContext';
import type { RootScreenProps } from '../../navigation/tipos';
import { redefinirSenhaFormSchema, type RedefinirSenhaFormDados } from '../../schemas/usuario';
import { obterMensagemErro } from '../../services/api';
import { redefinirSenha } from '../../services/authService';

export default function RedefinirSenhaScreen({ navigation, route }: RootScreenProps<'RedefinirSenha'>) {
  const token = route.params?.token;
  const { status, sair } = useSessao();
  const [concluido, setConcluido] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const confirmarRef = useRef<TextInput>(null);

  const { control, handleSubmit, formState } = useForm<RedefinirSenhaFormDados>({
    resolver: zodResolver(redefinirSenhaFormSchema),
    defaultValues: { senha: '', confirmarSenha: '' },
  });

  const handleSalvar = handleSubmit(async ({ senha }) => {
    if (!token) {
      return;
    }
    setErroGeral(null);
    try {
      await redefinirSenha(token, senha);
      // A API encerra todas as sessões; o aparelho também sai.
      if (status === 'autenticado') {
        await sair();
      }
      setConcluido(true);
    } catch (erro) {
      setErroGeral(obterMensagemErro(erro));
    }
  });

  if (!token) {
    return (
      <Screen>
        <Banner tom="erro" titulo="Link incompleto">
          Abra o link exatamente como chegou no e-mail ou peça um novo.
        </Banner>
        <PrimaryButton label="Pedir novo link" onPress={() => navigation.replace('RecuperarSenha')} />
      </Screen>
    );
  }

  if (concluido) {
    return (
      <Screen>
        <Text style={styles.titulo}>Senha alterada</Text>
        <Text style={styles.subtitulo}>Por segurança, encerramos as sessões abertas em todos os aparelhos. Entre com a nova senha.</Text>
        <PrimaryButton label="Entrar" onPress={() => navigation.replace('Entrar')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.titulo}>Criar nova senha</Text>
      <Text style={styles.subtitulo}>Use pelo menos 8 caracteres, com letras e números.</Text>

      {erroGeral ? (
        <Banner
          tom="erro"
          acao={<PrimaryButton label="Pedir novo link" variante="secundario" compacto onPress={() => navigation.replace('RecuperarSenha')} />}
        >
          {erroGeral}
        </Banner>
      ) : null}

      <FormTextField
        control={control}
        name="senha"
        label="Nova senha"
        senha
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmarRef.current?.focus()}
        submitBehavior="submit"
      />
      <FormTextField
        control={control}
        name="confirmarSenha"
        label="Confirme a nova senha"
        ref={confirmarRef}
        senha
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={handleSalvar}
      />
      <PrimaryButton label="Salvar nova senha" onPress={handleSalvar} carregando={formState.isSubmitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titulo: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 34, letterSpacing: -0.6, color: colors.primary },
  subtitulo: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.textMuted, marginTop: 8, marginBottom: 24 },
});
