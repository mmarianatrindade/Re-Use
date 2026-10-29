import * as Location from 'expo-location';
import { Platform } from 'react-native';

// Localização do aparelho (expo-location) para o filtro por distância. Precisão baixa de propósito:
// basta saber a região, e a posição nunca é enviada para outras pessoas.

export interface LocalizacaoAtual {
  latitude: number;
  longitude: number;
  cidade: string | null;
  uf: string | null;
}

export class LocalizacaoIndisponivelError extends Error {}

const SIGLAS_UF: Record<string, string> = {
  acre: 'AC', alagoas: 'AL', amapa: 'AP', amazonas: 'AM', bahia: 'BA', ceara: 'CE', 'distrito federal': 'DF',
  'espirito santo': 'ES', goias: 'GO', maranhao: 'MA', 'mato grosso': 'MT', 'mato grosso do sul': 'MS',
  'minas gerais': 'MG', para: 'PA', paraiba: 'PB', parana: 'PR', pernambuco: 'PE', piaui: 'PI', 'rio de janeiro': 'RJ',
  'rio grande do norte': 'RN', 'rio grande do sul': 'RS', rondonia: 'RO', roraima: 'RR', 'santa catarina': 'SC',
  'sao paulo': 'SP', sergipe: 'SE', tocantins: 'TO',
};

// O geocodificador devolve o estado por extenso ("São Paulo"); o filtro usa a sigla.
function converterParaSiglaUf(regiao: string | null | undefined) {
  if (!regiao) {
    return null;
  }
  if (/^[A-Z]{2}$/.test(regiao)) {
    return regiao;
  }
  const chave = regiao.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  return SIGLAS_UF[chave] ?? null;
}

export async function obterLocalizacaoAtual(): Promise<LocalizacaoAtual> {
  const permissao = await Location.requestForegroundPermissionsAsync();
  if (!permissao.granted) {
    throw new LocalizacaoIndisponivelError('Permita o acesso à localização para ver anúncios perto de você.');
  }

  let posicao: Location.LocationObject;
  try {
    posicao =
      (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000 })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
  } catch {
    throw new LocalizacaoIndisponivelError('Não foi possível obter sua localização. Verifique se o GPS está ligado.');
  }

  const { latitude, longitude } = posicao.coords;
  let cidade: string | null = null;
  let uf: string | null = null;

  // Cidade/estado pelo GPS só no celular; na web o app usa o endereço do perfil.
  if (Platform.OS !== 'web') {
    try {
      const [endereco] = await Location.reverseGeocodeAsync({ latitude, longitude });
      cidade = endereco?.city ?? endereco?.subregion ?? null;
      uf = converterParaSiglaUf(endereco?.region);
    } catch {
      // Sem cidade/estado: o filtro por distância continua funcionando.
    }
  }

  return { latitude, longitude, cidade, uf };
}
