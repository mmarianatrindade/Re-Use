import { useNavigation } from '@react-navigation/native';
import { Controller, useWatch, type Control } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import Banner from '../../../components/Banner';
import ChipSelect from '../../../components/ChipSelect';
import PrimaryButton from '../../../components/PrimaryButton';
import { colors } from '../../../constants/colors';
import { fonts } from '../../../constants/fonts';
import { radii } from '../../../constants/radii';
import { ENTREGAS, exigeLocalizacao, type AnuncioFormDados } from '../../../schemas/anuncio';
import type { LocalizacaoPublica } from '../../../types/api';
import { formatarLocalizacao } from '../../../utils/formatarAnuncio';

interface EtapaEntregaProps {
  control: Control<AnuncioFormDados>;
  localizacaoPerfil: LocalizacaoPublica | null;
}

export default function EtapaEntrega({ control, localizacaoPerfil }: EtapaEntregaProps) {
  const navigation = useNavigation();
  const entregas = useWatch({ control, name: 'entregas' });
  const usaLocalizacao = exigeLocalizacao(entregas);

  return (
    <>
      <Controller
        control={control}
        name="entregas"
        render={({ field, fieldState }) => (
          <ChipSelect
            label="Formas de entrega"
            obrigatorio
            multiplo
            layout="lista"
            opcoes={ENTREGAS}
            valor={field.value}
            onChange={(valor) => field.onChange(valor)}
            erro={fieldState.error?.message}
          />
        )}
      />

      {usaLocalizacao ? (
        localizacaoPerfil ? (
          <View style={styles.local}>
            <Text style={styles.localTitulo}>Localização do anúncio</Text>
            <Text style={styles.localTexto}>{formatarLocalizacao(localizacaoPerfil)}</Text>
            <Text style={styles.localDica}>
              Vem do seu perfil. Para retirada, Correios e transportadora mostramos bairro, cidade e CEP; o número do endereço nunca aparece.
            </Text>
          </View>
        ) : (
          <Banner
            tom="aviso"
            titulo="Cadastre seu endereço"
            acao={<PrimaryButton label="Completar perfil" compacto onPress={() => navigation.navigate('EditarPerfil')} />}
          >
            Retirada, Correios e transportadora usam o endereço do seu perfil.
          </Banner>
        )
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  local: {
    backgroundColor: colors.surface,
    borderRadius: radii.inner,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  localTitulo: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
  localTexto: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 22, color: colors.text, marginTop: 6 },
  localDica: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: 8 },
});
