import { useMemo, useState } from 'react';
import { FlatList, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { radii } from '../constants/radii';
import Glifo from './Glifo';
import TextField from './TextField';

export interface OpcaoLista {
  id: string;
  label: string;
}

interface SeletorListaProps {
  label: string;
  opcoes: readonly OpcaoLista[];
  valor: string;
  onChange: (id: string) => void;
  placeholder: string;
  obrigatorio?: boolean;
  erro?: string;
  desabilitado?: boolean;
}

const DIACRITICOS = /[̀-ͯ]/g;
const normalizar = (texto: string) => texto.normalize('NFD').replace(DIACRITICOS, '').toLowerCase();

// Campo que abre uma lista com busca: melhor que dezenas de chips quando há muitas opções (categorias).
export default function SeletorLista({ label, opcoes, valor, onChange, placeholder, obrigatorio = false, erro, desabilitado = false }: SeletorListaProps) {
  const insets = useSafeAreaInsets();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const selecionada = opcoes.find((opcao) => opcao.id === valor);

  const filtradas = useMemo(() => {
    const termo = normalizar(busca.trim());
    return termo ? opcoes.filter((opcao) => normalizar(opcao.label).includes(termo)) : opcoes;
  }, [opcoes, busca]);

  const handleEscolher = (id: string) => {
    onChange(id);
    setAberto(false);
    setBusca('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {obrigatorio ? <Text style={styles.obrigatorio}> *</Text> : null}
      </Text>
      <Pressable
        onPress={() => setAberto(true)}
        disabled={desabilitado}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selecionada?.label ?? placeholder}`}
        style={({ pressed }) => [styles.campo, erro ? styles.campoErro : null, desabilitado && styles.desabilitado, pressed && styles.pressionado]}
      >
        <Text style={[styles.valor, !selecionada && styles.placeholder]} numberOfLines={1}>
          {selecionada?.label ?? placeholder}
        </Text>
        <Text style={styles.seta}>›</Text>
      </Pressable>
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <Modal visible={aberto} animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined} onRequestClose={() => setAberto(false)}>
        <View style={[styles.folha, { paddingTop: Platform.OS === 'ios' ? 16 : insets.top + 12 }]}>
          <View style={styles.topo}>
            <Text style={styles.titulo}>{label}</Text>
            <Pressable onPress={() => setAberto(false)} accessibilityRole="button" hitSlop={10} style={styles.fechar}>
              <Text style={styles.fecharTexto}>Fechar</Text>
            </Pressable>
          </View>
          {opcoes.length > 8 ? (
            <View style={styles.busca}>
              <TextField label="Buscar" value={busca} onChangeText={setBusca} placeholder={`Buscar em ${label.toLowerCase()}`} autoCorrect={false} />
            </View>
          ) : null}
          <FlatList
            data={filtradas}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            renderItem={({ item }) => {
              const ativa = item.id === valor;
              return (
                <Pressable
                  onPress={() => handleEscolher(item.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: ativa }}
                  style={({ pressed }) => [styles.item, pressed && styles.itemPressionado]}
                >
                  <Text style={[styles.itemTexto, ativa && styles.itemTextoAtivo]}>{item.label}</Text>
                  {ativa ? <Glifo simbolo="✓" tamanho={20} cor={colors.primary} /> : null}
                </Pressable>
              );
            }}
            ListEmptyComponent={<Text style={styles.vazio}>Nada encontrado com “{busca}”.</Text>}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 18 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text, marginBottom: 8 },
  obrigatorio: { color: colors.danger },
  campo: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.inner,
    paddingHorizontal: 14,
  },
  campoErro: { borderColor: colors.danger },
  desabilitado: { opacity: 0.5 },
  pressionado: { opacity: 0.85 },
  valor: { flex: 1, fontFamily: fonts.body, fontSize: 16, color: colors.text },
  placeholder: { color: colors.placeholder },
  seta: { fontFamily: fonts.bodyBold, fontSize: 22, color: colors.textMuted, transform: [{ rotate: '90deg' }] },
  erro: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18, color: colors.danger, marginTop: 6 },
  folha: { flex: 1, backgroundColor: colors.background },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 },
  titulo: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.primary },
  fechar: { minHeight: 44, justifyContent: 'center' },
  fecharTexto: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.teal },
  busca: { paddingHorizontal: 20 },
  item: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  itemPressionado: { backgroundColor: colors.surfaceAlt },
  itemTexto: { fontFamily: fonts.body, fontSize: 17, color: colors.text },
  itemTextoAtivo: { fontFamily: fonts.bodyBold, color: colors.primary },
  vazio: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted, padding: 20 },
});
