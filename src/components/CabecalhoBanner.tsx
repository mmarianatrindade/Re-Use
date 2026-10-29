import { useState } from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { fundo, images } from '../constants/images';
import { MAX_CONTENT_WIDTH, usaCabecalhoWeb } from '../hooks/useResponsive';

// ==CONSTANTES==
// Proporção da colagem original (bg_hero.webp: 1672 × 941).
const PROPORCAO_COLAGEM = 941 / 1672;
const ALTURA_BANNER = 92;
// No site em tela larga o banner é mais alto e o título maior (há espaço e o logo já está no cabeçalho).
const ALTURA_BANNER_WEB = 132;
// A colagem é ampliada para o recorte mostrar poucos objetos, com detalhe, em vez da cena inteira.
const AMPLIACAO = 1.8;
const LARGURA_MINIMA_IMAGEM = 720;
// Proporção do logo com nome (logo_nome_circular_horizontal.webp: 1200 × 299).
const LARGURA_LOGO = 104;
const ALTURA_LOGO = Math.round((LARGURA_LOGO * 299) / 1200);

// ==TIPOS==
interface CabecalhoBannerProps {
  titulo: string;
  // Cor da inicial, seguindo o título do hero da Home.
  corInicial?: string;
}

// ==FUNCOES==
// Posição sorteada uma vez por montagem: cada aba mostra um pedaço diferente da colagem.
function sortearRecorte() {
  return { x: Math.random(), y: Math.random() };
}

export default function CabecalhoBanner({ titulo, corInicial = colors.destaqueReuso }: CabecalhoBannerProps) {
  // ==HOOKS==
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cabecalhoWeb = usaCabecalhoWeb(width);

  // ==ESTADOS==
  const [recorte] = useState(sortearRecorte);

  // ==RENDER==
  const alturaTotal = (cabecalhoWeb ? ALTURA_BANNER_WEB : ALTURA_BANNER) + insets.top;
  const larguraImagem = Math.max(width * AMPLIACAO, LARGURA_MINIMA_IMAGEM);
  const alturaImagem = Math.max(larguraImagem * PROPORCAO_COLAGEM, alturaTotal);
  const tituloMaiusculo = titulo.toLocaleUpperCase('pt-BR');

  return (
    <View style={[styles.banner, { height: alturaTotal }]} accessibilityRole="header">
      <Image
        source={fundo.hero}
        resizeMode="cover"
        style={{
          position: 'absolute',
          width: larguraImagem,
          height: alturaImagem,
          left: -recorte.x * Math.max(larguraImagem - width, 0),
          top: -recorte.y * (alturaImagem - alturaTotal),
        }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      {/* Véu escuro: mantém o contraste do título sobre qualquer recorte sorteado. */}
      <View style={styles.veu} />

      <View style={[styles.conteudo, cabecalhoWeb && styles.conteudoWeb, { paddingTop: insets.top }]}>
        <View style={styles.textos}>
          <Text style={[styles.titulo, cabecalhoWeb && styles.tituloWeb]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            <Text style={{ color: corInicial }}>{tituloMaiusculo.charAt(0)}</Text>
            {tituloMaiusculo.slice(1)}
          </Text>
          <View style={[styles.traco, { backgroundColor: corInicial }]} />
        </View>

        {/* Logo no canto superior direito, com luz branca atrás: o "Re" verde-escuro some sobre a colagem escura.
            No site em tela larga ele já aparece no cabeçalho. */}
        {!cabecalhoWeb ? (
          <View style={styles.logo} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View pointerEvents="none" style={styles.logoLuz} />
            <Image source={images.logoNomeHorizontal} style={{ width: LARGURA_LOGO, height: ALTURA_LOGO }} resizeMode="contain" />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { width: '100%', overflow: 'hidden', backgroundColor: colors.ink },
  veu: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.ink, opacity: 0.58 },
  conteudo: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  // Alinhado à mesma largura máxima do conteúdo das telas.
  conteudoWeb: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', paddingHorizontal: 40 },
  textos: { flex: 1, marginRight: 12 },
  logo: { alignSelf: 'flex-start', marginTop: 12, alignItems: 'center', justifyContent: 'center' },
  logoLuz: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: 6,
    right: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    boxShadow: '0px 0px 18px 10px rgba(255, 255, 255, 0.45)',
  },
  titulo: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.8,
    color: colors.textOnDark,
  },
  tituloWeb: { fontSize: 40, lineHeight: 46, letterSpacing: -1.2 },
  traco: { width: 28, height: 4, borderRadius: 2, marginTop: 6 },
});
