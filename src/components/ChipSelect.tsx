import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { radii } from '../constants/radii';
import Glifo from './Glifo';

export interface OpcaoChip {
  id: string;
  label: string;
  descricao?: string;
  cor?: string;
}

interface ChipSelectProps {
  label?: string;
  opcoes: readonly OpcaoChip[];
  // Seleção única: string; múltipla: lista de ids.
  valor: string | string[];
  onChange: (valor: string | string[]) => void;
  multiplo?: boolean;
  erro?: string;
  obrigatorio?: boolean;
  // "lista" mostra a descrição de cada opção em linhas; "chips" quebra em pílulas.
  layout?: 'chips' | 'lista';
  // Lista longa: a descrição aparece só na opção escolhida (menos texto para ler de uma vez).
  descricaoSoSelecionada?: boolean;
}

// Escolha entre opções visíveis (sem menus escondidos): mais rápida no toque que um select.
export default function ChipSelect({
  label,
  opcoes,
  valor,
  onChange,
  multiplo = false,
  erro,
  obrigatorio = false,
  layout = 'chips',
  descricaoSoSelecionada = false,
}: ChipSelectProps) {
  const selecionados = Array.isArray(valor) ? valor : valor ? [valor] : [];

  const handleSelecionar = (id: string) => {
    if (!multiplo) {
      onChange(id);
      return;
    }
    onChange(selecionados.includes(id) ? selecionados.filter((item) => item !== id) : [...selecionados, id]);
  };

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {obrigatorio ? <Text style={styles.obrigatorio}> *</Text> : null}
          {multiplo ? <Text style={styles.labelDica}>  escolha uma ou mais</Text> : null}
        </Text>
      ) : null}

      <View style={layout === 'chips' ? styles.chips : styles.lista} accessibilityRole={multiplo ? undefined : 'radiogroup'}>
        {opcoes.map((opcao) => {
          const ativo = selecionados.includes(opcao.id);
          const cor = opcao.cor ?? colors.primary;

          return (
            <Pressable
              key={opcao.id}
              onPress={() => handleSelecionar(opcao.id)}
              accessibilityRole={multiplo ? 'checkbox' : 'radio'}
              accessibilityState={multiplo ? { checked: ativo } : { selected: ativo }}
              accessibilityLabel={opcao.descricao ? `${opcao.label}. ${opcao.descricao}` : opcao.label}
              style={({ pressed }) => [
                layout === 'chips' ? styles.chip : styles.linha,
                ativo && { borderColor: cor, backgroundColor: layout === 'chips' ? cor : colors.surfaceAlt },
                pressed && styles.pressionado,
              ]}
            >
              {layout === 'lista' ? (
                <View style={[styles.marcador, multiplo && styles.marcadorQuadrado, ativo && { borderColor: cor, backgroundColor: cor }]}>
                  {ativo ? <Glifo simbolo="✓" tamanho={16} /> : null}
                </View>
              ) : null}
              <View style={layout === 'lista' ? styles.linhaTextos : undefined}>
                <Text style={[styles.chipTexto, ativo && layout === 'chips' && styles.chipTextoAtivo]}>{opcao.label}</Text>
                {layout === 'lista' && opcao.descricao && (!descricaoSoSelecionada || ativo) ? (
                  <Text style={styles.descricao}>{opcao.descricao}</Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {erro ? (
        <Text style={styles.erro} accessibilityLiveRegion="polite">
          {erro}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text, marginBottom: 10 },
  labelDica: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  obrigatorio: { color: colors.danger },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  lista: { gap: 8 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  linha: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.inner,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  linhaTextos: { flex: 1 },
  pressionado: { opacity: 0.8 },
  chipTexto: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text },
  chipTextoAtivo: { color: colors.textOnDark },
  descricao: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.textMuted, marginTop: 2 },
  marcador: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  marcadorQuadrado: { borderRadius: 7 },
  marcadorCheck: { color: colors.textOnDark, fontSize: 14, lineHeight: 16, fontFamily: fonts.bodyBold },
  erro: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.danger, marginTop: 8 },
});
