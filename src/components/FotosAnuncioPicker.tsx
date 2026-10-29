import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { radii } from '../constants/radii';
import { MAX_FOTOS_ANUNCIO, type FotoForm } from '../schemas/anuncio';
import { PermissaoNegadaError, selecionarImagens, type OrigemImagem } from '../services/midiaService';
import { showMessage } from '../utils/showMessage';
import ActionSheet, { type AcaoSheet } from './ActionSheet';

interface FotosAnuncioPickerProps {
  fotos: FotoForm[];
  onChange: (fotos: FotoForm[]) => void;
  erro?: string;
}

const COLUNAS = 3;
const ESPACO = 10;

// Até cinco fotos: a primeira é a capa. Toque numa foto para torná-la capa ou removê-la.
export default function FotosAnuncioPicker({ fotos, onChange, erro }: FotosAnuncioPickerProps) {
  const [largura, setLargura] = useState(0);
  const [processando, setProcessando] = useState(false);
  const [menuAdicionar, setMenuAdicionar] = useState(false);
  const [fotoSelecionada, setFotoSelecionada] = useState<number | null>(null);

  const restantes = MAX_FOTOS_ANUNCIO - fotos.length;
  const lado = largura > 0 ? (largura - ESPACO * (COLUNAS - 1)) / COLUNAS : 0;

  const handleLayout = (evento: LayoutChangeEvent) => setLargura(evento.nativeEvent.layout.width);

  const handleAdicionar = async (origem: OrigemImagem) => {
    setProcessando(true);
    try {
      const novas = await selecionarImagens({ origem, limite: restantes });
      if (novas.length > 0) {
        onChange([...fotos, ...novas.map((imagem) => ({ uri: imagem.uri, chave: null }))].slice(0, MAX_FOTOS_ANUNCIO));
      }
    } catch (falha) {
      showMessage(
        falha instanceof PermissaoNegadaError ? 'Permissão necessária' : 'Não foi possível abrir',
        falha instanceof Error ? falha.message : 'Tente novamente.',
      );
    } finally {
      setProcessando(false);
    }
  };

  const handleTornarCapa = (indice: number) => {
    const reordenadas = [...fotos];
    const [foto] = reordenadas.splice(indice, 1);
    onChange([foto, ...reordenadas]);
  };

  const handleRemover = (indice: number) => onChange(fotos.filter((_, posicao) => posicao !== indice));

  const acoesAdicionar: AcaoSheet[] = [
    { id: 'camera', label: 'Tirar foto', descricao: 'Abre a câmera do aparelho', onPress: () => handleAdicionar('camera') },
    {
      id: 'galeria',
      label: 'Escolher da galeria',
      descricao: `Você pode escolher até ${restantes} ${restantes === 1 ? 'foto' : 'fotos'}`,
      onPress: () => handleAdicionar('galeria'),
    },
  ];

  const acoesFoto: AcaoSheet[] =
    fotoSelecionada === null
      ? []
      : [
          ...(fotoSelecionada > 0
            ? [{ id: 'capa', label: 'Usar como capa', onPress: () => handleTornarCapa(fotoSelecionada) }]
            : []),
          { id: 'remover', label: 'Remover foto', destrutivo: true, onPress: () => handleRemover(fotoSelecionada) },
        ];

  return (
    <View style={styles.container}>
      <View style={styles.cabecalho}>
        <Text style={styles.label}>
          Fotos<Text style={styles.obrigatorio}> *</Text>
        </Text>
        <Text style={styles.contador}>
          {fotos.length} de {MAX_FOTOS_ANUNCIO}
        </Text>
      </View>
      <Text style={styles.dica}>Use luz natural e mostre detalhes e defeitos. A primeira foto é a capa.</Text>

      <View style={styles.grade} onLayout={handleLayout}>
        {lado > 0
          ? fotos.map((foto, indice) => (
              <Pressable
                key={`${foto.uri}-${indice}`}
                onPress={() => setFotoSelecionada(indice)}
                accessibilityRole="button"
                accessibilityLabel={indice === 0 ? 'Foto de capa. Toque para opções' : `Foto ${indice + 1}. Toque para opções`}
                style={[styles.tile, { width: lado, height: lado }]}
              >
                <Image source={{ uri: foto.uri }} style={styles.imagem} />
                {indice === 0 ? (
                  <View style={styles.capa}>
                    <Text style={styles.capaTexto}>Capa</Text>
                  </View>
                ) : null}
              </Pressable>
            ))
          : null}

        {lado > 0 && restantes > 0 ? (
          <Pressable
            onPress={() => setMenuAdicionar(true)}
            disabled={processando}
            accessibilityRole="button"
            accessibilityLabel="Adicionar fotos"
            style={({ pressed }) => [
              styles.tile,
              styles.adicionar,
              { width: lado, height: lado },
              erro && fotos.length === 0 ? styles.adicionarErro : null,
              pressed && styles.pressionado,
            ]}
          >
            {processando ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Text style={styles.adicionarIcone}>+</Text>
                <Text style={styles.adicionarTexto}>Adicionar</Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <ActionSheet visivel={menuAdicionar} titulo="Adicionar fotos" acoes={acoesAdicionar} onFechar={() => setMenuAdicionar(false)} />
      <ActionSheet
        visivel={fotoSelecionada !== null}
        titulo={fotoSelecionada === 0 ? 'Foto de capa' : 'Foto do anúncio'}
        acoes={acoesFoto}
        onFechar={() => setFotoSelecionada(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text },
  obrigatorio: { color: colors.danger },
  contador: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  dica: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: 4, marginBottom: 12 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACO, minHeight: 40 },
  tile: { borderRadius: radii.inner, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  imagem: { width: '100%', height: '100%' },
  capa: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    backgroundColor: 'rgba(4, 32, 28, 0.78)',
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  capaTexto: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.lime },
  adicionar: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  adicionarErro: { borderColor: colors.danger },
  pressionado: { opacity: 0.75 },
  adicionarIcone: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 32, color: colors.teal },
  adicionarTexto: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.teal },
  erro: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.danger, marginTop: 8 },
});
