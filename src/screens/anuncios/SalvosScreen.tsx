import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import CardAnuncio from '../../components/CardAnuncio';
import EmptyState from '../../components/EmptyState';
import { colors } from '../../constants/colors';
import { tipografia } from '../../constants/tipografia';
import { useResponsive } from '../../hooks/useResponsive';
import type { TelaAbaProps } from '../../navigation/tipos';
import { listarSalvos, type AnuncioSalvo } from '../../services/salvosService';

const ESPACO = 14;

// Anúncios salvos neste aparelho (AsyncStorage). O detalhe abre sempre com os dados atuais da API.
export default function SalvosScreen({ navigation }: TelaAbaProps<'Salvos'>) {
  const { width, gutter } = useResponsive();
  const [salvos, setSalvos] = useState<AnuncioSalvo[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      listarSalvos().then(setSalvos);
    }, []),
  );

  const colunas = width >= 1100 ? 4 : width >= 700 ? 3 : 2;
  const larguraCard = (Math.min(width, 1200) - gutter * 2 - ESPACO * (colunas - 1)) / colunas;

  return (
    <FlatList
      key={colunas}
      data={salvos ?? []}
      keyExtractor={(item) => item.id}
      numColumns={colunas}
      style={styles.lista}
      contentContainerStyle={[styles.conteudo, { paddingHorizontal: gutter }]}
      columnWrapperStyle={colunas > 1 ? styles.linha : undefined}
      ListHeaderComponent={
        salvos && salvos.length > 0 ? (
          <Text style={[tipografia.corpoSuave, styles.intro]}>Salvos neste aparelho. Toque em um anúncio para ver os dados atualizados.</Text>
        ) : null
      }
      renderItem={({ item }) => (
        <CardAnuncio anuncio={item} largura={larguraCard} onPress={() => navigation.navigate('AnuncioDetalhe', { anuncioId: item.id })} />
      )}
      ListEmptyComponent={
        salvos === null ? (
          <EmptyState titulo="Carregando" carregando />
        ) : (
          <EmptyState
            titulo="Nenhum anúncio salvo"
            mensagem='No detalhe de um anúncio, toque em "Salvar" para encontrá-lo aqui depois.'
            acao={{ label: 'Ver anúncios', onPress: () => navigation.navigate('Abas', { screen: 'Anuncios' }) }}
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  lista: { flex: 1, backgroundColor: colors.background },
  conteudo: { paddingTop: 16, paddingBottom: 32, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  linha: { gap: ESPACO, marginBottom: 24 },
  intro: { marginBottom: 18 },
});
