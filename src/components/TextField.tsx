import { useState, type ReactNode, type Ref } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { radii } from '../constants/radii';

export interface TextFieldProps extends Omit<TextInputProps, 'onChangeText' | 'value' | 'style'> {
  label: string;
  value: string;
  onChangeText: (valor: string) => void;
  erro?: string;
  dica?: string;
  obrigatorio?: boolean;
  // Aplicada a cada digitação (CPF, telefone, CEP, data, preço).
  mascara?: (valor: string) => string;
  // Campo de senha com botão "Mostrar".
  senha?: boolean;
  prefixo?: string;
  acessorio?: ReactNode;
  ref?: Ref<TextInput>;
}

// Campo com rótulo acima, dica e erro abaixo, junto ao campo, e borda que muda no foco.
export default function TextField({
  label,
  value,
  onChangeText,
  erro,
  dica,
  obrigatorio = false,
  mascara,
  senha = false,
  prefixo,
  acessorio,
  ref,
  multiline,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const [focado, setFocado] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  const handleAlterarTexto = (texto: string) => onChangeText(mascara ? mascara(texto) : texto);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {obrigatorio ? <Text style={styles.obrigatorio}> *</Text> : null}
      </Text>

      <View
        style={[
          styles.caixa,
          multiline && styles.caixaMultilinha,
          focado && styles.caixaFocada,
          erro ? styles.caixaErro : null,
        ]}
      >
        {prefixo ? <Text style={styles.prefixo}>{prefixo}</Text> : null}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={handleAlterarTexto}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={senha && !senhaVisivel}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          accessibilityLabel={label}
          accessibilityHint={erro ?? dica}
          onFocus={(evento) => {
            setFocado(true);
            onFocus?.(evento);
          }}
          onBlur={(evento) => {
            setFocado(false);
            onBlur?.(evento);
          }}
          style={[styles.input, multiline && styles.inputMultilinha]}
          {...inputProps}
        />
        {senha ? (
          <Pressable
            onPress={() => setSenhaVisivel((atual) => !atual)}
            accessibilityRole="button"
            accessibilityLabel={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
            hitSlop={8}
            style={styles.botaoSenha}
          >
            <Text style={styles.botaoSenhaTexto}>{senhaVisivel ? 'Ocultar' : 'Mostrar'}</Text>
          </Pressable>
        ) : null}
        {acessorio}
      </View>

      {erro ? (
        <Text style={styles.erro} accessibilityLiveRegion="polite">
          {erro}
        </Text>
      ) : dica ? (
        <Text style={styles.dica}>{dica}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 18 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text, marginBottom: 8 },
  obrigatorio: { color: colors.danger },
  caixa: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.inner,
    paddingHorizontal: 14,
  },
  caixaMultilinha: { alignItems: 'flex-start', paddingVertical: 12 },
  caixaFocada: { borderColor: colors.teal },
  caixaErro: { borderColor: colors.danger, backgroundColor: '#FFFBFA' },
  prefixo: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.textMuted, marginRight: 6 },
  input: {
    flex: 1,
    minHeight: 48,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
  },
  inputMultilinha: { minHeight: 110, paddingTop: 0 },
  botaoSenha: { paddingLeft: 12, paddingVertical: 8 },
  botaoSenhaTexto: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.teal },
  erro: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18, color: colors.danger, marginTop: 6 },
  dica: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: 6 },
});
