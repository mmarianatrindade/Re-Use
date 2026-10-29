import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import type { Modalidade } from '../data/reuseData';
import type { AnuncioVitrine } from '../types/api';
import { cardDeVitrine } from '../utils/formatarAnuncio';
import CardAnuncio from './CardAnuncio';
import Glifo from './Glifo';
import TagIcon from './TagIcon';

interface CarrosselModalidadeProps {
  modalidade: Modalidade;
  titulo: string;
  // null = carregando.
  anuncios: AnuncioVitrine[] | null;
  gutter: number;
  onAnuncioPress: (anuncioId: string) => void;
  onVerMais: () => void;
}

const LARGURA = 156;
const ESPACO = 14;
const ALTURA_FOTO = LARGURA * 1.25;

// Uma modalidade em carrossel horizontal: até 5 anúncios e, no fim, "Confira mais" (abre a aba Anúncios filtrada).
export default function CarrosselModalidade({ modalidade, titulo, anuncios, gutter, onAnuncioPress, onVerMais }: CarrosselModalidadeProps) {
  const vazio = anuncios !== null && anuncios.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.cabecalho}>
        <TagIcon {...modalidade.tag} size={28} />
        <Text style={[styles.titulo, { color: modalidade.color }]}>{titulo}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -gutter }}
        contentContainerStyle={[styles.trilho, { paddingHorizontal: gutter }]}
      >
        {anuncios === null
          ? Array.from({ length: 3 }, (_, indice) => <View key={indice} style={styles.esqueleto} />)
          : anuncios.map((anuncio) => (
              <CardAnuncio key={anuncio.id} anuncio={cardDeVitrine(anuncio)} largura={LARGURA} onPress={() => onAnuncioPress(anuncio.id)} />
            ))}

        {vazio ? (
          <View style={styles.vazio}>
            <Text style={styles.vazioTexto}>Ainda não há anúncios de {titulo.toLowerCase()} por aqui.</Text>
          </View>
        ) : null}

        <Pressable
          onPress={onVerMais}
          accessibilityRole="button"
          accessibilityLabel={`Confira mais anúncios de ${titulo.toLowerCase()}`}
          style={({ pressed }) => [styles.verMais, { borderColor: modalidade.color }, pressed && styles.pressionado]}
        >
          <View style={[styles.verMaisIcone, { backgroundColor: modalidade.color }]}>
            <Glifo simbolo="+" tamanho={22} />
          </View>
          <Text style={[styles.verMaisTexto, { color: modalidade.color }]}>Confira mais</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 36 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  titulo: { fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 27, letterSpacing: -0.4 },
  trilho: { gap: ESPACO, alignItems: 'flex-start' },
  esqueleto: { width: LARGURA, height: ALTURA_FOTO, borderRadius: 16, backgroundColor: colors.surfaceAlt },
  vazio: { width: LARGURA * 1.3, height: ALTURA_FOTO, justifyContent: 'center', paddingRight: 8 },
  vazioTexto: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textMuted },
  // Bloco final com o contorno na cor da modalidade: chama para a lista completa sem pesar como mais um anúncio.
  verMais: {
    width: LARGURA,
    height: ALTURA_FOTO,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  verMaisIcone: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  verMaisTexto: { fontFamily: fonts.bodyBold, fontSize: 16 },
  pressionado: { opacity: 0.8 },
});
