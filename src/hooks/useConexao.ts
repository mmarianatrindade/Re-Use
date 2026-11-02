import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

// true enquanto o aparelho está sem rede (ou com rede mas sem internet). Começa em true para não piscar o aviso na abertura.
export function useConexao() {
  const [conectado, setConectado] = useState(true);

  useEffect(() => {
    const cancelar = NetInfo.addEventListener((estado) => {
      setConectado(estado.isConnected !== false && estado.isInternetReachable !== false);
    });
    return cancelar;
  }, []);

  return conectado;
}
