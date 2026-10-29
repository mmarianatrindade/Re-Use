import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { radii } from '../constants/radii';
import type { UsuarioPublico } from '../types/api';
import { cardDeResumo, formatarData, formatarLocalizacao, formatarMesAno, obterLabelTipoConta } from '../utils/formatarAnuncio';
import Avatar from './Avatar';
import CardAnuncio from './CardAnuncio';

interface PerfilPublicoCardProps {
  perfil: UsuarioPublico;
  onAnuncioPress?: (anuncioId: string) => void;
}

function descreverImpacto({ impacto }: UsuarioPublico) {
  if (impacto.itensReutilizados === 0) {
    return 'Ainda sem operações concluídas. Cada item vendido, trocado ou doado aparece aqui.';
  }
  const partes = [
    impacto.vendas ? `${impacto.vendas} ${impacto.vendas === 1 ? 'venda' : 'vendas'}` : null,
    impacto.trocas ? `${impacto.trocas} ${impacto.trocas === 1 ? 'troca' : 'trocas'}` : null,
    impacto.doacoes ? `${impacto.doacoes} ${impacto.doacoes === 1 ? 'doação' : 'doações'}` : null,
  ].filter(Boolean);
  const total = impacto.itensReutilizados;
  return `${total} ${total === 1 ? 'item ganhou' : 'itens ganharam'} nova utilidade: ${partes.join(', ')}.`;
}

function desenharEstrelas(media: number) {
  const cheias = Math.round(media);
  return '★'.repeat(cheias) + '☆'.repeat(5 - cheias);
}

// Identidade pública: nada de CPF, telefone, rua ou número aqui.
export default function PerfilPublicoCard({ perfil, onAnuncioPress }: PerfilPublicoCardProps) {
  const { reputacao } = perfil;

  return (
    <View>
      <View style={styles.cabecalho}>
        <Avatar nome={perfil.nomePublico} uri={perfil.fotoUrl} tamanho={84} />
        <View style={styles.cabecalhoTextos}>
          <Text style={styles.nome}>{perfil.nomePublico}</Text>
          {perfil.tipoConta !== 'pessoa' ? (
            <Text style={styles.tipoConta}>{obterLabelTipoConta(perfil.tipoConta)} (declarado)</Text>
          ) : null}
          {perfil.localizacao ? <Text style={styles.local}>{formatarLocalizacao(perfil.localizacao)}</Text> : null}
          <Text style={styles.membro}>No ReUse desde {formatarMesAno(perfil.membroDesde)}</Text>
        </View>
      </View>

      {perfil.descricao ? <Text style={styles.descricao}>{perfil.descricao}</Text> : null}

      <View style={styles.bloco}>
        <Text style={styles.blocoTitulo}>Reputação</Text>
        {reputacao.media !== null ? (
          <View style={styles.reputacaoLinha} accessibilityLabel={`Nota média ${reputacao.media} de 5, ${reputacao.total} avaliações`}>
            <Text style={styles.estrelas}>{desenharEstrelas(reputacao.media)}</Text>
            <Text style={styles.nota}>{reputacao.media.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</Text>
            <Text style={styles.total}>
              {reputacao.total} {reputacao.total === 1 ? 'avaliação' : 'avaliações'}
            </Text>
          </View>
        ) : (
          <Text style={styles.textoSuave}>Sem avaliações ainda. Elas aparecem depois das primeiras operações.</Text>
        )}
        {reputacao.ultimas.map((avaliacao) => (
          <View key={avaliacao.id} style={styles.avaliacao}>
            <Text style={styles.avaliacaoCabecalho}>
              {desenharEstrelas(avaliacao.nota)}  {avaliacao.autorNome}, {formatarData(avaliacao.criadoEm)}
            </Text>
            {avaliacao.comentario ? <Text style={styles.avaliacaoTexto}>{avaliacao.comentario}</Text> : null}
          </View>
        ))}
      </View>

      <View style={styles.bloco}>
        <Text style={styles.blocoTitulo}>Selos de confiança</Text>
        {perfil.selos.length > 0 ? (
          <View style={styles.selos}>
            {perfil.selos.map((selo) => (
              <View key={selo.id} style={styles.selo} accessibilityLabel={`${selo.label}: ${selo.descricao}`}>
                <Text style={styles.seloTexto}>✓ {selo.label}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.textoSuave}>Nenhum selo ainda.</Text>
        )}
      </View>

      <View style={styles.bloco}>
        <Text style={styles.blocoTitulo}>Impacto</Text>
        <Text style={styles.impacto}>{descreverImpacto(perfil)}</Text>
      </View>

      {perfil.anunciosAtivos.length > 0 ? (
        <View style={styles.bloco}>
          <Text style={styles.blocoTitulo}>Anúncios ativos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.anuncios}>
            {perfil.anunciosAtivos.map((anuncio) => (
              <CardAnuncio
                key={anuncio.id}
                anuncio={cardDeResumo(anuncio)}
                largura={150}
                onPress={() => onAnuncioPress?.(anuncio.id)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: { flexDirection: 'row', alignItems: 'center' },
  cabecalhoTextos: { flex: 1, marginLeft: 16 },
  nome: { fontFamily: fonts.displayBold, fontSize: 26, lineHeight: 30, letterSpacing: -0.5, color: colors.primary },
  tipoConta: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.teal, marginTop: 2 },
  local: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20, color: colors.text, marginTop: 4 },
  membro: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginTop: 4 },
  descricao: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.text, marginTop: 16 },
  bloco: { marginTop: 22 },
  blocoTitulo: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text, marginBottom: 8 },
  reputacaoLinha: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  estrelas: { fontSize: 18, color: '#E0A100', letterSpacing: 1 },
  nota: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.text, fontVariant: ['tabular-nums'] },
  total: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  textoSuave: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  avaliacao: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  avaliacaoCabecalho: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textMuted },
  avaliacaoTexto: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.text, marginTop: 4 },
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selo: { backgroundColor: colors.limeSoft, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 6 },
  seloTexto: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primaryDark },
  impacto: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 23, color: colors.text },
  anuncios: { gap: 12, paddingRight: 8 },
});
