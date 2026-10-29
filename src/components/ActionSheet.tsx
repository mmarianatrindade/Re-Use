import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { radii } from '../constants/radii';

export interface AcaoSheet {
  id: string;
  label: string;
  descricao?: string;
  destrutivo?: boolean;
  onPress: () => void;
}

interface ActionSheetProps {
  visivel: boolean;
  titulo: string;
  acoes: AcaoSheet[];
  onFechar: () => void;
}

const ATRASO_IOS_MS = 400;

// Folha de ações que sobe do rodapé: opções ao alcance do polegar e "Cancelar" sempre visível.
export default function ActionSheet({ visivel, titulo, acoes, onFechar }: ActionSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onFechar} statusBarTranslucent>
      <Pressable style={styles.fundo} onPress={onFechar} accessibilityLabel="Fechar" accessibilityRole="button" />
      <View style={[styles.folha, { paddingBottom: insets.bottom + 12 }]} accessibilityViewIsModal>
        <View style={styles.alca} />
        <Text style={styles.titulo}>{titulo}</Text>

        {acoes.map((acao) => (
          <Pressable
            key={acao.id}
            onPress={() => {
              onFechar();
              // No iOS, abrir câmera/galeria antes do modal terminar de fechar faz o seletor não aparecer.
              setTimeout(acao.onPress, Platform.OS === 'ios' ? ATRASO_IOS_MS : 0);
            }}
            accessibilityRole="button"
            accessibilityLabel={acao.descricao ? `${acao.label}. ${acao.descricao}` : acao.label}
            style={({ pressed }) => [styles.acao, pressed && styles.acaoPressionada]}
          >
            <Text style={[styles.acaoTexto, acao.destrutivo && styles.acaoDestrutiva]}>{acao.label}</Text>
            {acao.descricao ? <Text style={styles.acaoDescricao}>{acao.descricao}</Text> : null}
          </Pressable>
        ))}

        <Pressable onPress={onFechar} accessibilityRole="button" style={({ pressed }) => [styles.cancelar, pressed && styles.acaoPressionada]}>
          <Text style={styles.cancelarTexto}>Cancelar</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(4, 32, 28, 0.45)' },
  folha: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    paddingHorizontal: 16,
    paddingTop: 10,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  alca: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 12 },
  titulo: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textMuted, marginBottom: 6, paddingHorizontal: 8 },
  acao: { minHeight: 56, justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 10, borderRadius: radii.inner },
  acaoPressionada: { backgroundColor: colors.surfaceAlt },
  acaoTexto: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.text },
  acaoDestrutiva: { color: colors.danger },
  acaoDescricao: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  cancelar: {
    minHeight: 52,
    marginTop: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelarTexto: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.primary },
});
