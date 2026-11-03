import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import Banner from '../components/Banner';
import ChipSelect from '../components/ChipSelect';
import MapaDescarte from '../components/descarte/MapaDescarte';
import PrimaryButton from '../components/PrimaryButton';
import Screen from '../components/Screen';
import TextField from '../components/TextField';
import { colors } from '../constants/colors';
import { tipografia } from '../constants/tipografia';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { FONTE_ECOPONTOS, MATERIAIS_DESCARTE, type Ecoponto, type MaterialDescarte, type RespostaEcopontos } from '../schemas/ecoponto';
import { obterMensagemErro } from '../services/api';
import { descreverIdade } from '../services/cache';
import { buscarEcopontos, lerEcopontosSalvos } from '../services/ecopontosService';
import { filtrarEcopontos, urlRotaEcoponto } from '../utils/ecopontos';

const TAMANHO_PAGINA = 8;
const OPCOES = [{ id: 'todos', label: 'Todos' }, ...MATERIAIS_DESCARTE];

export default function DescarteScreen() {
  const scroll = useRef<ScrollView>(null);
  const mapaY = useRef(0);
  const reduzirMovimento = useReduceMotion();
  const [dados, setDados] = useState<RespostaEcopontos | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvoEm, setSalvoEm] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [erroLink, setErroLink] = useState<string | null>(null);
  const [material, setMaterial] = useState<MaterialDescarte | 'todos'>('todos');
  const [busca, setBusca] = useState('');
  const [limite, setLimite] = useState(TAMANHO_PAGINA);
  const [foco, setFoco] = useState<{ id: string; pedido: number } | null>(null);
  const geracao = useRef(0);
  const carregar = useCallback(async () => {
    const atual = ++geracao.current;
    setCarregando(true); setErro(null);
    const copia = await lerEcopontosSalvos();
    if (atual !== geracao.current) return;
    if (copia) { setDados(copia.dados); setSalvoEm(copia.salvoEm); }
    try {
      const novos = await buscarEcopontos();
      if (atual === geracao.current) { setDados(novos); setSalvoEm(null); }
    } catch (falha) {
      if (atual === geracao.current) setErro(obterMensagemErro(falha));
    } finally {
      if (atual === geracao.current) setCarregando(false);
    }
  }, []);
  useEffect(() => { void carregar(); return () => { geracao.current++; }; }, [carregar]);
  const filtrados = useMemo(() => filtrarEcopontos(dados?.pontos ?? [], material, busca), [dados, material, busca]);
  const selecionado = filtrados.find((ponto) => ponto.id === foco?.id);

  const abrirLink = async (url: string) => {
    setErroLink(null);
    try { await Linking.openURL(url); } catch { setErroLink('Não foi possível abrir o link. Tente novamente.'); }
  };
  const verNoMapa = (ponto: Ecoponto) => {
    setFoco({ id: ponto.id, pedido: Date.now() });
    scroll.current?.scrollTo({ y: Math.max(0, mapaY.current - 16), animated: !reduzirMovimento });
  };

  return <Screen larguraMaxima={1000} scrollRef={scroll} atualizando={carregando && !!dados} onAtualizar={() => void carregar()}>
    <View style={styles.intro}>
      <Text style={tipografia.legenda}>SÃO PAULO • CAPITAL</Text>
      <Text accessibilityRole="header" style={tipografia.tituloTela}>Descarte consciente</Text>
      <Text style={tipografia.leitura}>Ainda dá para usar? Venda, troque ou doe pelo ReUse. Quando o item chegar ao fim da vida útil, encontre um ecoponto para o descarte.</Text>
      <Text style={tipografia.corpoSuave}>Locais da Prefeitura de São Paulo, com materiais e horários informados pelo GeoSampa. Confira as condições da unidade antes de sair.</Text>
      <Text style={tipografia.apoio}>Entulho: pequenas quantidades, até 1 m³ por dia por pessoa. Recicláveis secos incluem papel, plástico, vidro e metal. Gesso somente nas unidades indicadas.</Text>
    </View>
    <TextField label="Buscar por nome, endereço ou distrito" value={busca} onChangeText={(valor) => { setBusca(valor); setLimite(TAMANHO_PAGINA); setFoco(null); }} placeholder="Ex.: Pinheiros, Mooca, Bresser" maxLength={100} />
    <ChipSelect label="O que você precisa descartar?" opcoes={OPCOES} valor={material} onChange={(valor) => { setMaterial(valor as MaterialDescarte | 'todos'); setLimite(TAMANHO_PAGINA); setFoco(null); }} />
    <Text style={tipografia.apoio}>Eletrônicos, pilhas, lâmpadas, medicamentos e outros resíduos precisam de pontos específicos.</Text>
    <View style={styles.acoes}>
      <PrimaryButton label="Consultar outros materiais" variante="fantasma" compacto onPress={() => void abrirLink('https://www.reciclasampa.com.br/pontos-de-coleta')} />
      <PrimaryButton label={carregando ? 'Atualizando locais…' : 'Atualizar locais'} variante="fantasma" compacto desabilitado={carregando} onPress={() => void carregar()} />
    </View>
    {erro ? <Banner tom="aviso" titulo={dados ? 'Não foi possível atualizar os locais' : 'Locais indisponíveis'}>{`${erro}${dados ? ' Exibindo a última consulta disponível.' : ''}`}</Banner> : null}
    {erroLink ? <Banner tom="erro">{erroLink}</Banner> : null}
    {salvoEm ? <Text style={tipografia.apoio}>Lista salva no aparelho {descreverIdade(salvoEm)}. O mapa precisa de internet.</Text> : null}
    {dados ? <Text style={tipografia.apoio}>Fonte consultada em {new Date(dados.consultadoEm).toLocaleString('pt-BR')}. A base municipal pode ter alterações posteriores.</Text> : null}
    {carregando && !dados ? <ActivityIndicator color={colors.primary} accessibilityLabel="Consultando ecopontos" style={styles.carregando} /> : null}
    {dados ? <>
      <View style={styles.cabecalhoLista}>
        <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={tipografia.tituloSecao}>{filtrados.length} {filtrados.length === 1 ? 'ecoponto encontrado' : 'ecopontos encontrados'}</Text>
        <PrimaryButton label="Ir para o mapa" variante="secundario" compacto onPress={() => scroll.current?.scrollTo({ y: Math.max(0, mapaY.current - 16), animated: !reduzirMovimento })} />
      </View>
      {!filtrados.length ? <Text style={styles.vazio}>Nenhum ecoponto com esses filtros. Tente outro nome ou material.</Text> : null}
      {filtrados.slice(0, limite).map((ponto) => <View key={ponto.id} style={styles.local}>
        <Text accessibilityRole="header" style={tipografia.tituloBloco}>Ecoponto {ponto.nome}</Text>
        <Text style={tipografia.corpo}>{ponto.endereco}</Text>
        <Text style={tipografia.apoio}>{[ponto.distrito, ponto.subprefeitura].filter(Boolean).join(' • ')} • São Paulo/SP</Text>
        <Text style={tipografia.apoio}>Recebe: {ponto.recebimento || 'Consulte a unidade.'}</Text>
        <Text style={tipografia.apoio}>Horário informado: {ponto.horario || 'Consulte a unidade.'}</Text>
        <View style={styles.acoes}>
          <PrimaryButton label="Ver no mapa" variante="secundario" compacto onPress={() => verNoMapa(ponto)} />
          <PrimaryButton label="Como chegar" variante="fantasma" compacto onPress={() => void abrirLink(urlRotaEcoponto(ponto))} />
        </View>
      </View>)}
      {limite < filtrados.length ? <PrimaryButton label={`Mostrar mais locais (${Math.min(limite, filtrados.length)} de ${filtrados.length})`} variante="secundario" onPress={() => setLimite((valor) => valor + TAMANHO_PAGINA)} /> : null}
      <View style={styles.fonte}>
        <PrimaryButton label="Ver fonte oficial • GeoSampa" variante="fantasma" compacto onPress={() => void abrirLink(FONTE_ECOPONTOS)} />
        <PrimaryButton label="Conferir regras da Prefeitura" variante="fantasma" compacto onPress={() => void abrirLink('https://prefeitura.sp.gov.br/web/subprefeituras/w/ecoponto-esta%C3%A7%C3%A3o-de-entrega-volunt%C3%A1ria-de-inserv%C3%ADveis')} />
      </View>
      <View onLayout={(event) => { mapaY.current = event.nativeEvent.layout.y; }} style={styles.mapa}>
        <Text accessibilityRole="header" style={tipografia.tituloSecao}>Encontre no mapa</Text>
        <Text style={tipografia.corpoSuave}>O mapa mostra todos os {filtrados.length} locais dos filtros atuais, inclusive os que ainda não aparecem na lista. Toque em um marcador para ver o endereço.</Text>
        {filtrados.length ? <MapaDescarte pontos={filtrados} foco={foco} onSelecionar={(id) => setFoco({ id, pedido: Date.now() })} /> : <Text style={styles.vazio}>Sem locais para mostrar no mapa.</Text>}
        {selecionado ? <View style={styles.local}>
          <Text style={tipografia.tituloBloco}>Ecoponto {selecionado.nome}</Text>
          <Text style={tipografia.corpo}>{selecionado.endereco}</Text>
          <PrimaryButton label="Como chegar a este ecoponto" variante="secundario" onPress={() => void abrirLink(urlRotaEcoponto(selecionado))} />
        </View> : null}
        <Text style={tipografia.apoio}>Mapa: © OpenStreetMap contributors. Endereços: GeoSampa / Prefeitura de São Paulo. Como chegar abre o Google Maps.</Text>
      </View>
    </> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  intro: { gap: 14, marginBottom: 28, maxWidth: 760 },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10, marginBottom: 12 },
  cabecalhoLista: { gap: 16, marginTop: 28, marginBottom: 8, alignItems: 'flex-start' },
  local: { paddingVertical: 20, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.divider },
  mapa: { gap: 16, marginTop: 28 }, fonte: { marginTop: 20, alignItems: 'flex-start' },
  vazio: { ...tipografia.corpoSuave, paddingVertical: 32 }, carregando: { marginVertical: 32 },
});
