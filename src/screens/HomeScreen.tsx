import { useBottomTabBarHeight, type BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useRef, useState } from "react";
import { Animated, Image, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import CarrosselModalidade from "../components/CarrosselModalidade";
import ModalityCard from "../components/ModalityCard";
import ModalityCarousel from "../components/ModalityCarousel";
import PrimaryButton from "../components/PrimaryButton";
import Scrim from "../components/Scrim";
import SectionHeader from "../components/SectionHeader";
import StepCard from "../components/StepCard";
import { colors } from "../constants/colors";
import { fonts } from "../constants/fonts";
import { fundo, images, photos } from "../constants/images";
import { radii } from "../constants/radii";
import { LARGURA_LEITURA, tipografia } from "../constants/tipografia";
import { useSessao } from "../contexts/SessaoContext";
import { photoCredits } from "../data/photoCredits";
import { cartoesModalidade, modalities, steps, type CartaoModalidadeId } from "../data/reuseData";
import { useAnunciosHome } from "../hooks/useAnunciosHome";
import type { AbasParamList } from "../navigation/tipos";
import { useReduceMotion } from "../hooks/useReduceMotion";
import { ALTURA_CABECALHO_WEB, MAX_CONTENT_WIDTH, columnWidth, useResponsive } from "../hooks/useResponsive";
import type { EstatisticasPlataforma } from "../types/api";
import { showMessage } from "../utils/showMessage";

// No navegador o Animated roda em JS; no celular as animações de scroll vão para a thread nativa.
const USE_NATIVE_DRIVER = Platform.OS !== "web";
// Espaço entre a área segura do topo e o logo do hero.
const DISTANCIA_LOGO_TOPO = 48;
const GRID_GAP = 20;
// Espaço entre o topo da tela (abaixo da área segura) e a busca ao tocar em "Início".
const MARGEM_BUSCA_TOPO = 16;

// Título do hero: uma palavra por linha, com a inicial na cor da modalidade (R = reúso, verde da marca).
const TITULO_HERO = [
  { palavra: "TROQUE", cor: colors.destaqueTroca },
  { palavra: "VENDA", cor: colors.destaqueVenda },
  { palavra: "DOE", cor: colors.destaqueDoacao },
  { palavra: "REUTILIZE", cor: colors.destaqueReuso },
];

function plural(valor: number, singular: string, pluralTexto: string) {
  return `${valor.toLocaleString("pt-BR")} ${valor === 1 ? singular : pluralTexto}`;
}

// Frase de impacto só com números maiores que zero: "0 doações" não diz nada a quem chega.
function montarFraseImpacto(numeros: EstatisticasPlataforma) {
  const partes: string[] = [];
  if (numeros.anunciosDisponiveis > 0)
    partes.push(plural(numeros.anunciosDisponiveis, "anúncio disponível", "anúncios disponíveis"));
  if (numeros.itensReutilizados > 0) {
    const doacoes =
      numeros.doacoesConcluidas > 0 ? `, ${plural(numeros.doacoesConcluidas, "deles por doação", "deles por doação")}` : "";
    partes.push(
      `${plural(numeros.itensReutilizados, "item que já ganhou nova história", "itens que já ganharam nova história")}${doacoes}`,
    );
  }
  if (numeros.participantes > 0) partes.push(plural(numeros.participantes, "pessoa participando", "pessoas participando"));
  if (numeros.organizacoes > 0) partes.push(plural(numeros.organizacoes, "organização", "organizações"));
  if (partes.length === 0) {
    return null;
  }
  const lista = partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join("; ")} e ${partes[partes.length - 1]}`;
  return `Hoje o ReUse tem ${lista}.`;
}

// Home do app: encontrar coisas perto de casa. As seções que explicam o ReUse aparecem só para quem ainda não tem conta.
export default function HomeScreen() {
  const navigation = useNavigation();
  const { status } = useSessao();
  const autenticado = status === "autenticado";
  const anunciosHome = useAnunciosHome();
  const { width, height, isTablet, isDesktop, gutter, contentWidth, cabecalhoWeb } = useResponsive();
  const reduceMotion = useReduceMotion();

  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [busca, setBusca] = useState("");
  const [passouHero, setPassouHero] = useState(false);
  const insets = useSafeAreaInsets();
  // Posição da busca na página (conteúdo do hero + busca dentro dele), medida no layout.
  const posicaoConteudoHero = useRef(0);
  const posicaoBusca = useRef(0);

  // O hero ocupa só a área visível: sem descontar a barra de abas, o conteúdo ficava atrás dela.
  const alturaBarraAbas = useBottomTabBarHeight();
  // No site em tela larga o menu é o cabeçalho do topo (a altura da barra de abas vem 0 nesse caso).
  const heroHeight = Math.max(height - (cabecalhoWeb ? ALTURA_CABECALHO_WEB : alturaBarraAbas), 560);
  const heroTitleSize = Math.min(isDesktop ? 96 : isTablet ? 76 : 56, Math.floor(contentWidth / 6.2));
  const larguraCartaoModalidade = columnWidth(contentWidth, width >= 1200 ? 4 : 2, GRID_GAP);
  const stepColumns = width >= 1000 ? 4 : width >= 640 ? 2 : 1;
  const stepWidth = columnWidth(contentWidth, stepColumns, GRID_GAP);
  const fraseImpacto = anunciosHome.estatisticas ? montarFraseImpacto(anunciosHome.estatisticas) : null;

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: USE_NATIVE_DRIVER,
    listener: (evento: { nativeEvent: { contentOffset: { y: number } } }) =>
      setPassouHero(evento.nativeEvent.contentOffset.y > heroHeight - 40),
  });

  // Tocar em "Início" no menu leva à busca no topo da tela, com os anúncios logo abaixo.
  useEffect(() => {
    // A Home fica numa pilha dentro das abas: o menu inferior é o navegador pai.
    const abas = navigation.getParent<BottomTabNavigationProp<AbasParamList>>();
    if (!abas) {
      return undefined;
    }
    return abas.addListener('tabPress', (evento) => {
      if (evento.target?.startsWith('Inicio') !== true) {
        return;
      }
      const destino = Math.max(posicaoConteudoHero.current + posicaoBusca.current - insets.top - MARGEM_BUSCA_TOPO, 0);
      // Espera a troca de aba (ou a volta ao início da pilha) antes de rolar.
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: destino, animated: !reduceMotion }));
    });
  }, [navigation, insets.top, reduceMotion]);

  // Abre a aba Anúncios já filtrada ("Reutilizar" e a busca mostram todas as modalidades).
  const abrirAnuncios = (id: CartaoModalidadeId, texto?: string) => {
    navigation.navigate("Abas", {
      screen: "Anuncios",
      params: {
        screen: "AnunciosLista",
        params: id === "reutilizar" ? { busca: texto ?? "", buscaEm: Date.now() } : { modalidade: id, buscaEm: Date.now() },
      },
    });
  };

  const handleBuscar = () => abrirAnuncios("reutilizar", busca.trim());
  const handleAnuncio = (anuncioId: string) => navigation.navigate("AnuncioDetalhe", { anuncioId });

  const handleCreditos = () => {
    showMessage(
      "Créditos das fotos",
      photoCredits.map((credito) => `${credito.subject}: ${credito.author} (${credito.license})`).join("\n") +
        "\n\nFonte: Wikimedia Commons.",
    );
  };

  // Único movimento automático: parallax da foto do hero, desligado com "reduzir movimento".
  const heroImageStyle = reduceMotion
    ? undefined
    : {
        transform: [
          {
            translateY: scrollY.interpolate({
              inputRange: [-heroHeight, 0, heroHeight],
              outputRange: [-heroHeight / 2, 0, heroHeight * 0.45],
              extrapolate: "clamp",
            }),
          },
          { scale: scrollY.interpolate({ inputRange: [-heroHeight, 0, 1], outputRange: [2, 1, 1], extrapolate: "clamp" }) },
        ],
      };

  const container = [styles.container, { paddingHorizontal: gutter }];
  const secao = { paddingVertical: isDesktop ? 88 : 48 };

  return (
    <View style={styles.root}>
      <StatusBar barStyle={passouHero ? "dark-content" : "light-content"} translucent backgroundColor="transparent" />

      <Animated.ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero: a colagem e o título colorido são o único elemento "alto" da Home */}
        <View style={[styles.hero, { height: heroHeight }]}>
          <Animated.Image source={fundo.hero} style={[styles.heroImage, heroImageStyle]} resizeMode="cover" />
          <Scrim from={0.35} to={0.94} />

          {/* Logo no topo do hero: rola junto com a página (não é um cabeçalho fixo).
              No site em tela larga o logo já está no cabeçalho, então o hero fica só com a colagem e o título. */}
          {!cabecalhoWeb ? (
            <View style={[styles.heroLogo, { top: insets.top + DISTANCIA_LOGO_TOPO }]} accessibilityRole="image" accessibilityLabel="ReUse">
              {/* Luz branca atrás do logo: o "Re" verde-escuro perde contraste na colagem escura. */}
              <View pointerEvents="none" style={styles.heroLogoLuz} />
              <Image source={images.logoHorizontal} style={styles.heroLogoImagem} resizeMode="contain" />
            </View>
          ) : null}

          <View
            style={[styles.heroContent, { paddingHorizontal: gutter, paddingBottom: isTablet ? 64 : 28 }]}
            onLayout={(evento) => (posicaoConteudoHero.current = evento.nativeEvent.layout.y)}
          >
            <Text
              style={[styles.heroTitle, { fontSize: heroTitleSize, lineHeight: heroTitleSize * 0.98 }]}
              accessibilityRole="header"
              accessibilityLabel="Troque, venda, doe e reutilize."
            >
              {TITULO_HERO.map((linha, indice) => (
                <Text key={linha.palavra}>
                  <Text style={{ color: linha.cor }}>{linha.palavra[0]}</Text>
                  {linha.palavra.slice(1)}
                  {indice < TITULO_HERO.length - 1 ? "\n" : ""}
                </Text>
              ))}
            </Text>

            {isTablet ? (
              <Text style={styles.heroText}>
                Todo objeto guarda uma história. Dê a próxima para o que está parado em casa, e encontre perto de você o que
                alguém já não usa.
              </Text>
            ) : null}

            <View style={[styles.heroSearch, isTablet && styles.heroSearchWide]} onLayout={(evento) => (posicaoBusca.current = evento.nativeEvent.layout.y)}>
              <TextInput
                style={styles.heroSearchInput}
                value={busca}
                onChangeText={setBusca}
                onSubmitEditing={handleBuscar}
                placeholder="O que procura?"
                placeholderTextColor={colors.textMuted}
                returnKeyType="search"
                accessibilityLabel="Buscar anúncios"
              />
              <Pressable
                onPress={handleBuscar}
                accessibilityRole="button"
                style={({ pressed }) => [styles.heroSearchButton, pressed && styles.pressionado]}
              >
                <Text style={styles.heroSearchButtonText}>Buscar</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Nas proximidades: um carrossel por modalidade */}
        <View style={[container, secao]}>
          <SectionHeader
            title="NAS PROXIMIDADES"
            umaLinha
            subtitle={
              autenticado
                ? "O que seus vizinhos estão passando adiante, do mais perto para o mais longe."
                : "O que está sendo passado adiante agora. Entre na sua conta para ver primeiro o que está mais perto de você."
            }
            large={isTablet}
          />
          {anunciosHome.erro ? (
            <View style={styles.erro}>
              <Text style={tipografia.tituloBloco}>Não foi possível carregar os anúncios.</Text>
              <Text style={[tipografia.apoio, styles.erroTexto]}>{anunciosHome.erro}</Text>
              <PrimaryButton
                label="Tentar de novo"
                variante="secundario"
                compacto
                onPress={() => void anunciosHome.recarregar()}
                style={styles.botaoInline}
              />
            </View>
          ) : (
            modalities.map((modalidade) => (
              <CarrosselModalidade
                key={modalidade.id}
                modalidade={modalidade}
                titulo={modalidade.label}
                anuncios={anunciosHome.porModalidade[modalidade.id]}
                gutter={gutter}
                onAnuncioPress={handleAnuncio}
                onVerMais={() => abrirAnuncios(modalidade.id)}
              />
            ))
          )}
        </View>

        {/* Impacto: números reais numa frase, só os maiores que zero */}
        {fraseImpacto ? (
          <View style={styles.impacto}>
            <View style={container}>
              <Text style={[styles.impactoTexto, isTablet && styles.impactoTextoGrande]}>{fraseImpacto}</Text>
              <Text style={styles.impactoNota}>
                Cada número é gente de verdade fazendo as coisas boas continuarem circulando.
              </Text>
            </View>
          </View>
        ) : null}

        {/* Modalidades (venda, troca, doação e reutilizar): para todos, logado ou não */}
        <View style={[container, secao]}>
          <SectionHeader
            title="Vender, trocar, doar e reutilizar."
            subtitle="Todo objeto tem mais de uma vida. O ReUse aproxima quem quer passar adiante de quem está procurando."
            large={isTablet}
          />
          {width >= 900 ? (
            <View style={[styles.grid, { gap: GRID_GAP }]}>
              {cartoesModalidade.map((cartao) => (
                <ModalityCard
                  key={cartao.id}
                  modality={cartao}
                  onPress={() => abrirAnuncios(cartao.id)}
                  style={{ width: larguraCartaoModalidade }}
                />
              ))}
            </View>
          ) : (
            <ModalityCarousel
              modalities={cartoesModalidade}
              contentWidth={contentWidth}
              gutter={gutter}
              onSelect={(id) => abrirAnuncios(id)}
            />
          )}
        </View>

        {/* Para quem ainda não tem conta: como funciona e o convite */}
        {!autenticado ? (
          <>
            <View style={[container, secao]}>
              <SectionHeader
                title="Como funciona"
                subtitle="Do armário de uma casa para as mãos de outra pessoa, em quatro passos."
                large={isTablet}
              />
              <View style={[styles.grid, { columnGap: GRID_GAP, rowGap: 32 }]}>
                {steps.map((etapa, indice) => (
                  <StepCard
                    key={etapa.title}
                    icon={etapa.icon}
                    title={etapa.title}
                    text={etapa.text}
                    isLast={stepColumns === 1 || (indice + 1) % stepColumns === 0 || indice === steps.length - 1}
                    style={{ width: stepWidth }}
                  />
                ))}
              </View>
            </View>

            <View style={styles.cta}>
              <Image source={photos.cta} style={styles.ctaImage} resizeMode="cover" />
              <Scrim from={0.6} to={0.92} />
              <View style={[container, styles.ctaContent]}>
                <Text style={[styles.ctaTitle, isTablet && styles.ctaTitleLarge]}>Tem algo parado em casa?</Text>
                <Text style={styles.ctaText}>
                  Aquele objeto que só ocupa espaço pode ser exatamente o que alguém procura. Crie sua conta e comece a próxima
                  história dele.
                </Text>
                <PrimaryButton
                  label="Criar conta grátis"
                  onPress={() => navigation.navigate("Cadastro")}
                  style={styles.ctaBotao}
                />
                <Pressable
                  onPress={() => navigation.navigate("Entrar")}
                  accessibilityRole="button"
                  hitSlop={8}
                  style={styles.ctaLink}
                >
                  <Text style={styles.ctaLinkTexto}>Já tenho conta</Text>
                </Pressable>
              </View>
            </View>
          </>
        ) : null}

        {/* Rodapé */}
        <View style={styles.rodape}>
          <View style={container}>
            <View style={styles.rodapeMarca}>
              <Image source={images.logoSimbolo} style={styles.rodapeSimbolo} resizeMode="contain" />
              <Text style={styles.rodapeNome}>ReUse</Text>
            </View>
            <Text style={styles.rodapeFrase}>Novas histórias para um mundo melhor.</Text>
            <View style={styles.rodapeLinks}>
              <Pressable onPress={() => navigation.navigate("Termos")} accessibilityRole="link" hitSlop={8}>
                <Text style={styles.rodapeLink}>Termos e privacidade</Text>
              </Pressable>
              <Pressable onPress={handleCreditos} accessibilityRole="link" hitSlop={8}>
                <Text style={styles.rodapeLink}>Créditos das fotos</Text>
              </Pressable>
            </View>
            <Text style={styles.rodapePequeno}>© 2026 ReUse. Feito para que as coisas boas continuem circulando.</Text>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  container: { width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  pressionado: { opacity: 0.85 },

  hero: { width: "100%", overflow: "hidden", backgroundColor: colors.ink, justifyContent: "flex-end" },
  heroImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  heroContent: { width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" },
  heroLogo: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    filter: "drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.95)) drop-shadow(0px 0px 14px rgba(255, 255, 255, 0.75))",
  },
  // Logo com 90% da largura do hero (90vw), mantendo a proporção do arquivo: 1843 × 715.
  heroLogoImagem: { width: "90%", height: undefined, aspectRatio: 1843 / 715 },
  heroLogoLuz: {
    position: "absolute",
    top: "12%",
    bottom: "12%",
    left: "10%",
    right: "10%",
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    boxShadow: "0px 0px 36px 22px rgba(255, 255, 255, 0.4)",
  },
  heroTitle: { fontFamily: fonts.displayExtraBold, letterSpacing: -2.5, color: colors.textOnDark, maxWidth: 880 },
  heroText: { fontFamily: fonts.body, fontSize: 19, lineHeight: 29, color: colors.textOnDarkMuted, marginTop: 18, maxWidth: 520 },
  heroSearch: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    padding: 6,
    paddingLeft: 22,
    marginTop: 24,
  },
  heroSearchWide: { maxWidth: 560 },
  heroSearchInput: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.text, paddingVertical: 11, minWidth: 0 },
  heroSearchButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  heroSearchButtonText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textOnDark },

  erro: { paddingVertical: 12 },
  erroTexto: { marginTop: 4 },
  botaoInline: { alignSelf: "flex-start", marginTop: 14 },

  impacto: { backgroundColor: colors.primary, paddingVertical: 48 },
  impactoTexto: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: colors.textOnDark,
    maxWidth: LARGURA_LEITURA + 200,
  },
  impactoTextoGrande: { fontSize: 36, lineHeight: 46 },
  impactoNota: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textOnDarkMuted,
    marginTop: 18,
    maxWidth: LARGURA_LEITURA,
  },

  cta: { overflow: "hidden", backgroundColor: colors.ink },
  ctaImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  ctaContent: { paddingVertical: 72 },
  ctaTitle: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.2,
    color: colors.textOnDark,
    maxWidth: 640,
  },
  ctaTitleLarge: { fontSize: 56, lineHeight: 58, letterSpacing: -2 },
  ctaText: {
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 26,
    color: colors.textOnDarkMuted,
    marginTop: 14,
    marginBottom: 28,
    maxWidth: 480,
  },
  ctaBotao: { alignSelf: "flex-start", minWidth: 240 },
  ctaLink: { alignSelf: "flex-start", marginTop: 16, minHeight: 32, justifyContent: "center" },
  ctaLinkTexto: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.textOnDark, textDecorationLine: "underline" },

  rodape: { backgroundColor: colors.ink, paddingTop: 44, paddingBottom: 32 },
  rodapeMarca: { flexDirection: "row", alignItems: "center" },
  rodapeSimbolo: { width: 36, height: 35, marginRight: 10 },
  rodapeNome: { fontFamily: fonts.displayExtraBold, fontSize: 24, letterSpacing: -0.6, color: colors.textOnDark },
  rodapeFrase: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textOnDarkMuted, marginTop: 8 },
  rodapeLinks: { flexDirection: "row", flexWrap: "wrap", gap: 24, marginTop: 24 },
  rodapeLink: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textOnDark },
  rodapePequeno: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textOnDarkMuted,
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
    maxWidth: LARGURA_LEITURA,
  },
});
