import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Banner from '../../components/Banner';
import ChipSelect from '../../components/ChipSelect';
import EmptyState from '../../components/EmptyState';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import type { TelaAbaProps } from '../../navigation/tipos';
import { PLANOS_DESTAQUE, type PlanoDestaqueId } from '../../schemas/anuncio';
import { obterMensagemErro } from '../../services/api';
import { buscarMeuAnuncio, cancelarPedidoDestaque, contratarDestaque } from '../../services/anunciosService';
import type { AnuncioProprio } from '../../types/api';
import { confirmarAcao } from '../../utils/confirmarAcao';
import { formatarData, formatarMoeda } from '../../utils/formatarAnuncio';

const opcoesPlano = PLANOS_DESTAQUE.map((plano) => ({
  id: plano.id,
  label: `${plano.label} por ${formatarMoeda(plano.precoCentavos)}`,
  descricao: `${formatarMoeda(Math.round(plano.precoCentavos / plano.dias))} por dia, identificado como anúncio em destaque.`,
}));

// Exposição adicional paga. O pedido fica registrado; a ativação depende do pagamento (integração da Fase 6).
export default function DestacarAnuncioScreen({ navigation, route }: TelaAbaProps<'DestacarAnuncio'>) {
  const { anuncioId } = route.params;
  const [anuncio, setAnuncio] = useState<AnuncioProprio | null>(null);
  const [plano, setPlano] = useState<PlanoDestaqueId>(PLANOS_DESTAQUE[0].id);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const carregarAnuncio = useCallback(async () => {
    setErro(null);
    try {
      setAnuncio(await buscarMeuAnuncio(anuncioId));
    } catch (falha) {
      setErro(obterMensagemErro(falha));
    }
  }, [anuncioId]);

  useEffect(() => {
    void carregarAnuncio();
  }, [carregarAnuncio]);

  const handleContratar = async () => {
    setEnviando(true);
    setErro(null);
    try {
      setAnuncio(await contratarDestaque(anuncioId, plano));
    } catch (falha) {
      setErro(obterMensagemErro(falha));
    } finally {
      setEnviando(false);
    }
  };

  const handleCancelar = async () => {
    const confirmado = await confirmarAcao({
      titulo: 'Cancelar pedido de destaque?',
      mensagem: 'Nada foi cobrado. Você pode pedir de novo quando quiser.',
      confirmar: 'Cancelar pedido',
      destrutivo: true,
    });
    if (!confirmado) {
      return;
    }
    setEnviando(true);
    try {
      setAnuncio(await cancelarPedidoDestaque(anuncioId));
    } catch (falha) {
      setErro(obterMensagemErro(falha));
    } finally {
      setEnviando(false);
    }
  };

  if (!anuncio) {
    return (
      <Screen>
        <EmptyState
          icone="!"
          titulo={erro ? 'Não foi possível carregar' : 'Carregando'}
          mensagem={erro ?? undefined}
          carregando={!erro}
          acao={erro ? { label: 'Tentar de novo', onPress: () => void carregarAnuncio() } : undefined}
        />
      </Screen>
    );
  }

  const pedido = anuncio.pedidoDestaque;
  const planoPedido = pedido ? PLANOS_DESTAQUE.find((item) => item.id === pedido.plano) : undefined;

  return (
    <Screen>
      <Text style={styles.titulo}>Destacar “{anuncio.titulo}”</Text>
      <Text style={styles.subtitulo}>
        O anúncio aparece no topo da busca e nos destaques da Home, sempre identificado como anúncio em destaque.
      </Text>

      {erro ? <Banner tom="erro">{erro}</Banner> : null}

      {anuncio.destaqueAte ? (
        <Banner tom="sucesso" titulo="Destaque ativo">
          {`Seu anúncio está em destaque até ${formatarData(anuncio.destaqueAte)}.`}
        </Banner>
      ) : pedido ? (
        <>
          <Banner tom="info" titulo="Pedido registrado">
            {`${planoPedido?.label ?? 'Destaque'} por ${planoPedido ? formatarMoeda(planoPedido.precoCentavos) : ''}, pedido em ${formatarData(pedido.criadoEm)}. O pagamento online chega na próxima fase do ReUse; o destaque começa a contar quando o pagamento for confirmado.`}
          </Banner>
          <PrimaryButton label="Cancelar pedido" variante="perigo" carregando={enviando} onPress={handleCancelar} style={styles.botao} />
          <PrimaryButton label="Voltar ao anúncio" variante="secundario" onPress={() => navigation.goBack()} />
        </>
      ) : anuncio.status !== 'disponivel' ? (
        <Banner tom="aviso">Só anúncios disponíveis podem ser destacados.</Banner>
      ) : (
        <>
          <ChipSelect
            label="Escolha o período"
            layout="lista"
            opcoes={opcoesPlano}
            valor={plano}
            onChange={(valor) => setPlano(valor as PlanoDestaqueId)}
          />
          <Text style={styles.nota}>Nenhuma cobrança é feita agora: o pedido fica aguardando a etapa de pagamento.</Text>
          <PrimaryButton label="Pedir destaque" carregando={enviando} onPress={handleContratar} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titulo: { fontFamily: fonts.displayBold, fontSize: 26, lineHeight: 30, color: colors.primary },
  subtitulo: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textMuted, marginTop: 8, marginBottom: 22 },
  nota: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.textMuted, marginBottom: 16 },
  botao: { marginBottom: 10 },
});
