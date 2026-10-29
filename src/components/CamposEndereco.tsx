import { useRef, useState } from 'react';
import type { Control, FieldValues, Path, PathValue, UseFormSetFocus, UseFormSetValue } from 'react-hook-form';
import { ActivityIndicator, StyleSheet, Text, View, type TextInput } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { extrairDigitos } from '../schemas/comum';
import { buscarEnderecoPorCep } from '../services/cepService';
import type { EnderecoSugerido } from '../types/api';
import { mascararCep } from '../utils/mascaras';
import BuscaEndereco from './BuscaEndereco';
import FormTextField from './FormTextField';

// Campos de endereço que os formulários de cadastro e de edição de perfil têm em comum.
interface CamposEnderecoForm extends FieldValues {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

interface CamposEnderecoProps<T extends CamposEnderecoForm> {
  control: Control<T>;
  setValue: UseFormSetValue<T>;
  setFocus: UseFormSetFocus<T>;
}

// Os nomes existem em T (garantido pela restrição acima); o cast só traduz para o tipo de caminho do RHF.
const campo = <T extends CamposEnderecoForm>(nome: keyof CamposEnderecoForm & string) => nome as Path<T>;

export default function CamposEndereco<T extends CamposEnderecoForm>({ control, setValue, setFocus }: CamposEnderecoProps<T>) {
  const [buscando, setBuscando] = useState(false);
  const [cepNaoEncontrado, setCepNaoEncontrado] = useState(false);
  const ultimoCepBuscado = useRef('');
  const complementoRef = useRef<TextInput>(null);

  const preencher = (nome: keyof CamposEnderecoForm & string, valor: string) =>
    setValue(campo<T>(nome), valor as PathValue<T, Path<T>>, { shouldValidate: valor.length > 0 });

  // Ao completar os 8 dígitos, busca o endereço e leva o foco direto para o número.
  const handleCepAlterado = async (valor: string) => {
    const digitos = extrairDigitos(valor);
    if (digitos.length !== 8 || digitos === ultimoCepBuscado.current) {
      return;
    }
    ultimoCepBuscado.current = digitos;
    setBuscando(true);
    setCepNaoEncontrado(false);

    const endereco = await buscarEnderecoPorCep(digitos);
    setBuscando(false);

    if (!endereco) {
      setCepNaoEncontrado(true);
      return;
    }
    preencher('logradouro', endereco.logradouro);
    preencher('bairro', endereco.bairro);
    preencher('cidade', endereco.cidade);
    preencher('uf', endereco.uf);
    setTimeout(() => setFocus(campo<T>(endereco.logradouro ? 'numero' : 'logradouro')), 50);
  };

  // Endereço escolhido nas sugestões: preenche só o que veio e leva o foco ao que falta (normalmente o número).
  const handleSugestao = (endereco: EnderecoSugerido) => {
    if (endereco.cep) {
      ultimoCepBuscado.current = endereco.cep;
      preencher('cep', mascararCep(endereco.cep));
    }
    if (endereco.logradouro) preencher('logradouro', endereco.logradouro);
    if (endereco.numero) preencher('numero', endereco.numero);
    if (endereco.bairro) preencher('bairro', endereco.bairro);
    if (endereco.cidade) preencher('cidade', endereco.cidade);
    if (endereco.uf) preencher('uf', endereco.uf);
    setCepNaoEncontrado(false);
    setTimeout(() => setFocus(campo<T>(endereco.numero ? 'complemento' : 'numero')), 50);
  };

  return (
    <View>
      <BuscaEndereco onSelecionar={handleSugestao} />
      <FormTextField
        control={control}
        name={campo<T>('cep')}
        label="CEP"
        obrigatorio
        placeholder="00000-000"
        keyboardType="number-pad"
        autoComplete="postal-code"
        textContentType="postalCode"
        mascara={mascararCep}
        aoAlterar={(valor) => void handleCepAlterado(valor)}
        dica={cepNaoEncontrado ? 'CEP não encontrado automaticamente: preencha o endereço abaixo.' : 'Preenchemos rua, bairro e cidade para você.'}
        acessorio={buscando ? <ActivityIndicator color={colors.primary} /> : null}
      />

      <FormTextField control={control} name={campo<T>('logradouro')} label="Rua" obrigatorio autoComplete="street-address" />

      <View style={styles.linha}>
        <View style={styles.numero}>
          <FormTextField
            control={control}
            name={campo<T>('numero')}
            label="Número"
            obrigatorio
            keyboardType="default"
            returnKeyType="next"
            onSubmitEditing={() => complementoRef.current?.focus()}
            submitBehavior="submit"
          />
        </View>
        <View style={styles.complemento}>
          <FormTextField control={control} name={campo<T>('complemento')} label="Complemento" ref={complementoRef} placeholder="Apto, bloco" />
        </View>
      </View>

      <FormTextField control={control} name={campo<T>('bairro')} label="Bairro" obrigatorio />

      <View style={styles.linha}>
        <View style={styles.cidade}>
          <FormTextField control={control} name={campo<T>('cidade')} label="Cidade" obrigatorio />
        </View>
        <View style={styles.uf}>
          <FormTextField
            control={control}
            name={campo<T>('uf')}
            label="UF"
            obrigatorio
            autoCapitalize="characters"
            maxLength={2}
            mascara={(valor) => valor.replace(/[^a-zA-Z]/g, '').toUpperCase()}
          />
        </View>
      </View>

      <Text style={styles.privacidade}>
        No seu perfil aparecem só CEP, bairro, cidade e UF. Rua, número e complemento ficam privados.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', gap: 12 },
  numero: { width: 110 },
  complemento: { flex: 1 },
  cidade: { flex: 1 },
  uf: { width: 90 },
  privacidade: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.textMuted, marginTop: -4 },
});
