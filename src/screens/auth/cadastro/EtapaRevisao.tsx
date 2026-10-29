import { useNavigation } from '@react-navigation/native';
import { Controller, type Control } from 'react-hook-form';
import { Image, StyleSheet, Text, View } from 'react-native';
import Checkbox from '../../../components/Checkbox';
import { colors } from '../../../constants/colors';
import { fonts } from '../../../constants/fonts';
import { radii } from '../../../constants/radii';
import type { CadastroFormDados } from '../../../schemas/usuario';

interface EtapaRevisaoProps {
  control: Control<CadastroFormDados>;
  dados: CadastroFormDados;
}

export default function EtapaRevisao({ control, dados }: EtapaRevisaoProps) {
  const navigation = useNavigation();

  const linhas = [
    { label: 'E-mail', valor: dados.email },
    { label: 'Celular', valor: dados.telefone },
    { label: 'Nascimento', valor: dados.dataNascimento },
    { label: 'Endereço', valor: `${dados.logradouro}, ${dados.numero}${dados.complemento ? ` – ${dados.complemento}` : ''}\n${dados.bairro}, ${dados.cidade}/${dados.uf}  ${dados.cep}` },
  ];

  return (
    <>
      <View style={styles.cartao}>
        <View style={styles.identidade}>
          {dados.fotoUri ? <Image source={{ uri: dados.fotoUri }} style={styles.foto} accessibilityLabel="Sua foto" /> : null}
          <View style={styles.identidadeTextos}>
            <Text style={styles.nome}>{dados.nome}</Text>
            {/* Só o final do CPF: a tela pode estar visível para outras pessoas. */}
            <Text style={styles.cpf}>CPF final {dados.cpf.replace(/\D/g, '').slice(-4, -2)}-{dados.cpf.replace(/\D/g, '').slice(-2)}</Text>
          </View>
        </View>
        {linhas.map((linha) => (
          <View key={linha.label} style={styles.linha}>
            <Text style={styles.linhaLabel}>{linha.label}</Text>
            <Text style={styles.linhaValor}>{linha.valor}</Text>
          </View>
        ))}
      </View>

      <Controller
        control={control}
        name="aceiteTermos"
        render={({ field, fieldState }) => (
          <Checkbox
            marcado={field.value}
            onAlternar={field.onChange}
            erro={fieldState.error?.message}
            accessibilityLabel="Li e aceito os Termos de Uso e a Política de Privacidade e confirmo ter 18 anos ou mais"
          >
            <Text style={styles.termos}>
              Li e aceito os{' '}
              <Text style={styles.link} onPress={() => navigation.navigate('Termos')} accessibilityRole="link">
                Termos de Uso e a Política de Privacidade
              </Text>{' '}
              e confirmo que tenho 18 anos ou mais.
            </Text>
          </Checkbox>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 22,
  },
  identidade: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  foto: { width: 56, height: 56, borderRadius: 28, marginRight: 14 },
  identidadeTextos: { flex: 1 },
  nome: { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.text },
  cpf: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, marginTop: 2, fontVariant: ['tabular-nums'] },
  linha: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  linhaLabel: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textMuted },
  linhaValor: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.text, marginTop: 2 },
  termos: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  link: { fontFamily: fonts.bodyBold, color: colors.teal, textDecorationLine: 'underline' },
});
