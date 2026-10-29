import { useState, type ReactNode } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { tipografia } from '../constants/tipografia';
import type { Modalidade, StatusAnuncio } from '../schemas/anuncio';
import { COMPLEMENTO_TROCA, DESTINOS_DOACAO } from '../schemas/catalogo';
import type { LocalizacaoPublica } from '../types/api';
import {
  formatarLocalizacao,
  formatarMoeda,
  formatarPrecoAnuncio,
  modalidadeInfo,
  obterLabelCategoria,
  obterLabelCondicao,
  obterLabelEntrega,
  obterLabelSubcategoria,
} from '../utils/formatarAnuncio';
import TagsAnuncio from './TagsAnuncio';

export interface DadosPreview {
  fotos: string[];
  titulo: string;
  descricao: string;
  categoria: string;
  condicao: string;
  modalidade: Modalidade;
  precoCentavos: number | null;
  aceitaOfertas: boolean;
  preferenciaTroca: string | null;
  entregas: string[];
  localizacao: LocalizacaoPublica | null;
  // Com "negociando", a tag cinza aparece ao lado da tag da modalidade.
  status?: StatusAnuncio;
  subcategoria?: string;
  valorEstimadoCentavos?: number | null;
  trocaQualquerCategoria?: boolean;
  trocaCategorias?: string[];
  trocaComplemento?: string | null;
  doacaoDestino?: string | null;
  doacaoImediata?: boolean;
}

interface AnuncioPreviewProps {
  dados: DadosPreview;
  // Margem lateral da tela: a galeria a anula para ocupar toda a largura.
  gutter: number;
  // Bloco de quem anuncia, logo abaixo do preço (detalhe público).
  anunciante?: ReactNode;
  // Linha de ações (salvar, compartilhar), ao lado do preço.
  acoes?: ReactNode;
  // Galeria encostada no topo da tela (detalhe e "Meu anúncio"); na revisão do Anunciar fica abaixo das etapas.
  colarNoTopo?: boolean;
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={styles.secao}>
      <Text style={tipografia.tituloBloco}>{titulo}</Text>
      <View style={styles.secaoCorpo}>{children}</View>
    </View>
  );
}

// Anúncio como quem procura vê: foto de ponta a ponta, preço na cor da modalidade, quem anuncia e,
// abaixo, as informações separadas por linhas finas (sem caixas).
export default function AnuncioPreview({ dados, gutter, anunciante, acoes, colarNoTopo = false }: AnuncioPreviewProps) {
  const [largura, setLargura] = useState(0);
  const [fotoAtual, setFotoAtual] = useState(0);
  const modalidade = modalidadeInfo[dados.modalidade];
  const subcategoria = dados.subcategoria ? obterLabelSubcategoria(dados.categoria, dados.subcategoria) : '';

  const handleLayout = (evento: LayoutChangeEvent) => setLargura(evento.nativeEvent.layout.width);

  return (
    <View>
      {/* Galeria: anula a margem da tela para a foto ocupar toda a largura */}
      <View style={{ marginHorizontal: -gutter, marginTop: colarNoTopo ? -20 : 0 }} onLayout={handleLayout}>
        {largura > 0 && dados.fotos.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(evento) => setFotoAtual(Math.round(evento.nativeEvent.contentOffset.x / largura))}
              accessibilityLabel={`Galeria com ${dados.fotos.length} fotos`}
            >
              {dados.fotos.map((uri, indice) => (
                <Image
                  key={`${uri}-${indice}`}
                  source={{ uri }}
                  style={{ width: largura, height: Math.min(largura, 620) }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {dados.fotos.length > 1 ? (
              <View style={styles.pontos} accessibilityElementsHidden>
                {dados.fotos.map((uri, indice) => (
                  <View key={`${uri}-p${indice}`} style={[styles.ponto, indice === fotoAtual && styles.pontoAtivo]} />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.topo}>
        <View style={styles.precoLinha}>
          <View style={styles.precoTextos}>
            <Text style={[tipografia.preco, { color: modalidade.cor }]}>{formatarPrecoAnuncio(dados.modalidade, dados.precoCentavos)}</Text>
            {dados.modalidade === 'venda' && dados.aceitaOfertas ? <Text style={styles.ofertas}>Aceita ofertas</Text> : null}
          </View>
          {acoes}
        </View>
        <Text style={styles.titulo}>{dados.titulo}</Text>

        {/* Selos: modalidade com a cor do tipo, depois estado e categoria em neutro */}
        <View style={styles.selos}>
          <View style={[styles.selo, { backgroundColor: modalidade.corSuave }]}>
            <TagsAnuncio modalidade={dados.modalidade} status={dados.status} size={16} style={styles.seloTag} />
            <Text style={[styles.seloTexto, { color: modalidade.cor }]}>{modalidade.label}</Text>
          </View>
          <View style={styles.selo}>
            <Text style={styles.seloTexto}>{obterLabelCondicao(dados.condicao)}</Text>
          </View>
          <View style={styles.selo}>
            <Text style={styles.seloTexto}>{subcategoria || obterLabelCategoria(dados.categoria)}</Text>
          </View>
        </View>
      </View>

      {anunciante ? <View style={styles.anunciante}>{anunciante}</View> : null}

      {dados.modalidade === 'troca' ? (
        <Secao titulo="Aceita em troca">
          {dados.preferenciaTroca ? <Text style={tipografia.leitura}>{dados.preferenciaTroca}</Text> : null}
          <Text style={[tipografia.corpoSuave, styles.espaco]}>
            {dados.trocaQualquerCategoria
              ? 'Itens de qualquer categoria.'
              : dados.trocaCategorias && dados.trocaCategorias.length > 0
                ? `Procura: ${dados.trocaCategorias.map(obterLabelCategoria).join(', ')}.`
                : ''}
            {dados.trocaComplemento ? ` ${COMPLEMENTO_TROCA.find((item) => item.id === dados.trocaComplemento)?.label ?? ''}.` : ''}
          </Text>
          {dados.valorEstimadoCentavos ? (
            <Text style={[tipografia.corpoSuave, styles.espaco]}>Valor estimado, só como referência: {formatarMoeda(dados.valorEstimadoCentavos)}</Text>
          ) : null}
        </Secao>
      ) : null}

      {dados.modalidade === 'doacao' && dados.doacaoDestino ? (
        <Secao titulo="Doação">
          <Text style={tipografia.leitura}>
            {DESTINOS_DOACAO.find((item) => item.id === dados.doacaoDestino)?.label}
            {dados.doacaoImediata ? '. Disponível imediatamente.' : '.'}
          </Text>
        </Secao>
      ) : null}

      <Secao titulo="Descrição">
        <Text style={[tipografia.leitura, styles.leitura]}>{dados.descricao}</Text>
      </Secao>

      <Secao titulo="Entrega">
        <Text style={tipografia.leitura}>{dados.entregas.map(obterLabelEntrega).join(', ')}</Text>
        {dados.localizacao ? <Text style={[tipografia.corpoSuave, styles.espaco]}>{formatarLocalizacao(dados.localizacao)}</Text> : null}
      </Secao>
    </View>
  );
}

const styles = StyleSheet.create({
  pontos: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  ponto: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.55)' },
  pontoAtivo: { backgroundColor: colors.textOnDark, width: 18 },
  topo: { paddingTop: 20 },
  precoLinha: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  precoTextos: { flex: 1 },
  ofertas: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textMuted, marginTop: 2 },
  titulo: { fontFamily: fonts.bodySemiBold, fontSize: 20, lineHeight: 27, color: colors.text, marginTop: 8 },
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  seloTag: { marginRight: 6, marginVertical: -4 },
  seloTexto: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text },
  anunciante: { marginTop: 20 },
  secao: { paddingVertical: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  secaoCorpo: { marginTop: 8 },
  leitura: { maxWidth: 620 },
  espaco: { marginTop: 6 },
});
