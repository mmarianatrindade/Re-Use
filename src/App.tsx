import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AvisoOffline from './components/AvisoOffline';
import { colors } from './constants/colors';
import { fontAssets } from './constants/fonts';
import { SessaoProvider } from './contexts/SessaoContext';
import AppNavigator from './navigation/AppNavigator';
import { limparVersoesAntigasDoCache } from './services/cache';
import { installWebFocusStyles } from './utils/webFocusStyles';

installWebFocusStyles();

export default function App() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  // Remove respostas guardadas por versões antigas do cache.
  useEffect(() => {
    void limparVersoesAntigasDoCache();
  }, []);

  // Evita exibir a tela com a fonte do sistema enquanto as fontes carregam.
  if (!fontsLoaded && !fontError) {
    return <View style={styles.loading} />;
  }

  return (
    <SafeAreaProvider>
      <SessaoProvider>
        <View style={styles.raiz}>
          <AvisoOffline />
          <View style={styles.raiz}>
            <AppNavigator />
          </View>
        </View>
      </SessaoProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  loading: {
    flex: 1,
    backgroundColor: colors.ink,
  },
});
