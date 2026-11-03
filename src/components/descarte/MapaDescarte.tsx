import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { tipografia } from '../../constants/tipografia';
import { criarHtmlMapa } from './htmlMapa';
import type { MapaDescarteProps } from './tipos';

export default function MapaDescarte({ pontos, foco, onSelecionar }: MapaDescarteProps) {
  const webview = useRef<WebView>(null);
  const html = useMemo(() => criarHtmlMapa(pontos), [pontos]);
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState(false);
  useEffect(() => { setPronto(false); setErro(false); }, [html]);
  useEffect(() => {
    if (pronto && foco) webview.current?.injectJavaScript(`window.focarEcoponto&&window.focarEcoponto(${JSON.stringify(foco.id)});true;`);
  }, [pronto, foco]);
  return <View>
    {erro ? <Text style={tipografia.apoio}>Mapa indisponível. Consulte os endereços na lista.</Text> : null}
    <WebView ref={webview} source={{ html }} style={{ height: 420, flex: 0 }} containerStyle={{ height: 420, flex: 0 }}
      applicationNameForUserAgent="ReUse/1.0 (+https://github.com/mmarianatrindade/Re-Use)"
      // HTML embutido exige '*'; a navegação é restringida no callback abaixo.
      originWhitelist={['*']} scrollEnabled={false} setSupportMultipleWindows={false} cacheEnabled thirdPartyCookiesEnabled={false}
      onError={() => setErro(true)}
      onShouldStartLoadWithRequest={(request) => {
        if (request.url === 'about:blank') return true;
        if (request.url === 'https://www.openstreetmap.org/copyright') void Linking.openURL(request.url).catch(() => setErro(true));
        return false;
      }}
      onMessage={(event) => {
        try {
          const mensagem = JSON.parse(event.nativeEvent.data);
          if (mensagem.pronto === true) setPronto(true);
          else if (typeof mensagem.id === 'string' && pontos.some((p) => p.id === mensagem.id)) onSelecionar(mensagem.id);
        } catch { /* Mensagens fora do contrato são ignoradas. */ }
      }}
      accessibilityLabel="Mapa dos ecopontos. Os mesmos endereços estão disponíveis na lista acima."
    />
  </View>;
}
