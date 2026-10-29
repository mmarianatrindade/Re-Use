import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Banner from '../../components/Banner';
import EmptyState from '../../components/EmptyState';
import FiltrosModal from '../../components/FiltrosModal';
import SegmentedControl, { type SegmentOption } from '../../components/SegmentedControl';
import TextField from '../../components/TextField';
import CardAnuncio from '../../components/CardAnuncio';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { fundo } from '../../constants/images';
import { radii } from '../../constants/radii';
import { tipografia } from '../../constants/tipografia';
import { useSessao } from '../../contexts/SessaoContext';
import { useResponsive } from '../../hooks/useResponsive';
import type { TelaAbaProps } from '../../navigation/tipos';
import type { Modalidade } from '../../schemas/anuncio';
import { obterMensagemErro } from '../../services/api';
import { listarVitrine } from '../../services/anunciosService';
import { obterLocalizacaoAtual, type LocalizacaoAtual } from '../../services/localizacaoService';
import type { AnuncioVitrine } from '../../types/api';
import { FILTROS_VAZIOS, contarFiltrosAtivos, type FiltrosAnuncios } from '../../types/filtros';
import { cardDeVitrine, modalidadeInfo } from '../../utils/formatarAnuncio';
import { showMessage } from '../../utils/showMessage';

type FiltroModalidade = Modalidade | 'todas';

const OPCOES_MODALIDADE: SegmentOption<FiltroModalidade>[] = [
  { id: 'todas', label: 'Todos' },
  { id: 'venda', label: 'Vendas', color: modalidadeInfo.venda.cor, tag: modalidadeInfo.venda.tag },
  { id: 'troca', label: 'Trocas', color: modalidadeInfo.troca.cor, tag: modalidadeInfo.troca.tag },
  { id: 'doacao', label: 'Doações', color: modalidadeInfo.doacao.cor, tag: modalidadeInfo.doacao.tag },
];

const ESPACO = 14;
// Espera o usuário parar de digitar antes de buscar na API.
const ATRASO_BUSCA_MS = 400;

export default function AnunciosScreen({ navigation, route }: TelaAbaProps<'AnunciosLista'>) {
  const { width, gutter } = useResponsive();
  const [modalidade, setModalidade] = useState<FiltroModalidade>(route.params?.modalidade ?? 'todas');
  const { usuario } = useSessao();
  const [filtros, setFiltros] = useState<FiltrosAnuncios>(FILTROS_VAZIOS);
  const [modalFiltros, setModalFiltros] = useState(false);
  // GPS do aparelho: só pedido quando um filtro precisa (distância, mais próximos, cidade/estado sem endereço no perfil).
  const [gps, setGps] = useState<LocalizacaoAtual | null>(null);
  const [texto, setTexto] = useState('');
  const [busca, setBusca] = useState('');
  const [itens, setItens] = useState<AnuncioVitrine[] | null>(null);
  const [proximaPagina, setProximaPagina] = useState<number | null>(null);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // Descarta respostas de buscas antigas que cheguem depois da mais recente.
  const requisicaoAtual = useRef(0);

  const colunas = width >= 1100 ? 4 : width >= 700 ? 3 : 2;
  const larguraConteudo = Math.min(width, 1200) - gutter * 2;
  const larguraCard = (larguraConteudo - ESPACO * (colunas - 1)) / colunas;

  // Atalhos (ex.: Home → "Ver doações") chegam como parâmetro da aba.
  // buscaEm muda a cada atalho: repetir o mesmo atalho reaplica o filtro. Sem modalidade (busca ou
  // "Reutilizar"), volta para todas.
  useEffect(() => {
    if (route.params?.buscaEm !== undefined || route.params?.modalidade) {
      setModalidade(route.params?.modalidade ?? 'todas');
    }
  }, [route.params?.modalidade, route.params?.buscaEm]);

  // Busca enviada pelo hero da Home: aplica na hora, sem esperar o atraso da digitação.
  useEffect(() => {
    const termo = route.params?.busca;
    if (termo !== undefined) {
      setTexto(termo);
      setBusca(termo);
    }
  }, [route.params?.busca, route.params?.buscaEm]);

  useEffect(() => {
    const temporizador = setTimeout(() => setBusca(texto), ATRASO_BUSCA_MS);
    return () => clearTimeout(temporizador);
  }, [texto]);

  const carregarPagina = useCallback(
    async (pagina: number) => {
      const numero = ++requisicaoAtual.current;
      try {
        // Cidade/UF do perfil têm prioridade para "minha cidade/estado"; o GPS cobre quem não tem endereço.
        const local = {
          latitude: gps?.latitude ?? null,
          longitude: gps?.longitude ?? null,
          cidade: usuario?.endereco?.cidade ?? gps?.cidade ?? null,
          uf: usuario?.endereco?.uf ?? gps?.uf ?? null,
        };
        const resposta = await listarVitrine(
          { modalidade: modalidade === 'todas' ? undefined : modalidade, busca, avancados: filtros, local },
          pagina,
        );
        if (numero !== requisicaoAtual.current) {
          return;
        }
        setItens((atuais) => (pagina === 0 ? resposta.itens : [...(atuais ?? []), ...resposta.itens]));
        setProximaPagina(resposta.proximaPagina);
        setErro(null);
      } catch (falha) {
        if (numero === requisicaoAtual.current) {
          setErro(obterMensagemErro(falha));
        }
      }
    },
    [modalidade, busca, filtros, gps, usuario?.endereco?.cidade, usuario?.endereco?.uf],
  );

  useEffect(() => {
    setItens(null);
    void carregarPagina(0);
  }, [carregarPagina]);

  const handleAtualizar = async () => {
    setAtualizando(true);
    await carregarPagina(0);
    setAtualizando(false);
  };

  const handleCarregarMais = async () => {
    if (proximaPagina === null || carregandoMais) {
      return;
    }
    setCarregandoMais(true);
    await carregarPagina(proximaPagina);
    setCarregandoMais(false);
  };

  const handleLimparFiltros = () => {
    setModalidade('todas');
    setFiltros(FILTROS_VAZIOS);
    setTexto('');
  };

  // Aplica os filtros do modal, pedindo a localização do aparelho só se algum filtro precisar dela.
  const handleAplicarFiltros = async (novos: FiltrosAnuncios) => {
    setModalFiltros(false);
    const precisaCoordenadas = novos.localizacao === 'raio' || novos.maisProximos;
    const precisaCidade = (novos.localizacao === 'cidade' || novos.localizacao === 'estado') && !usuario?.endereco;
    let aplicados = novos;

    if ((precisaCoordenadas || precisaCidade) && !gps) {
      try {
        setGps(await obterLocalizacaoAtual());
      } catch (falha) {
        showMessage('Localização indisponível', obterMensagemErro(falha));
        aplicados = { ...novos, localizacao: 'brasil', raioKm: null, maisProximos: false };
      }
    }
    setFiltros(aplicados);
  };

  const quantidadeFiltros = contarFiltrosAtivos(filtros);
  const filtrosAtivos = modalidade !== 'todas' || quantidadeFiltros > 0 || busca.trim() !== '';

  const cabecalho = (
    <View style={styles.cabecalho}>
      <View style={styles.buscaLinha}>
        <View style={styles.buscaCampo}>
          <TextField
            label="Buscar"
            value={texto}
            onChangeText={setTexto}
            placeholder="O que você procura?"
            returnKeyType="search"
            autoCorrect={false}
            acessorio={
              texto ? (
                <Pressable onPress={() => setTexto('')} accessibilityRole="button" accessibilityLabel="Limpar busca" hitSlop={8}>
                  <Text style={styles.limpar}>Limpar</Text>
                </Pressable>
              ) : null
            }
          />
        </View>
        <Pressable
          onPress={() => setModalFiltros(true)}
          accessibilityRole="button"
          accessibilityLabel={quantidadeFiltros > 0 ? `Filtros, ${quantidadeFiltros} ativos` : 'Filtros'}
          style={({ pressed }) => [styles.botaoFiltros, quantidadeFiltros > 0 && styles.botaoFiltrosAtivo, pressed && styles.pressionado]}
        >
          <Text style={[styles.botaoFiltrosTexto, quantidadeFiltros > 0 && styles.botaoFiltrosTextoAtivo]}>
            Filtros{quantidadeFiltros > 0 ? ` ${quantidadeFiltros}` : ''}
          </Text>
        </Pressable>
      </View>
      <SegmentedControl options={OPCOES_MODALIDADE} value={modalidade} onChange={setModalidade} stretch size="sm" />
      {/* Ordem visível: mais recentes ou mais perto (pede a localização do aparelho na primeira vez) */}
      <View style={styles.ordemLinha}>
        <Text style={tipografia.apoio}>Ordenar por</Text>
        {[
          { id: 'recentes', rotulo: 'Mais recentes', ativo: !filtros.maisProximos },
          { id: 'proximos', rotulo: 'Mais perto', ativo: filtros.maisProximos },
        ].map((opcao) => (
          <Pressable
            key={opcao.id}
            onPress={() => void handleAplicarFiltros({ ...filtros, maisProximos: opcao.id === 'proximos' })}
            accessibilityRole="button"
            accessibilityState={{ selected: opcao.ativo }}
            style={[styles.ordem, opcao.ativo && styles.ordemAtiva]}
          >
            <Text style={[styles.ordemTexto, opcao.ativo && styles.ordemTextoAtivo]}>{opcao.rotulo}</Text>
          </Pressable>
        ))}
      </View>
      {quantidadeFiltros > 0 ? (
        <Pressable onPress={handleLimparFiltros} accessibilityRole="button" style={styles.limparTudo} hitSlop={6}>
          <Text style={styles.limpar}>Limpar filtros</Text>
        </Pressable>
      ) : null}
      {erro && itens ? <Banner tom="erro">{erro}</Banner> : null}
      <FiltrosModal
        visivel={modalFiltros}
        filtros={filtros}
        modalidade={modalidade}
        onAplicar={(novos) => void handleAplicarFiltros(novos)}
        onFechar={() => setModalFiltros(false)}
      />
    </View>
  );

  return (
    <FlatList
      key={colunas}
      data={itens ?? []}
      keyExtractor={(item) => item.id}
      numColumns={colunas}
      style={styles.lista}
      contentContainerStyle={[styles.conteudo, { paddingHorizontal: gutter }]}
      columnWrapperStyle={colunas > 1 ? styles.linha : undefined}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      ListHeaderComponent={cabecalho}
      renderItem={({ item }) => (
        <CardAnuncio anuncio={cardDeVitrine(item)} largura={larguraCard} onPress={() => navigation.navigate('AnuncioDetalhe', { anuncioId: item.id })} />
      )}
      ListEmptyComponent={
        itens === null ? (
          erro ? (
            <EmptyState icone="!" titulo="Não foi possível carregar" mensagem={erro} acao={{ label: 'Tentar de novo', onPress: () => void carregarPagina(0) }} />
          ) : (
            <EmptyState titulo="Carregando anúncios" carregando />
          )
        ) : (
          <EmptyState
            imagem={filtrosAtivos ? undefined : { source: fundo.infantil, proporcao: 520 / 330 }}
            titulo={filtrosAtivos ? 'Nada encontrado' : 'Ainda não há anúncios'}
            mensagem={filtrosAtivos ? 'Tente outra palavra, categoria ou modalidade.' : 'Seja a primeira pessoa a anunciar um item.'}
            acao={
              filtrosAtivos
                ? { label: 'Limpar filtros', onPress: handleLimparFiltros }
                : { label: 'Anunciar um item', onPress: () => navigation.navigate('Anunciar') }
            }
          />
        )
      }
      ListFooterComponent={carregandoMais ? <ActivityIndicator color={colors.primary} style={styles.rodape} /> : null}
      onEndReached={handleCarregarMais}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={handleAtualizar} tintColor={colors.primary} colors={[colors.primary]} />}
    />
  );
}

const styles = StyleSheet.create({
  lista: { flex: 1, backgroundColor: colors.background },
  conteudo: { paddingTop: 16, paddingBottom: 32, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  cabecalho: { marginBottom: 18 },
  linha: { gap: ESPACO, marginBottom: 24 },
  limpar: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.teal, paddingLeft: 10 },
  limparTudo: { alignSelf: 'flex-start', marginTop: 10, minHeight: 32, justifyContent: 'center' },
  buscaLinha: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  buscaCampo: { flex: 1 },
  botaoFiltros: {
    minHeight: 52,
    paddingHorizontal: 18,
    marginBottom: 18,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  botaoFiltrosAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  botaoFiltrosTexto: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.primary, fontVariant: ['tabular-nums'] },
  botaoFiltrosTextoAtivo: { color: colors.textOnDark },
  pressionado: { opacity: 0.8 },
  ordemLinha: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  ordem: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    justifyContent: 'center',
  },
  ordemAtiva: { backgroundColor: colors.surfaceAlt },
  ordemTexto: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textMuted },
  ordemTextoAtivo: { color: colors.primary },
  rodape: { marginVertical: 20 },
});
