import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ActionSheet from '../../components/ActionSheet';
import CardAnuncio from '../../components/CardAnuncio';
import Glifo from '../../components/Glifo';
import AuthGate from '../../components/AuthGate';
import Banner from '../../components/Banner';
import EmptyState from '../../components/EmptyState';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { fundo } from '../../constants/images';
import { radii } from '../../constants/radii';
import { tipografia } from '../../constants/tipografia';
import { useAcoesAnuncio } from '../../hooks/useAcoesAnuncio';
import type { TelaAbaProps } from '../../navigation/tipos';
import { STATUS_ANUNCIO, type StatusAnuncio } from '../../schemas/anuncio';
import { ApiError, obterMensagemErro } from '../../services/api';
import { lerMeusAnunciosEmCache, listarMeusAnuncios } from '../../services/anunciosService';
import { chavesLocais, salvarLocal } from '../../services/armazenamento';
import type { AnuncioProprio } from '../../types/api';
import { cardDeProprio } from '../../utils/formatarAnuncio';

type Filtro = StatusAnuncio | 'todos';

function ConteudoNegociacoes({ navigation }: TelaAbaProps<'NegociacoesLista'>) {
  const [anuncios, setAnuncios] = useState<AnuncioProprio[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [atualizando, setAtualizando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [anuncioOpcoes, setAnuncioOpcoes] = useState<AnuncioProprio | null>(null);

  // Mantém lista e cache do aparelho iguais após cada ação. Atualização funcional: ações seguidas não se sobrescrevem.
  const atualizarLista = useCallback((transformar: (lista: AnuncioProprio[]) => AnuncioProprio[]) => {
    setAnuncios((atual) => {
      const nova = transformar(atual ?? []);
      void salvarLocal(chavesLocais.meusAnuncios, nova);
      return nova;
    });
  }, []);

  const { processando, montarAcoes } = useAcoesAnuncio({
    onAtualizado: (atualizado) => atualizarLista((lista) => lista.map((item) => (item.id === atualizado.id ? atualizado : item))),
    onExcluido: (anuncioId) => atualizarLista((lista) => lista.filter((item) => item.id !== anuncioId)),
  });

  const carregarAnuncios = useCallback(async () => {
    try {
      setAnuncios(await listarMeusAnuncios());
      setAviso(null);
    } catch (erro) {
      setAviso(
        erro instanceof ApiError && erro.status === 0
          ? 'Sem conexão: mostrando a última lista salva neste aparelho.'
          : obterMensagemErro(erro),
      );
    }
  }, []);

  // Mostra o cache do AsyncStorage na hora; a API atualiza em seguida.
  useEffect(() => {
    lerMeusAnunciosEmCache().then((cache) => {
      if (cache) {
        setAnuncios((atual) => atual ?? cache);
      }
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregarAnuncios();
    }, [carregarAnuncios]),
  );

  const handleAtualizar = async () => {
    setAtualizando(true);
    await carregarAnuncios();
    setAtualizando(false);
  };

  if (anuncios === null) {
    return (
      <Screen>
        <EmptyState
          icone="!"
          titulo={aviso ? 'Não foi possível carregar' : 'Carregando anúncios'}
          mensagem={aviso ?? undefined}
          carregando={!aviso}
          acao={aviso ? { label: 'Tentar de novo', onPress: () => void carregarAnuncios() } : undefined}
        />
      </Screen>
    );
  }

  if (anuncios.length === 0) {
    return (
      <Screen atualizando={atualizando} onAtualizar={handleAtualizar}>
        <EmptyState
          imagem={{ source: fundo.infantil, proporcao: 520 / 330 }}
          titulo="Nada publicado ainda"
          mensagem="Fotografe algo que está parado em casa e escolha vender, trocar ou doar. Leva poucos minutos."
          acao={{ label: 'Publicar primeiro item', onPress: () => navigation.navigate('Anunciar') }}
        />
      </Screen>
    );
  }

  const contagem = STATUS_ANUNCIO.reduce(
    (mapa, status) => ({ ...mapa, [status.id]: anuncios.filter((anuncio) => anuncio.status === status.id).length }),
    { todos: anuncios.length } as Record<Filtro, number>,
  );
  const filtrados = filtro === 'todos' ? anuncios : anuncios.filter((anuncio) => anuncio.status === filtro);
  const totalVisualizacoes = anuncios.reduce((soma, anuncio) => soma + anuncio.visualizacoes, 0);
  const totalContatos = anuncios.reduce((soma, anuncio) => soma + anuncio.contatos, 0);
  const opcoesFiltro: { id: Filtro; label: string }[] = [{ id: 'todos', label: 'Todos' }, ...STATUS_ANUNCIO];

  return (
    <Screen atualizando={atualizando} onAtualizar={handleAtualizar} larguraMaxima={720}>
      {aviso ? <Banner tom="aviso">{aviso}</Banner> : null}

      {/* Em andamento em uma linha: propostas e conversas entram aqui na próxima etapa */}
      <Text style={[tipografia.corpo, styles.andamento]}>
        {contagem.negociando + contagem.reservado === 0
          ? 'Nenhum item em negociação ou reservado agora.'
          : `${contagem.negociando} em negociação e ${contagem.reservado} ${contagem.reservado === 1 ? 'reservado' : 'reservados'}.`}
      </Text>

      <Text style={tipografia.tituloSecao}>Meus anúncios</Text>
      <Text style={styles.resumo}>
        {contagem.disponivel} {contagem.disponivel === 1 ? 'anúncio disponível' : 'anúncios disponíveis'}, com {totalVisualizacoes}{' '}
        {totalVisualizacoes === 1 ? 'visualização' : 'visualizações'} e {totalContatos} {totalContatos === 1 ? 'contato' : 'contatos'} no total.
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros} style={styles.filtrosScroll}>
        {opcoesFiltro.map((opcao) => {
          const ativo = filtro === opcao.id;
          return (
            <Pressable
              key={opcao.id}
              onPress={() => setFiltro(opcao.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: ativo }}
              style={[styles.filtro, ativo && styles.filtroAtivo]}
            >
              <Text style={[styles.filtroTexto, ativo && styles.filtroTextoAtivo]}>
                {opcao.label} {contagem[opcao.id]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {filtrados.length === 0 ? (
        <Text style={styles.vazio}>Nenhum anúncio com este status.</Text>
      ) : (
        filtrados.map((anuncio) => (
          <CardAnuncio
            key={anuncio.id}
            variante="linha"
            mostrarStatus
            anuncio={cardDeProprio(anuncio)}
            onPress={() => navigation.navigate('GerenciarAnuncio', { anuncioId: anuncio.id })}
            acessorio={
              <Pressable
                onPress={() => setAnuncioOpcoes(anuncio)}
                disabled={processando === anuncio.id}
                accessibilityRole="button"
                accessibilityLabel={`Opções de ${anuncio.titulo}`}
                hitSlop={6}
                style={({ pressed }) => [styles.opcoes, pressed && styles.opcoesPressionado]}
              >
                {processando === anuncio.id ? <ActivityIndicator color={colors.primary} /> : <Glifo simbolo="…" tamanho={22} cor={colors.textMuted} />}
              </Pressable>
            }
          />
        ))
      )}

      <PrimaryButton label="Publicar novo item" variante="secundario" onPress={() => navigation.navigate('Anunciar')} style={styles.novo} />

      <ActionSheet
        visivel={anuncioOpcoes !== null}
        titulo={anuncioOpcoes?.titulo ?? ''}
        acoes={anuncioOpcoes ? montarAcoes(anuncioOpcoes) : []}
        onFechar={() => setAnuncioOpcoes(null)}
      />
    </Screen>
  );
}

export default function NegociacoesScreen(props: TelaAbaProps<'NegociacoesLista'>) {
  return (
    <AuthGate titulo="Suas negociações em um só lugar" mensagem="Entre para acompanhar seus anúncios, reservas e negociações.">
      <ConteudoNegociacoes {...props} />
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  andamento: { fontVariant: ['tabular-nums'], marginBottom: 24 },
  resumo: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 22, color: colors.text, fontVariant: ['tabular-nums'] },
  filtrosScroll: { marginHorizontal: -4, marginTop: 14, marginBottom: 16 },
  filtros: { gap: 8, paddingHorizontal: 4 },
  filtro: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  filtroAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  filtroTexto: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text, fontVariant: ['tabular-nums'] },
  filtroTextoAtivo: { color: colors.textOnDark },
  opcoes: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  opcoesPressionado: { backgroundColor: colors.surfaceAlt },
  vazio: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted, paddingVertical: 24 },
  novo: { marginTop: 8 },
});
