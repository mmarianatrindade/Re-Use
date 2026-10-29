import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { radii } from '../constants/radii';
import {
  COMPLEMENTO_TROCA,
  CONDICOES,
  ENTREGAS,
  FAIXAS_PRECO,
  POSICAO_SEM_LIMITE,
  RAIOS_KM,
  TOTAL_POSICOES_PRECO,
  encontrarCategoria,
  posicaoDoPreco,
  precoDaPosicao,
} from '../schemas/catalogo';
import { converterPrecoParaCentavos, type Modalidade } from '../schemas/anuncio';
import { FILTROS_VAZIOS, type FiltrosAnuncios } from '../types/filtros';
import { mascararPreco } from '../utils/mascaras';
import Checkbox from './Checkbox';
import ChipSelect from './ChipSelect';
import PrimaryButton from './PrimaryButton';
import SeletorCategoria from './SeletorCategoria';
import SliderFaixa from './SliderFaixa';
import TextField from './TextField';

interface FiltrosModalProps {
  visivel: boolean;
  filtros: FiltrosAnuncios;
  // Esconde as seções de troca/doação quando a vitrine já está filtrada em outra modalidade.
  modalidade: Modalidade | 'todas';
  onAplicar: (filtros: FiltrosAnuncios) => void;
  onFechar: () => void;
}

type SecaoId = 'categoria' | 'estado' | 'preco' | 'local' | 'entrega' | 'troca' | 'doacao';

// Área da busca. A distância ("raio") fica no slider abaixo das opções.
const OPCOES_LOCAL = [
  { id: 'brasil', label: 'Todo o Brasil' },
  { id: 'cidade', label: 'Minha cidade' },
  { id: 'estado', label: 'Meu estado' },
];

// Posição do slider para um raio salvo (filtros antigos podem ter valores fora da lista); sem raio = posição 0.
function posicaoDoRaio(km: number | null) {
  const alvo = km ?? 0;
  let melhor = 0;
  RAIOS_KM.forEach((valor, indice) => {
    if (Math.abs(valor - alvo) < Math.abs(RAIOS_KM[melhor] - alvo)) melhor = indice;
  });
  return melhor;
}

const descreverRaio = (posicao: number) => (RAIOS_KM[posicao] === 0 ? 'Sem limite de distância' : `Até ${RAIOS_KM[posicao].toLocaleString('pt-BR')} km`);

const OPCOES_DOACAO = [
  { id: 'organizacoes', label: 'Para organizações' },
  { id: 'pessoas', label: 'Para pessoas' },
];

const OPCOES_DOACAO_EXTRAS = [
  { id: 'imediata', label: 'Disponível imediatamente' },
  { id: 'retirar', label: 'Precisa retirar' },
  { id: 'entrega', label: 'Possui entrega' },
  { id: 'ponto', label: 'Retirada em Ponto ReUse' },
];

// ==FUNCOES==
function formatarReais(centavos: number) {
  return `R$ ${(centavos / 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

function descreverPosicaoPreco(posicao: number) {
  const centavos = precoDaPosicao(posicao);
  return centavos === null ? 'Sem limite' : formatarReais(centavos);
}

// Faixa do filtro em posições do slider. Aceita filtros antigos, salvos com as faixas fixas (ex.: "R$ 25–50").
function lerFaixaPreco(filtros: FiltrosAnuncios): [number, number] {
  let minimo: number | null = null;
  let maximo: number | null = null;
  if (filtros.faixaPreco === 'personalizado') {
    minimo = converterPrecoParaCentavos(filtros.precoMinimo);
    maximo = converterPrecoParaCentavos(filtros.precoMaximo);
  } else if (filtros.faixaPreco && filtros.faixaPreco !== 'gratis') {
    const faixa = FAIXAS_PRECO.find((item) => item.id === filtros.faixaPreco);
    minimo = faixa?.min ?? null;
    maximo = faixa?.max ?? null;
  }
  const inicio = posicaoDoPreco(minimo, 'inicio');
  return [inicio, Math.max(posicaoDoPreco(maximo, 'fim'), inicio + 1)];
}

// Trilho inteiro (R$ 0 até sem limite) = sem filtro de preço; qualquer outra posição vira faixa personalizada.
function montarFiltroPreco(inicio: number, fim: number): Partial<FiltrosAnuncios> {
  if (inicio === 0 && fim === POSICAO_SEM_LIMITE) {
    return { faixaPreco: null, precoMinimo: '', precoMaximo: '' };
  }
  const minimo = precoDaPosicao(inicio);
  const maximo = precoDaPosicao(fim);
  return {
    faixaPreco: 'personalizado',
    precoMinimo: minimo ? mascararPreco(String(minimo)) : '',
    precoMaximo: maximo === null ? '' : mascararPreco(String(maximo)),
  };
}

function resumirPreco(filtros: FiltrosAnuncios) {
  if (filtros.faixaPreco === 'gratis') return 'Só grátis';
  if (!filtros.faixaPreco) return 'Qualquer';
  const [inicio, fim] = lerFaixaPreco(filtros);
  if (inicio === 0) return `Até ${descreverPosicaoPreco(fim)}`;
  if (fim === POSICAO_SEM_LIMITE) return `A partir de ${descreverPosicaoPreco(inicio)}`;
  return `${descreverPosicaoPreco(inicio)} a ${descreverPosicaoPreco(fim)}`;
}

function Secao({
  titulo,
  resumo,
  aberta,
  onAlternar,
  children,
}: {
  titulo: string;
  resumo: string;
  aberta: boolean;
  onAlternar: () => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.secao}>
      <Pressable
        onPress={onAlternar}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberta }}
        accessibilityLabel={`${titulo}. ${resumo}`}
        style={styles.secaoCabecalho}
      >
        <View style={styles.secaoTextos}>
          <Text style={styles.secaoTitulo}>{titulo}</Text>
          <Text style={[styles.secaoResumo, resumo !== 'Qualquer' && styles.secaoResumoAtivo]} numberOfLines={1}>
            {resumo}
          </Text>
        </View>
        <Text style={[styles.seta, aberta && styles.setaAberta]}>›</Text>
      </Pressable>
      {aberta ? <View style={styles.secaoCorpo}>{children}</View> : null}
    </View>
  );
}

// Filtros completos da vitrine num modal: o rascunho só vale ao tocar em "Ver resultados".
export default function FiltrosModal({ visivel, filtros, modalidade, onAplicar, onFechar }: FiltrosModalProps) {
  const insets = useSafeAreaInsets();
  const [rascunho, setRascunho] = useState(filtros);
  // Todas as seções começam fechadas (inclusive Categorias): o resumo de cada uma já mostra o que está aplicado.
  const [aberta, setAberta] = useState<SecaoId | null>(null);

  useEffect(() => {
    if (visivel) {
      // O filtro por tipo de anunciante saiu da tela: um valor salvo antes não pode ficar ativo sem aparecer.
      setRascunho({ ...filtros, anunciantes: [] });
      setAberta(null);
    }
  }, [visivel, filtros]);

  const alterar = (parcial: Partial<FiltrosAnuncios>) => setRascunho((atual) => ({ ...atual, ...parcial }));
  const alternarSecao = (id: SecaoId) => setAberta((atual) => (atual === id ? null : id));

  const categoria = rascunho.categoria ? encontrarCategoria(rascunho.categoria) : undefined;
  const mostrarTroca = modalidade === 'todas' || modalidade === 'troca';
  const mostrarDoacao = modalidade === 'todas' || modalidade === 'doacao';
  const faixaPreco = lerFaixaPreco(rascunho);
  const posicaoRaio = rascunho.localizacao === 'raio' ? posicaoDoRaio(rascunho.raioKm) : 0;

  const resumos: Record<SecaoId, string> = {
    categoria: categoria
      ? `${categoria.label}${rascunho.subcategoria ? ` › ${categoria.subcategorias.find((sub) => sub.id === rascunho.subcategoria)?.label ?? ''}` : ''}`
      : 'Qualquer',
    estado: rascunho.condicoes.length > 0 ? `${rascunho.condicoes.length} selecionado(s)` : 'Qualquer',
    preco: resumirPreco(rascunho),
    local:
      rascunho.localizacao === 'raio'
        ? descreverRaio(posicaoRaio)
        : OPCOES_LOCAL.find((opcao) => opcao.id === rascunho.localizacao)?.label ?? 'Todo o Brasil',
    entrega: rascunho.entregas.length > 0 || rascunho.variasEntregas ? `${rascunho.entregas.length + (rascunho.variasEntregas ? 1 : 0)} selecionado(s)` : 'Qualquer',
    troca:
      rascunho.trocaQualquerCategoria || rascunho.trocaCategoria || rascunho.complemento || rascunho.tenho || rascunho.procuro
        ? 'Com filtros'
        : 'Qualquer',
    doacao:
      rascunho.doacaoDestino || rascunho.doacaoImediata || rascunho.precisaRetirar || rascunho.possuiEntrega || rascunho.pontoReuse
        ? 'Com filtros'
        : 'Qualquer',
  };

  const extrasDoacao = [
    rascunho.doacaoImediata && 'imediata',
    rascunho.precisaRetirar && 'retirar',
    rascunho.possuiEntrega && 'entrega',
    rascunho.pontoReuse && 'ponto',
  ].filter((valor): valor is string => Boolean(valor));

  return (
    <Modal
      visible={visivel}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
      onRequestClose={onFechar}
    >
      <View style={[styles.raiz, { paddingTop: Platform.OS === 'ios' ? 12 : insets.top + 8 }]}>
        <View style={styles.topo}>
          <Text style={styles.titulo}>Filtros</Text>
          <Pressable onPress={onFechar} accessibilityRole="button" accessibilityLabel="Fechar filtros" hitSlop={10} style={styles.fechar}>
            <Text style={styles.fecharTexto}>Fechar</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <Secao titulo="Categorias" resumo={resumos.categoria} aberta={aberta === 'categoria'} onAlternar={() => alternarSecao('categoria')}>
            <SeletorCategoria
              categoria={rascunho.categoria}
              subcategoria={rascunho.subcategoria}
              onChange={(novaCategoria, novaSubcategoria) => alterar({ categoria: novaCategoria, subcategoria: novaSubcategoria })}
            />
          </Secao>

          <Secao titulo="Estado do produto" resumo={resumos.estado} aberta={aberta === 'estado'} onAlternar={() => alternarSecao('estado')}>
            {/* Uma coluna na ordem de CONDICOES: do mais conservado (Novo) ao mais desgastado (Para peças). */}
            <ChipSelect
              multiplo
              layout="lista"
              descricaoSoSelecionada
              opcoes={CONDICOES}
              valor={rascunho.condicoes}
              onChange={(valor) => alterar({ condicoes: valor as string[] })}
            />
          </Secao>

          <Secao titulo="Faixa de preço" resumo={resumos.preco} aberta={aberta === 'preco'} onAlternar={() => alternarSecao('preco')}>
            {rascunho.faixaPreco !== 'gratis' ? (
              <>
                <View style={styles.precoValores}>
                  <View>
                    <Text style={styles.precoRotulo}>Valor inicial</Text>
                    <Text style={styles.precoValor}>{descreverPosicaoPreco(faixaPreco[0])}</Text>
                  </View>
                  <View style={styles.precoFim}>
                    <Text style={styles.precoRotulo}>Valor final</Text>
                    <Text style={styles.precoValor}>{descreverPosicaoPreco(faixaPreco[1])}</Text>
                  </View>
                </View>
                <SliderFaixa
                  total={TOTAL_POSICOES_PRECO}
                  inicio={faixaPreco[0]}
                  fim={faixaPreco[1]}
                  onChange={(inicio, fim) => alterar(montarFiltroPreco(inicio, fim))}
                  descrever={descreverPosicaoPreco}
                />
              </>
            ) : null}
            <Checkbox
              marcado={rascunho.faixaPreco === 'gratis'}
              onAlternar={(marcado) => alterar(marcado ? { faixaPreco: 'gratis', precoMinimo: '', precoMaximo: '' } : { faixaPreco: null })}
              accessibilityLabel="Somente itens grátis"
            >
              <Text style={styles.opcao}>Somente itens grátis</Text>
            </Checkbox>
            <Text style={styles.nota}>Em trocas vale o valor estimado informado pelo anunciante, só como referência.</Text>
          </Secao>

          <Secao titulo="Localização" resumo={resumos.local} aberta={aberta === 'local'} onAlternar={() => alternarSecao('local')}>
            <ChipSelect
              layout="lista"
              opcoes={OPCOES_LOCAL}
              // Com distância escolhida no slider, nenhuma das áreas fica marcada.
              valor={rascunho.localizacao === 'raio' ? '' : rascunho.localizacao}
              onChange={(valor) => alterar({ localizacao: valor as FiltrosAnuncios['localizacao'], raioKm: null })}
            />
            {/* Distância a partir do aparelho: 0 = sem limite; acima de 0 substitui cidade/estado. */}
            <View style={styles.raio}>
              <View style={styles.precoValores}>
                <Text style={styles.precoRotulo}>Distância de você</Text>
                <Text style={styles.precoValor}>{descreverRaio(posicaoRaio)}</Text>
              </View>
              <SliderFaixa
                total={RAIOS_KM.length}
                fim={posicaoRaio}
                onChange={(_inicio, fim) =>
                  alterar(RAIOS_KM[fim] === 0 ? { localizacao: 'brasil', raioKm: null } : { localizacao: 'raio', raioKm: RAIOS_KM[fim] })
                }
                descrever={descreverRaio}
              />
              <View style={styles.precoValores}>
                <Text style={styles.precoRotulo}>0 km</Text>
                <Text style={styles.precoRotulo}>1.000 km</Text>
              </View>
            </View>
            <View style={styles.emBreve}>
              <Text style={styles.emBreveTexto}>Ver no mapa (em breve)</Text>
            </View>
            <Text style={styles.nota}>
              Usamos a localização aproximada do seu aparelho. O endereço exato de quem anuncia nunca aparece.
            </Text>
          </Secao>

          <Secao titulo="Forma de recebimento" resumo={resumos.entrega} aberta={aberta === 'entrega'} onAlternar={() => alternarSecao('entrega')}>
            <ChipSelect
              multiplo
              layout="lista"
              descricaoSoSelecionada
              opcoes={ENTREGAS}
              valor={rascunho.entregas}
              onChange={(valor) => alterar({ entregas: valor as string[] })}
            />
            <Checkbox
              marcado={rascunho.variasEntregas}
              onAlternar={(marcado) => alterar({ variasEntregas: marcado })}
              accessibilityLabel="Só anúncios com mais de uma forma de recebimento"
            >
              <Text style={styles.opcao}>Só anúncios com mais de uma forma de recebimento</Text>
            </Checkbox>
          </Secao>

          {mostrarTroca ? (
            <Secao titulo="Para troca" resumo={resumos.troca} aberta={aberta === 'troca'} onAlternar={() => alternarSecao('troca')}>
              <Checkbox marcado={rascunho.trocaQualquerCategoria} onAlternar={(marcado) => alterar({ trocaQualquerCategoria: marcado })} accessibilityLabel="Troca por qualquer categoria">
                <Text style={styles.opcao}>Troca por qualquer categoria</Text>
              </Checkbox>
              <Text style={styles.subtitulo}>Aceita troca por (categoria)</Text>
              <SeletorCategoria
                modo="categoria"
                rotuloBusca="Buscar categoria aceita na troca"
                categoria={rascunho.trocaCategoria}
                subcategoria={null}
                onChange={(novaCategoria) => alterar({ trocaCategoria: novaCategoria })}
              />
              <ChipSelect
                layout="lista"
                label="Complemento financeiro"
                opcoes={COMPLEMENTO_TROCA}
                valor={rascunho.complemento ?? ''}
                onChange={(valor) => alterar({ complemento: rascunho.complemento === valor ? null : (valor as 'aceita' | 'nao_aceita') })}
              />
              <TextField label="Tenho" value={rascunho.tenho} onChangeText={(valor) => alterar({ tenho: valor })} placeholder="Ex.: videogame" dica="O que você ofereceria na troca." />
              <TextField label="Procuro" value={rascunho.procuro} onChangeText={(valor) => alterar({ procuro: valor })} placeholder="Ex.: celular" dica="O item que você quer receber." />
              <View style={styles.emBreve}>
                <Text style={styles.emBreveTexto}>Pontos ReUse necessários (em breve)</Text>
              </View>
            </Secao>
          ) : null}

          {mostrarDoacao ? (
            <Secao titulo="Para doação" resumo={resumos.doacao} aberta={aberta === 'doacao'} onAlternar={() => alternarSecao('doacao')}>
              <ChipSelect
                layout="lista"
                label="Destino"
                opcoes={OPCOES_DOACAO}
                valor={rascunho.doacaoDestino ?? ''}
                onChange={(valor) => alterar({ doacaoDestino: rascunho.doacaoDestino === valor ? null : (valor as 'organizacoes' | 'pessoas') })}
              />
              <ChipSelect
                multiplo
                layout="lista"
                label="Condições da doação"
                opcoes={OPCOES_DOACAO_EXTRAS}
                valor={extrasDoacao}
                onChange={(valor) => {
                  const lista = valor as string[];
                  alterar({
                    doacaoImediata: lista.includes('imediata'),
                    precisaRetirar: lista.includes('retirar'),
                    possuiEntrega: lista.includes('entrega'),
                    pontoReuse: lista.includes('ponto'),
                  });
                }}
              />
              <Text style={styles.nota}>Para ver doações perto de você, use "Mais próximos" em Localização.</Text>
            </Secao>
          ) : null}
        </ScrollView>

        <View style={[styles.rodape, { paddingBottom: insets.bottom + 12 }]}>
          <PrimaryButton label="Limpar" variante="secundario" onPress={() => setRascunho(FILTROS_VAZIOS)} style={styles.limpar} />
          <PrimaryButton label="Ver resultados" onPress={() => onAplicar(rascunho)} style={styles.aplicar} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: colors.background },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  titulo: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.primary },
  fechar: { minHeight: 44, justifyContent: 'center' },
  fecharTexto: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.teal },
  conteudo: { paddingHorizontal: 20, paddingBottom: 24, width: '100%', maxWidth: 640, alignSelf: 'center' },
  // Seções separadas por linhas finas, sem caixas: o conteúdo (chips) já tem forma própria.
  secao: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  secaoCabecalho: { flexDirection: 'row', alignItems: 'center', minHeight: 64, paddingVertical: 10 },
  secaoTextos: { flex: 1 },
  secaoTitulo: { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.text },
  secaoResumo: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, marginTop: 2 },
  secaoResumoAtivo: { fontFamily: fonts.bodySemiBold, color: colors.teal },
  seta: { fontFamily: fonts.bodyBold, fontSize: 24, color: colors.textMuted, transform: [{ rotate: '90deg' }] },
  setaAberta: { transform: [{ rotate: '-90deg' }] },
  secaoCorpo: { paddingBottom: 10 },
  precoValores: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  precoFim: { alignItems: 'flex-end' },
  raio: { marginBottom: 16 },
  precoRotulo: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  precoValor: { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.text, fontVariant: ['tabular-nums'] },
  subtitulo: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text, marginTop: 4, marginBottom: 10 },
  opcao: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text, marginTop: 2 },
  nota: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textMuted, marginBottom: 14 },
  emBreve: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 14,
  },
  emBreveTexto: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.placeholder },
  rodape: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  limpar: { flex: 1 },
  aplicar: { flex: 2 },
});
