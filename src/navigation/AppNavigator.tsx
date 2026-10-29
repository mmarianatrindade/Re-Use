import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CabecalhoBanner from '../components/CabecalhoBanner';
import CabecalhoWeb from '../components/CabecalhoWeb';
import TagIcon from '../components/TagIcon';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { useSessao } from '../contexts/SessaoContext';
import { usaCabecalhoWeb } from '../hooks/useResponsive';
import AnuncioDetalheScreen from '../screens/anuncios/AnuncioDetalheScreen';
import AnunciosScreen from '../screens/anuncios/AnunciosScreen';
import DestacarAnuncioScreen from '../screens/anuncios/DestacarAnuncioScreen';
import EditarAnuncioScreen from '../screens/anuncios/EditarAnuncioScreen';
import GerenciarAnuncioScreen from '../screens/anuncios/GerenciarAnuncioScreen';
import NegociacoesScreen from '../screens/anuncios/NegociacoesScreen';
import PublicarScreen from '../screens/anuncios/PublicarScreen';
import SalvosScreen from '../screens/anuncios/SalvosScreen';
import AtivarContaScreen from '../screens/auth/AtivarContaScreen';
import CadastroScreen from '../screens/auth/CadastroScreen';
import ConfirmarEmailScreen from '../screens/auth/ConfirmarEmailScreen';
import EntrarScreen from '../screens/auth/EntrarScreen';
import RecuperarSenhaScreen from '../screens/auth/RecuperarSenhaScreen';
import RedefinirSenhaScreen from '../screens/auth/RedefinirSenhaScreen';
import TermosScreen from '../screens/auth/TermosScreen';
import HomeScreen from '../screens/HomeScreen';
import EditarPerfilScreen from '../screens/perfil/EditarPerfilScreen';
import MeuPerfilScreen from '../screens/perfil/MeuPerfilScreen';
import PerfilPublicoScreen from '../screens/perfil/PerfilPublicoScreen';
import { ICONES_ABAS } from './iconesAbas';
import { linking } from './linking';
import type { AbasParamList, PilhaAbaParamList, RootStackParamList } from './tipos';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<AbasParamList>();
// Um mesmo tipo de pilha para todas as abas: telas internas abrem dentro da aba e o menu continua visível.
const Pilha = createNativeStackNavigator<PilhaAbaParamList>();

const tema: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

const ALTURA_BARRA = 66;

const estiloTituloCabecalho = { fontFamily: fonts.displayBold, fontSize: 19, color: colors.primary };


// "Anunciar" é a tag do logo com o "+": maior que as outras abas e sempre acesa (ação principal do app).
// Na barra inferior: tag dentro de um círculo branco que sobe um pouco acima da barra.
function BotaoAnunciar() {
  return (
    <View style={styles.anunciar}>
      <TagIcon icon="+" size={26} iconScale={0.6} />
    </View>
  );
}

// Telas principais das abas: banner com recorte da colagem; a inicial usa a mesma paleta do título do hero.
function opcoesBanner(titulo: string, corInicial: string) {
  return { title: titulo, header: () => <CabecalhoBanner titulo={titulo} corInicial={corInicial} /> };
}

const opcoesPilha = {
  headerTitleStyle: estiloTituloCabecalho,
  headerTintColor: colors.primary,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.background },
  headerBackButtonDisplayMode: 'minimal' as const,
  contentStyle: { backgroundColor: colors.background },
};

// Telas internas registradas em todas as abas (abrem na aba de onde vieram).
function renderizarTelasCompartilhadas() {
  return (
    <>
      <Pilha.Screen name="AnuncioDetalhe" component={AnuncioDetalheScreen} options={{ title: 'Anúncio' }} />
      <Pilha.Screen name="PerfilPublico" component={PerfilPublicoScreen} options={{ title: 'Perfil público' }} />
      <Pilha.Screen name="EditarPerfil" component={EditarPerfilScreen} options={{ title: 'Editar perfil' }} />
      <Pilha.Screen name="GerenciarAnuncio" component={GerenciarAnuncioScreen} options={{ title: 'Meu anúncio' }} />
      <Pilha.Screen name="EditarAnuncio" component={EditarAnuncioScreen} options={{ title: 'Editar anúncio' }} />
      <Pilha.Screen name="DestacarAnuncio" component={DestacarAnuncioScreen} options={{ title: 'Destacar anúncio' }} />
      <Pilha.Screen name="Salvos" component={SalvosScreen} options={{ title: 'Salvos' }} />
    </>
  );
}

function PilhaInicio() {
  return (
    <Pilha.Navigator screenOptions={opcoesPilha}>
      <Pilha.Screen name="HomeInicio" component={HomeScreen} options={{ headerShown: false, title: 'Início' }} />
      {renderizarTelasCompartilhadas()}
    </Pilha.Navigator>
  );
}

function PilhaAnuncios() {
  return (
    <Pilha.Navigator screenOptions={opcoesPilha}>
      <Pilha.Screen name="AnunciosLista" component={AnunciosScreen} options={opcoesBanner('Catálogo', colors.destaqueReuso)} />
      {renderizarTelasCompartilhadas()}
    </Pilha.Navigator>
  );
}

function PilhaAnunciar() {
  return (
    <Pilha.Navigator screenOptions={opcoesPilha}>
      <Pilha.Screen name="AnunciarInicio" component={PublicarScreen} options={opcoesBanner('Anunciar', colors.destaqueVenda)} />
      {renderizarTelasCompartilhadas()}
    </Pilha.Navigator>
  );
}

function PilhaNegociacoes() {
  return (
    <Pilha.Navigator screenOptions={opcoesPilha}>
      <Pilha.Screen name="NegociacoesLista" component={NegociacoesScreen} options={opcoesBanner('Negociações', colors.destaqueTroca)} />
      {renderizarTelasCompartilhadas()}
    </Pilha.Navigator>
  );
}

function PilhaPerfil() {
  return (
    <Pilha.Navigator screenOptions={opcoesPilha}>
      <Pilha.Screen name="PerfilInicio" component={MeuPerfilScreen} options={opcoesBanner('Perfil', colors.destaqueDoacao)} />
      {renderizarTelasCompartilhadas()}
    </Pilha.Navigator>
  );
}

function Abas() {
  // A barra soma a área segura inferior (gesto do iPhone/Android) para os rótulos não serem cortados.
  const insets = useSafeAreaInsets();
  // Web em tela larga: cabeçalho no topo (padrão de sites); no celular e no tablet, barra embaixo.
  const cabecalhoWeb = usaCabecalhoWeb(useWindowDimensions().width);

  return (
    <Tab.Navigator
      tabBar={(props) => (cabecalhoWeb ? <CabecalhoWeb {...props} /> : <BottomTabBar {...props} />)}
      screenOptions={({ route }) => ({
        tabBarPosition: cabecalhoWeb ? 'top' : 'bottom',
        // O cabeçalho vem da pilha de cada aba.
        headerShown: false,
        // No Android, o teclado cobre a barra em vez de empurrá-la para cima dos campos.
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [styles.barraAbas, { height: ALTURA_BARRA + insets.bottom, paddingBottom: insets.bottom + 6 }],
        // "Negociações" é o rótulo mais longo: recebe um pouco mais de largura que as outras abas.
        tabBarItemStyle: [styles.abaItem, route.name === 'Negociacoes' && styles.abaItemLarga],
        // Rótulo em uma linha que diminui um pouco quando não cabe (ex.: "Negociações" em telas estreitas).
        tabBarLabel: ({ color, children }) => (
          <Text style={[styles.abaLabel, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {children}
          </Text>
        ),
        tabBarIcon: ({ focused }) =>
          route.name === 'Anunciar' ? (
            <BotaoAnunciar />
          ) : (
            <View style={{ opacity: focused ? 1 : 0.45 }}>
              <TagIcon icon={ICONES_ABAS[route.name]} size={24} iconScale={0.62} />
            </View>
          ),
      })}
    >
      <Tab.Screen name="Inicio" component={PilhaInicio} options={{ title: 'Início' }} />
      <Tab.Screen name="Anuncios" component={PilhaAnuncios} options={{ title: 'Catálogo' }} />
      <Tab.Screen name="Anunciar" component={PilhaAnunciar} options={{ title: 'Anunciar', tabBarAccessibilityLabel: 'Anunciar um item' }} />
      <Tab.Screen name="Negociacoes" component={PilhaNegociacoes} options={{ title: 'Negociações' }} />
      <Tab.Screen name="Perfil" component={PilhaPerfil} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { status } = useSessao();

  // Espera ler o token salvo (poucos ms) para nenhuma tela chamar a API antes de a sessão ser restaurada,
  // inclusive quando o app abre direto num link (ex.: /meus-anuncios/:id na web).
  if (status === 'carregando') {
    return <View style={styles.carregando} />;
  }

  return (
    <NavigationContainer
      theme={tema}
      linking={linking}
      documentTitle={{ formatter: (opcoes) => (opcoes?.title ? `${opcoes.title} | ReUse` : 'ReUse') }}
    >
      <Stack.Navigator screenOptions={opcoesPilha}>
        <Stack.Screen name="Abas" component={Abas} options={{ headerShown: false, title: 'ReUse' }} />
        <Stack.Screen name="Entrar" component={EntrarScreen} options={{ title: 'Entrar' }} />
        <Stack.Screen name="Cadastro" component={CadastroScreen} options={{ title: 'Criar conta' }} />
        <Stack.Screen name="ConfirmarEmail" component={ConfirmarEmailScreen} options={{ title: 'Confirmar e-mail' }} />
        <Stack.Screen name="AtivarConta" component={AtivarContaScreen} options={{ title: 'Ativação da conta' }} />
        <Stack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} options={{ title: 'Recuperar senha' }} />
        <Stack.Screen name="RedefinirSenha" component={RedefinirSenhaScreen} options={{ title: 'Nova senha' }} />
        <Stack.Screen name="Termos" component={TermosScreen} options={{ title: 'Termos', presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  carregando: { flex: 1, backgroundColor: colors.background },
  barraAbas: { backgroundColor: colors.surface, borderTopColor: colors.border, paddingTop: 6 },
  abaItem: { paddingHorizontal: 0 },
  abaItemLarga: { flex: 1.25 },
  abaLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11, letterSpacing: -0.2, lineHeight: 15, marginTop: 2, textAlign: 'center' },
  // Tag central um pouco acima da barra, destacando a ação principal.
  anunciar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    // Sobe o mesmo tanto que cresce além do espaço do ícone: o rótulo "Anunciar" continua visível abaixo.
    marginTop: -22,
    shadowColor: colors.ink,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
});
