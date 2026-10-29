import { Alert, Platform } from 'react-native';

interface OpcoesConfirmacao {
  titulo: string;
  mensagem: string;
  confirmar: string;
  destrutivo?: boolean;
}

// Diálogo de confirmação: Alert com botões no celular e window.confirm na web (Alert não funciona no react-native-web).
export function confirmarAcao({ titulo, mensagem, confirmar, destrutivo = false }: OpcoesConfirmacao) {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${titulo}\n\n${mensagem}`));
  }

  return new Promise<boolean>((resolve) => {
    Alert.alert(
      titulo,
      mensagem,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmar, style: destrutivo ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
