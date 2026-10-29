import { StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { IDADE_MINIMA, TERMOS_VERSAO } from '../../schemas/comum';
import { formatarData } from '../../utils/formatarAnuncio';

// Resumo dos Termos de Uso e da Política de Privacidade. O aceite fica registrado na API com a versão.
const SECOES = [
  {
    titulo: 'Quem pode usar',
    texto: `O ReUse é destinado a maiores de ${IDADE_MINIMA} anos. Cada pessoa pode ter uma única conta, vinculada ao seu CPF.`,
  },
  {
    titulo: 'Seus dados',
    texto:
      'CPF, telefone, data de nascimento e endereço completo são privados: servem para segurança, comunicação e logística, e nunca aparecem no seu perfil público. O CPF é guardado cifrado.',
  },
  {
    titulo: 'O que fica público',
    texto:
      'Foto, nome público, descrição, bairro, cidade, UF e CEP, reputação, selos e impacto. O número e o complemento do endereço nunca são exibidos.',
  },
  {
    titulo: 'Foto do rosto',
    texto: 'A foto de rosto identifica você nas entregas de trocas e doações. Use uma foto real e atual.',
  },
  {
    titulo: 'Anúncios',
    texto:
      'Publique apenas itens que são seus, com fotos e descrição fiéis ao estado real. Itens proibidos por lei ou perigosos podem ser removidos pela moderação.',
  },
  {
    titulo: 'Custos',
    texto:
      'A venda tem comissão, a primeira troca é gratuita e as seguintes podem ter taxa administrativa. Receber doações é sempre gratuito. Não existe moeda interna nem pontos com valor financeiro.',
  },
  {
    titulo: 'Seus direitos (LGPD)',
    texto: 'Você pode consultar, corrigir e pedir a exclusão dos seus dados. Não vendemos dados pessoais.',
  },
];

export default function TermosScreen() {
  return (
    <Screen larguraMaxima={680}>
      <Text style={styles.titulo}>Termos de Uso e Privacidade</Text>
      <Text style={styles.versao}>Versão de {formatarData(`${TERMOS_VERSAO}T12:00:00Z`)}</Text>

      {SECOES.map((secao) => (
        <View key={secao.titulo} style={styles.secao}>
          <Text style={styles.secaoTitulo}>{secao.titulo}</Text>
          <Text style={styles.secaoTexto}>{secao.texto}</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titulo: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 34, color: colors.primary },
  versao: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, marginTop: 6, marginBottom: 24 },
  secao: { marginBottom: 20 },
  secaoTitulo: { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.text, marginBottom: 6 },
  secaoTexto: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.text },
});
