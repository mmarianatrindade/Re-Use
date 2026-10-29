import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import type { Modalidade, StatusAnuncio } from '../schemas/anuncio';
import { formatarPrecoAnuncio, modalidadeInfo } from '../utils/formatarAnuncio';
import StatusBadge from './StatusBadge';
import TagsAnuncio from './TagsAnuncio';

export interface DadosCardAnuncio {
  id: string;
  titulo: string;
  modalidade: Modalidade;
  precoCentavos: number | null;
  capaUrl: string | null;
  status?: StatusAnuncio;
  emDestaque?: boolean;
  // Linha curta de apoio: "a 3 km, Pinheiros" ou "Pinheiros, São Paulo".
  meta?: string;
}

interface CardAnuncioProps {
  anuncio: DadosCardAnuncio;
  onPress: () => void;
  // "grade": foto em destaque (vitrine, Home, perfil). "linha": compacto, para listas de gestão.
  variante?: 'grade' | 'linha';
  largura?: number;
  // Linha: mostra o status (gestão dos próprios anúncios).
  mostrarStatus?: boolean;
  // Linha: ação à direita (ex.: menu de opções).
  acessorio?: ReactNode;
}

// O único cartão de anúncio do app: foto primeiro, preço na cor da modalidade, título e uma linha de apoio.
export default function CardAnuncio({ anuncio, onPress, variante = 'grade', largura, mostrarStatus = false, acessorio }: CardAnuncioProps) {
  const cor = modalidadeInfo[anuncio.modalidade].cor;
  const preco = formatarPrecoAnuncio(anuncio.modalidade, anuncio.precoCentavos);
  const rotulo = `${anuncio.titulo}, ${preco}, ${modalidadeInfo[anuncio.modalidade].label}${anuncio.emDestaque ? ', anúncio em destaque' : ''}`;

  if (variante === 'linha') {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={rotulo} style={({ pressed }) => [styles.linha, pressed && styles.pressionado]}>
        <View style={styles.linhaFoto}>
          {anuncio.capaUrl ? <Image source={{ uri: anuncio.capaUrl }} style={styles.imagem} /> : null}
          <TagsAnuncio modalidade={anuncio.modalidade} status={anuncio.status} size={20} style={styles.linhaTags} />
        </View>
        <View style={styles.linhaTextos}>
          {mostrarStatus && anuncio.status ? <StatusBadge status={anuncio.status} /> : null}
          <Text style={[styles.preco, styles.linhaPreco, { color: cor }]} numberOfLines={1}>
            {preco}
          </Text>
          <Text style={styles.titulo} numberOfLines={2}>
            {anuncio.titulo}
          </Text>
          {anuncio.meta ? (
            <Text style={styles.meta} numberOfLines={1}>
              {anuncio.meta}
            </Text>
          ) : null}
        </View>
        {acessorio}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => [largura ? { width: largura } : null, pressed && styles.pressionado]}
    >
      <View style={styles.foto}>
        {anuncio.capaUrl ? <Image source={{ uri: anuncio.capaUrl }} style={styles.imagem} resizeMode="cover" /> : null}
        <TagsAnuncio modalidade={anuncio.modalidade} status={anuncio.status} size={26} style={styles.tags} />
        {anuncio.emDestaque ? (
          <View style={styles.destaque}>
            <Text style={styles.destaqueTexto}>Anúncio em destaque</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.preco, { color: cor }]} numberOfLines={1}>
        {preco}
      </Text>
      {/* Na grade, título sempre com a altura de 2 linhas e a linha de apoio sempre reservada:
          cartões lado a lado ficam com preço, título e localização alinhados. */}
      <Text style={[styles.titulo, styles.tituloGrade]} numberOfLines={2}>
        {anuncio.titulo}
      </Text>
      <Text style={[styles.meta, styles.metaGrade]} numberOfLines={1}>
        {anuncio.meta ?? ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressionado: { opacity: 0.82 },
  foto: { width: '100%', aspectRatio: 4 / 5, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  imagem: { width: '100%', height: '100%' },
  tags: { position: 'absolute', top: 8, right: 8 },
  destaque: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  destaqueTexto: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primary },
  preco: { fontFamily: fonts.bodyExtraBold, fontSize: 17, lineHeight: 22, marginTop: 10, fontVariant: ['tabular-nums'] },
  titulo: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.text, marginTop: 2 },
  meta: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: 4 },
  tituloGrade: { height: 21 * 2 },
  metaGrade: { height: 18 },
  linha: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  linhaFoto: { width: 88, height: 88, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  linhaTags: { position: 'absolute', top: 4, right: 4 },
  linhaTextos: { flex: 1, marginLeft: 14, gap: 2 },
  linhaPreco: { marginTop: 4 },
});
