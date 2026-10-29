import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AnuncioPreview from '../../components/AnuncioPreview';
import Banner from '../../components/Banner';
import EmptyState from '../../components/EmptyState';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import StatusBadge from '../../components/StatusBadge';
import { colors } from '../../constants/colors';
import { tipografia } from '../../constants/tipografia';
import { useResponsive } from '../../hooks/useResponsive';
import { obterStatusPermitidos, podeEditar, podeExcluir, useAcoesAnuncio } from '../../hooks/useAcoesAnuncio';
import type { TelaAbaProps } from '../../navigation/tipos';
import { PLANOS_DESTAQUE } from '../../schemas/anuncio';
import { obterMensagemErro } from '../../services/api';
import { buscarMeuAnuncio } from '../../services/anunciosService';
import type { AnuncioProprio } from '../../types/api';
import { formatarData, obterLabelStatus, statusInfo } from '../../utils/formatarAnuncio';

export default function GerenciarAnuncioScreen({ navigation, route }: TelaAbaProps<'GerenciarAnuncio'>) {
  const { anuncioId, aviso } = route.params;
  const [anuncio, setAnuncio] = useState<AnuncioProprio | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const { gutter } = useResponsive();

  const { processando, mudarStatus, excluir } = useAcoesAnuncio({
    onAtualizado: setAnuncio,
    onExcluido: () => navigation.goBack(),
  });

  const carregarAnuncio = useCallback(async () => {
    setErro(null);
    try {
      setAnuncio(await buscarMeuAnuncio(anuncioId));
    } catch (falha) {
      setErro(obterMensagemErro(falha));
    }
  }, [anuncioId]);

  useFocusEffect(
    useCallback(() => {
      void carregarAnuncio();
    }, [carregarAnuncio]),
  );

  if (!anuncio) {
    return (
      <Screen>
        <EmptyState
          icone="!"
          titulo={erro ? 'Não foi possível carregar' : 'Carregando anúncio'}
          mensagem={erro ?? undefined}
          carregando={!erro}
          acao={erro ? { label: 'Tentar de novo', onPress: () => void carregarAnuncio() } : undefined}
        />
      </Screen>
    );
  }

  const ocupado = processando === anuncio.id;
  const statusPermitidos = obterStatusPermitidos(anuncio).filter((status) => status !== 'arquivado');
  const plano = anuncio.pedidoDestaque ? PLANOS_DESTAQUE.find((item) => item.id === anuncio.pedidoDestaque?.plano) : undefined;

  // Rótulos com verbo: deixam claro que o botão muda o status (não que ele é o status atual).
  const rotuloAcaoStatus = (status: (typeof statusPermitidos)[number]) =>
    status === 'disponivel' && anuncio.status === 'arquivado' ? 'Reativar anúncio' : `Marcar como ${obterLabelStatus(status).toLowerCase()}`;

  return (
    <Screen larguraMaxima={640}>
      {aviso ? <Banner tom="sucesso">{aviso}</Banner> : null}
      {erro ? <Banner tom="erro">{erro}</Banner> : null}

      <Text style={tipografia.tituloTela} numberOfLines={2}>
        {anuncio.titulo}
      </Text>

      <View style={styles.secao}>
        <View style={styles.statusLinha}>
          <StatusBadge status={anuncio.status} />
          {anuncio.destaqueAte ? <Text style={tipografia.legenda}>Em destaque até {formatarData(anuncio.destaqueAte)}</Text> : null}
        </View>
        <Text style={[tipografia.corpoSuave, styles.espaco]}>{statusInfo[anuncio.status].descricao}</Text>
        {statusPermitidos.length > 0 ? (
          <View style={styles.botoes}>
            {statusPermitidos.map((status) => (
              <PrimaryButton
                key={status}
                label={rotuloAcaoStatus(status)}
                variante="secundario"
                compacto
                desabilitado={ocupado}
                onPress={() => void mudarStatus(anuncio, status)}
              />
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.secao}>
        <Text style={tipografia.tituloBloco}>Desempenho</Text>
        <Text style={[tipografia.corpo, styles.espaco, styles.numeros]}>
          {anuncio.visualizacoes} {anuncio.visualizacoes === 1 ? 'visualização' : 'visualizações'} e {anuncio.contatos}{' '}
          {anuncio.contatos === 1 ? 'contato' : 'contatos'} até agora.
        </Text>
        <Text style={[tipografia.apoio, styles.espaco]}>
          Publicado em {formatarData(anuncio.criadoEm)}, atualizado em {formatarData(anuncio.atualizadoEm)}.
        </Text>
      </View>

      {anuncio.status === 'disponivel' && !anuncio.destaqueAte ? (
        <View style={styles.secao}>
          <Text style={tipografia.tituloBloco}>Destaque</Text>
          <Text style={[tipografia.corpoSuave, styles.espaco]}>
            {anuncio.pedidoDestaque
              ? `Pedido de ${plano?.label ?? 'destaque'} feito em ${formatarData(anuncio.pedidoDestaque.criadoEm)}, aguardando pagamento.`
              : 'Apareça primeiro na busca e na Home por alguns dias.'}
          </Text>
          <PrimaryButton
            label={anuncio.pedidoDestaque ? 'Ver pedido' : 'Destacar anúncio'}
            variante="secundario"
            compacto
            onPress={() => navigation.navigate('DestacarAnuncio', { anuncioId: anuncio.id })}
            style={styles.botaoUnico}
          />
        </View>
      ) : null}

      <View style={[styles.secao, styles.acoes]}>
        {podeEditar(anuncio) ? (
          <PrimaryButton label="Editar anúncio" onPress={() => navigation.navigate('EditarAnuncio', { anuncioId: anuncio.id })} />
        ) : (
          <Text style={tipografia.apoio}>
            {anuncio.jaConcluido ? 'Itens concluídos ficam congelados para preservar o histórico.' : 'Para editar, volte o status para disponível.'}
          </Text>
        )}
        {obterStatusPermitidos(anuncio).includes('arquivado') ? (
          <PrimaryButton label="Arquivar" variante="secundario" desabilitado={ocupado} onPress={() => void mudarStatus(anuncio, 'arquivado')} />
        ) : null}
        {podeExcluir(anuncio) ? (
          <PrimaryButton label="Excluir anúncio" variante="perigo" desabilitado={ocupado} onPress={() => void excluir(anuncio)} />
        ) : null}
      </View>

      <View style={styles.secao}>
        <Text style={tipografia.tituloBloco}>Como aparece para os outros</Text>
      </View>
      <AnuncioPreview
        gutter={gutter}
        dados={{
          fotos: anuncio.imagens.map((imagem) => imagem.url),
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  secao: { paddingVertical: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  statusLinha: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  espaco: { marginTop: 6 },
  numeros: { fontVariant: ['tabular-nums'] },
  botoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  botaoUnico: { alignSelf: 'flex-start', marginTop: 14 },
  acoes: { gap: 10 },
});
