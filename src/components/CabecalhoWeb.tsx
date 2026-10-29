import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Image, Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { images } from '../constants/images';
import { ALTURA_CABECALHO_WEB, MAX_CONTENT_WIDTH } from '../hooks/useResponsive';
import { ICONES_ABAS } from '../navigation/iconesAbas';
import type { AbasParamList } from '../navigation/tipos';
import TagIcon from './TagIcon';

// ==TIPOS==
// O react-native-web informa "hovered" no estado do Pressable; os tipos do React Native só declaram "pressed".
type EstadoPressableWeb = PressableStateCallbackType & { hovered?: boolean };
const lerHover = (estado: PressableStateCallbackType) => (estado as EstadoPressableWeb).hovered === true;

// Cabeçalho fixo do site em tela larga: os mesmos itens da barra do celular (tag + nome), no topo.
// Fica fora da rolagem das telas, então continua visível ao descer a página.
// Emite o mesmo "tabPress" da barra inferior, então as telas reagem igual (ex.: Início rola até a busca).
export default function CabecalhoWeb({ state, descriptors, navigation }: BottomTabBarProps) {
  const rotaAtiva = state.routes[state.index]?.name;

  // ==HANDLERS==
  const handleNavegar = (nome: string, chave: string) => {
    const evento = navigation.emit({ type: 'tabPress', target: chave, canPreventDefault: true });
    if (rotaAtiva !== nome && !evento.defaultPrevented) {
      navigation.navigate(nome);
    }
  };

  // ==RENDER==
  return (
    <View style={styles.barra} accessibilityRole="header">
      <View style={styles.conteudo}>
        <Pressable
          onPress={() => {
            const inicio = state.routes.find((rota) => rota.name === 'Inicio');
            if (inicio) handleNavegar(inicio.name, inicio.key);
          }}
          accessibilityRole="link"
          accessibilityLabel="ReUse, ir para o início"
        >
          <Image source={images.logoNomeHorizontal} style={styles.logo} resizeMode="contain" />
        </Pressable>

        <View style={styles.itens} accessibilityRole="menubar">
          {state.routes.map((rota) => {
            const ativo = rota.name === rotaAtiva;
            const nome = rota.name as keyof AbasParamList;
            // "Anunciar" é a ação principal: tag sempre acesa, como no botão central do celular.
            const destaque = nome === 'Anunciar';
            const opcoes = descriptors[rota.key]?.options;
            const titulo = opcoes?.title ?? rota.name;

            return (
              <Pressable
                key={rota.key}
                onPress={() => handleNavegar(rota.name, rota.key)}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: ativo }}
                accessibilityLabel={opcoes?.tabBarAccessibilityLabel ?? titulo}
                style={(estado) => [styles.item, ativo ? styles.itemAtivo : lerHover(estado) && styles.itemHover]}
              >
                <View style={{ opacity: ativo || destaque ? 1 : 0.5 }}>
                  <TagIcon icon={ICONES_ABAS[nome]} size={22} iconScale={0.62} />
                </View>
                <Text style={[styles.itemTexto, (ativo || destaque) && styles.itemTextoAtivo]}>{titulo}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    height: ALTURA_CABECALHO_WEB,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    shadowColor: colors.ink,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 10,
  },
  conteudo: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Proporção do logo com nome: 1200 × 299.
  logo: { width: 136, height: 34 },
  itens: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  // Pílula com contorno no item ativo, como no menu anterior; fundo claro ao passar o mouse.
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  itemHover: { backgroundColor: colors.surfaceAlt },
  itemAtivo: { backgroundColor: colors.surfaceAlt, borderColor: colors.primary },
  itemTexto: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textMuted },
  itemTextoAtivo: { color: colors.primary },
});
