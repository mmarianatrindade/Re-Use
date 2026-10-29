import type { ReactNode, Ref } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { useResponsive } from '../hooks/useResponsive';

interface ScreenProps {
  children: ReactNode;
  // Barra fixa no rodapé (ação principal ao alcance do polegar).
  rodape?: ReactNode;
  larguraMaxima?: number;
  atualizando?: boolean;
  onAtualizar?: () => void;
  // Telas com cabeçalho de navegação já descontam a área segura do topo.
  semAreaSeguraTopo?: boolean;
  scrollRef?: Ref<ScrollView>;
  contentStyle?: StyleProp<ViewStyle>;
}

// Estrutura padrão das telas internas: rolagem, teclado sem cobrir campos e conteúdo centralizado em telas largas.
export default function Screen({
  children,
  rodape,
  larguraMaxima = 560,
  atualizando,
  onAtualizar,
  semAreaSeguraTopo = true,
  scrollRef,
  contentStyle,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { gutter } = useResponsive();

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: gutter, paddingTop: semAreaSeguraTopo ? 20 : insets.top + 20 },
          !rodape && { paddingBottom: insets.bottom + 32 },
        ]}
        refreshControl={
          onAtualizar ? (
            <RefreshControl refreshing={atualizando ?? false} onRefresh={onAtualizar} tintColor={colors.primary} colors={[colors.primary]} />
          ) : undefined
        }
      >
        <View style={[styles.conteudo, { maxWidth: larguraMaxima }, contentStyle]}>{children}</View>
      </ScrollView>

      {rodape ? (
        <View style={[styles.rodape, { paddingHorizontal: gutter }]}>
          <View style={[styles.conteudo, { maxWidth: larguraMaxima }]}>{rodape}</View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: 32 },
  conteudo: { width: '100%', alignSelf: 'center' },
  rodape: {
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
