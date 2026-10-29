import { useRef } from 'react';
import type { Control } from 'react-hook-form';
import type { TextInput } from 'react-native';
import Banner from '../../../components/Banner';
import FormTextField from '../../../components/FormTextField';
import { IDADE_MINIMA } from '../../../schemas/comum';
import type { CadastroFormDados } from '../../../schemas/usuario';
import { mascararCpf, mascararData, mascararTelefone } from '../../../utils/mascaras';

export default function EtapaDadosPessoais({ control }: { control: Control<CadastroFormDados> }) {
  const telefoneRef = useRef<TextInput>(null);
  const nascimentoRef = useRef<TextInput>(null);

  return (
    <>
      <Banner tom="info" titulo="Estes dados são privados">
        CPF, celular e data de nascimento servem para segurança e contato nas negociações. Nunca aparecem no seu perfil.
      </Banner>

      <FormTextField
        control={control}
        name="cpf"
        label="CPF"
        obrigatorio
        placeholder="000.000.000-00"
        keyboardType="number-pad"
        mascara={mascararCpf}
        returnKeyType="next"
        onSubmitEditing={() => telefoneRef.current?.focus()}
        submitBehavior="submit"
        dica="Uma conta por CPF. Guardamos o número cifrado."
      />
      <FormTextField
        control={control}
        name="telefone"
        label="Celular"
        obrigatorio
        ref={telefoneRef}
        placeholder="(11) 91234-5678"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        mascara={mascararTelefone}
        returnKeyType="next"
        onSubmitEditing={() => nascimentoRef.current?.focus()}
        submitBehavior="submit"
      />
      <FormTextField
        control={control}
        name="dataNascimento"
        label="Data de nascimento"
        obrigatorio
        ref={nascimentoRef}
        placeholder="DD/MM/AAAA"
        keyboardType="number-pad"
        autoComplete="birthdate-full"
        mascara={mascararData}
        dica={`O ReUse é para maiores de ${IDADE_MINIMA} anos.`}
      />
    </>
  );
}
