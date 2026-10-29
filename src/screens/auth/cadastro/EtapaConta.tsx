import { useRef, useState } from 'react';
import { Controller, type Control } from 'react-hook-form';
import { Pressable, StyleSheet, Text, type TextInput } from 'react-native';
import ChipSelect from '../../../components/ChipSelect';
import FormTextField from '../../../components/FormTextField';
import { colors } from '../../../constants/colors';
import { fonts } from '../../../constants/fonts';
import { TIPOS_ANUNCIANTE } from '../../../schemas/catalogo';
import type { CadastroFormDados } from '../../../schemas/usuario';

export default function EtapaConta({ control }: { control: Control<CadastroFormDados> }) {
  const emailRef = useRef<TextInput>(null);
  const senhaRef = useRef<TextInput>(null);
  const confirmarRef = useRef<TextInput>(null);
  // Quase todas as contas são de pessoa: as outras opções ficam atrás de um link.
  const [mostrarTipos, setMostrarTipos] = useState(false);

  return (
    <>
      <FormTextField
        control={control}
        name="nome"
        label="Nome completo"
        obrigatorio
        placeholder="Como no seu documento"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        submitBehavior="submit"
        dica="No perfil público aparece só o primeiro nome e a inicial do sobrenome. Você pode mudar depois."
      />
      <Controller
        control={control}
        name="tipoConta"
        render={({ field, fieldState }) =>
          mostrarTipos || field.value !== 'pessoa' ? (
            <ChipSelect
              label="Você vai anunciar como"
              opcoes={TIPOS_ANUNCIANTE}
              valor={field.value}
              onChange={(valor) => field.onChange(valor)}
              erro={fieldState.error?.message}
            />
          ) : (
            <Pressable onPress={() => setMostrarTipos(true)} accessibilityRole="button" hitSlop={6} style={styles.link}>
              <Text style={styles.linkTexto}>Anuncio por uma empresa, escola ou organização</Text>
            </Pressable>
          )
        }
      />
      <FormTextField
        control={control}
        name="email"
        label="E-mail"
        obrigatorio
        ref={emailRef}
        placeholder="voce@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => senhaRef.current?.focus()}
        submitBehavior="submit"
        dica="Enviaremos um link para confirmar."
      />
      <FormTextField
        control={control}
        name="senha"
        label="Senha"
        obrigatorio
        ref={senhaRef}
        senha
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmarRef.current?.focus()}
        submitBehavior="submit"
        dica="Pelo menos 8 caracteres, com letras e números."
      />
      <FormTextField
        control={control}
        name="confirmarSenha"
        label="Confirme a senha"
        obrigatorio
        ref={confirmarRef}
        senha
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
      />
    </>
  );
}

const styles = StyleSheet.create({
  link: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginTop: -6, marginBottom: 12 },
  linkTexto: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.teal },
});
