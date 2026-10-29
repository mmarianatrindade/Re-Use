import { useFonts } from 'expo-font';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './constants/colors';
import { fontAssets } from './constants/fonts';
import { SessaoProvider } from './contexts/SessaoContext';
import AppNavigator from './navigation/AppNavigator';
import { installWebFocusStyles } from './utils/webFocusStyles';

installWebFocusStyles();

export default function App() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  // Evita exibir a tela com a fonte do sistema enquanto as fontes carregam.
  if (!fontsLoaded && !fontError) {
    return <View style={styles.loading} />;
  }

  return (
    <SafeAreaProvider>
      <SessaoProvider>
        <AppNavigator />
      </SessaoProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.ink,
  },
});
