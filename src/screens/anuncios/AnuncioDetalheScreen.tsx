import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import ActionSheet from '../../components/ActionSheet';
import AnuncioPreview from '../../components/AnuncioPreview';
import Avatar from '../../components/Avatar';
import Banner from '../../components/Banner';
import EmptyState from '../../components/EmptyState';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import StatusBadge from '../../components/StatusBadge';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { tipografia } from '../../constants/tipografia';
import { useSessao } from '../../contexts/SessaoContext';
import { useResponsive } from '../../hooks/useResponsive';
import type { TelaAbaProps } from '../../navigation/tipos';
import { MOTIVOS_DENUNCIA, type Modalidade } from '../../schemas/anuncio';
import { obterMensagemErro } from '../../services/api';
import { buscarAnuncioPublico, denunciarAnuncio, registrarVisualizacao } from '../../services/anunciosService';
import { alternarSalvo, estaSalvo } from '../../services/salvosService';
import type { AnuncioPublico } from '../../types/api';
import { formatarMesAno, obterLabelTipoConta } from '../../utils/formatarAnuncio';
import { showMessage } from '../../utils/showMessage';

const ACAO_POR_MODALIDADE: Record<Modalidade, string> = {
  venda: 'Tenho interesse',
  troca: 'Propor troca',
  doacao: 'Solicitar doação',
};

const URL_SITE = 'https://reuse-fiapweb2.pages.dev';

function BotaoAcao({ rotulo, ativo = false, onPress }: { rotulo: string; ativo?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      style={({ pressed }) => [styles.acao, ativo && styles.acaoAtiva, pressed && styles.pressionado]}
    >
      <Text style={[styles.acaoTexto, ativo && styles.acaoTextoAtivo]}>{rotulo}</Text>
    </Pressable>
  );
}

export default function AnuncioDetalheScreen({ navigation, route }: TelaAbaProps<'AnuncioDetalhe'>) {
  const { anuncioId } = route.params;
  const { status } = useSessao();
  const { gutter } = useResponsive();
  const [anuncio, setAnuncio] = useState<AnuncioPublico | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [menuDenuncia, setMenuDenuncia] = useState(false);

  const carregarAnuncio = useCallback(async () => {
    setErro(null);
    try {
      setAnuncio(await buscarAnuncioPublico(anuncioId));
    } catch (falha) {
      setErro(obterMensagemErro(falha));
    }
  }, [anuncioId]);

  useEffect(() => {
    void carregarAnuncio();
    void registrarVisualizacao(anuncioId);
    estaSalvo(anuncioId).then(setSalvo);
  }, [anuncioId, carregarAnuncio]);

  if (!anuncio) {
    return (
      <Screen>
        <EmptyState
          icone="!"
          titulo={erro ? 'Anúncio indisponível' : 'Carregando anúncio'}
          mensagem={erro ?? undefined}
          carregando={!erro}
          acao={erro ? { label: 'Ver outros anúncios', onPress: () => navigation.navigate('Abas', { screen: 'Anuncios' }) } : undefined}
        />
      </Screen>
    );
  }

  const { anunciante } = anuncio;
  const disponivel = anuncio.status === 'disponivel';
  const link = `${URL_SITE}/anuncios/${anuncio.id}`;

  // Propostas, pedidos e chat são da Fase 4; por enquanto o botão explica o próximo passo.
  const handleNegociar = () => {
    if (status !== 'autenticado') {
      navigation.navigate('Entrar');
      return;
    }
    showMessage(
      ACAO_POR_MODALIDADE[anuncio.modalidade],
      'As propostas e conversas entre interessado e anunciante chegam na próxima etapa do ReUse. Por enquanto, você pode salvar o anúncio e ver o perfil de quem anunciou.',
    );
  };

  const handleSalvar = async () => {
    setSalvo(
      await alternarSalvo({
        id: anuncio.id,
        titulo: anuncio.titulo,
        modalidade: anuncio.modalidade,
        precoCentavos: anuncio.precoCentavos,
        capaUrl: anuncio.imagens[0] ?? null,
        emDestaque: anuncio.emDestaque,
        meta: anuncio.localizacao ? `${anuncio.localizacao.bairro}, ${anuncio.localizacao.cidade}` : undefined,
      }),
    );
  };

  // Compartilhamento nativo do sistema; no navegador sem suporte, mostra o link para copiar.
  const handleCompartilhar = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.share) {
        await navigator.clipboard?.writeText(link);
        showMessage('Link copiado', link);
        return;
      }
      await Share.share({ message: `${anuncio.titulo} no ReUse: ${link}`, url: link, title: anuncio.titulo });
    } catch {
      showMessage('Compartilhar', link);
    }
  };

  const handleDenunciar = async (motivo: string, rotulo: string) => {
    if (status !== 'autenticado') {
      navigation.navigate('Entrar');
      return;
    }
    try {
      const resposta = await denunciarAnuncio(anuncio.id, motivo, '');
      showMessage('Denúncia enviada', `${rotulo}. ${resposta.mensagem}`);
    } catch (falha) {
      showMessage('Não foi possível denunciar', obterMensagemErro(falha));
    }
  };

  const rodape = anuncio.proprio ? (
    <PrimaryButton label="Gerenciar meu anúncio" onPress={() => navigation.navigate('GerenciarAnuncio', { anuncioId: anuncio.id })} />
  ) : disponivel ? (
    <PrimaryButton
      label={status === 'autenticado' ? ACAO_POR_MODALIDADE[anuncio.modalidade] : `Entrar para ${ACAO_POR_MODALIDADE[anuncio.modalidade].toLowerCase()}`}
      onPress={handleNegociar}
    />
  ) : undefined;

  const blocoAnunciante = (
    <Pressable
      onPress={() => navigation.navigate('PerfilPublico', { userId: anunciante.id })}
      accessibilityRole="button"
      accessibilityLabel={`Ver perfil de ${anunciante.nomePublico}`}
      style={({ pressed }) => [styles.anunciante, pressed && styles.pressionado]}
    >
      <Avatar nome={anunciante.nomePublico} uri={anunciante.fotoUrl} tamanho={48} />
      <View style={styles.anuncianteTextos}>
        <Text style={tipografia.tituloBloco}>
          {anunciante.nomePublico}
          {anunciante.tipoConta !== 'pessoa' ? <Text style={styles.anuncianteTipo}>  {obterLabelTipoConta(anunciante.tipoConta)} (declarado)</Text> : null}
        </Text>
        <Text style={tipografia.apoio}>
          {anunciante.reputacaoMedia !== null
            ? `★ ${anunciante.reputacaoMedia.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} em ${anunciante.totalAvaliacoes} ${anunciante.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'}`
            : 'Sem avaliações ainda'}
          {`, no ReUse desde ${formatarMesAno(anunciante.membroDesde)}`}
        </Text>
      </View>
      <Text style={styles.seta}>›</Text>
    </Pressable>
  );

  return (
    <Screen larguraMaxima={680} rodape={rodape}>
      <AnuncioPreview
        colarNoTopo
        gutter={gutter}
        anunciante={blocoAnunciante}
        acoes={
          <View style={styles.acoes}>
            <BotaoAcao rotulo={salvo ? 'Salvo' : 'Salvar'} ativo={salvo} onPress={() => void handleSalvar()} />
            <BotaoAcao rotulo="Compartilhar" onPress={() => void handleCompartilhar()} />
          </View>
        }
        dados={{
          fotos: anuncio.imagens,
          titulo: anuncio.titulo,
          descricao: anuncio.descricao,
          categoria: anuncio.categoria,
          condicao: anuncio.condicao,
          modalidade: anuncio.modalidade,
          precoCentavos: anuncio.precoCentavos,
          aceitaOfertas: anuncio.aceitaOfertas,
          preferenciaTroca: anuncio.preferenciaTroca,
          entregas: anuncio.entregas,
          localizacao: anuncio.localizacao,
          status: anuncio.status,
          subcategoria: anuncio.subcategoria,
          valorEstimadoCentavos: anuncio.valorEstimadoCentavos,
          trocaQualquerCategoria: anuncio.trocaQualquerCategoria,
          trocaCategorias: anuncio.trocaCategorias,
          trocaComplemento: anuncio.trocaComplemento,
          doacaoDestino: anuncio.doacaoDestino,
          doacaoImediata: anuncio.doacaoImediata,
        }}
      />

      {anuncio.proprio ? <Banner tom="info">Este é o seu anúncio: é assim que as outras pessoas o veem.</Banner> : null}
      {!disponivel ? (
        <View style={styles.status}>
          <StatusBadge status={anuncio.status} />
        </View>
      ) : null}
      {anuncio.emDestaque ? <Text style={tipografia.legenda}>Anúncio em destaque (exposição paga).</Text> : null}

      {!anuncio.proprio ? (
        <Pressable onPress={() => setMenuDenuncia(true)} accessibilityRole="button" hitSlop={8} style={styles.denunciar}>
          <Text style={styles.denunciarTexto}>Denunciar anúncio</Text>
        </Pressable>
      ) : null}

      <ActionSheet
        visivel={menuDenuncia}
        titulo="Por que você quer denunciar?"
        onFechar={() => setMenuDenuncia(false)}
        acoes={MOTIVOS_DENUNCIA.map((motivo) => ({
          id: motivo.id,
          label: motivo.label,
          onPress: () => void handleDenunciar(motivo.id, motivo.label),
        }))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pressionado: { opacity: 0.8 },
  acoes: { flexDirection: 'row', gap: 8, marginTop: 2 },
  acao: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  acaoAtiva: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt },
  acaoTexto: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  acaoTextoAtivo: { color: colors.primary },
  anunciante: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  anuncianteTextos: { flex: 1, marginLeft: 14, gap: 2 },
  anuncianteTipo: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.teal },
  seta: { fontFamily: fonts.bodyBold, fontSize: 26, color: colors.textMuted },
  status: { marginTop: 8, marginBottom: 12 },
  denunciar: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginTop: 12 },
  denunciarTexto: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.danger },
});
