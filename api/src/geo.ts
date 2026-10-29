import { buscarDetalheGoogle, buscarSugestoesGoogle } from './rotas/enderecos';

// Coordenadas aproximadas a partir do CEP (centro do CEP, nunca o endereço) e distância entre pontos.

export interface Coordenadas {
  latitude: number;
  longitude: number;
}

// 3 casas decimais ≈ 110 m: suficiente para filtrar por raio sem guardar precisão desnecessária.
function arredondar(valor: number) {
  return Math.round(valor * 1000) / 1000;
}

function montarCoordenadas(lat: unknown, lng: unknown): Coordenadas | null {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0)) {
    return null;
  }
  return { latitude: arredondar(latitude), longitude: arredondar(longitude) };
}

async function buscarJson(url: string) {
  const resposta = await fetch(url, {
    headers: { 'User-Agent': 'ReUse/1.0 (app de teste; reuse-fiapweb2.pages.dev)', Accept: 'application/json' },
    signal: AbortSignal.timeout(4000),
  });
  if (!resposta.ok) {
    throw new Error(`HTTP ${resposta.status}`);
  }
  return resposta.json();
}

// Serviços gratuitos e sem chave, do mais preciso ao menos preciso (a BrasilAPI às vezes devolve só o centro da cidade).
const FONTES: { nome: string; consultar: (cep: string) => Promise<Coordenadas | null> }[] = [
  {
    nome: 'awesomeapi',
    consultar: async (cep) => {
      const dados = (await buscarJson(`https://cep.awesomeapi.com.br/json/${cep}`)) as { lat?: string; lng?: string };
      return montarCoordenadas(dados.lat, dados.lng);
    },
  },
  {
    nome: 'nominatim',
    consultar: async (cep) => {
      const cepFormatado = `${cep.slice(0, 5)}-${cep.slice(5)}`;
      const dados = (await buscarJson(
        `https://nominatim.openstreetmap.org/search?postalcode=${cepFormatado}&country=Brazil&format=json&limit=1`,
      )) as { lat?: string; lon?: string }[];
      return montarCoordenadas(dados[0]?.lat, dados[0]?.lon);
    },
  },
  {
    nome: 'brasilapi',
    consultar: async (cep) => {
      const dados = (await buscarJson(`https://brasilapi.com.br/api/cep/v2/${cep}`)) as {
        location?: { coordinates?: { latitude?: string; longitude?: string } };
      };
      return montarCoordenadas(dados.location?.coordinates?.latitude, dados.location?.coordinates?.longitude);
    },
  },
];

// Google Places (quando a chave existe): mais preciso e sem o limite por IP das fontes gratuitas.
async function consultarGoogle(cep: string, chave: string) {
  const [sugestao] = await buscarSugestoesGoogle(chave, `${cep.slice(0, 5)}-${cep.slice(5)}, Brasil`, null);
  if (!sugestao) {
    return null;
  }
  const detalhe = await buscarDetalheGoogle(chave, sugestao.id, null);
  return montarCoordenadas(detalhe.latitude, detalhe.longitude);
}

// Centro aproximado do CEP. Sem coordenada em nenhuma fonte → null: o anúncio só fica fora do filtro por distância.
export async function geocodificarCep(cep: string, chaveGoogle?: string): Promise<Coordenadas | null> {
  const digitos = cep.replace(/\D/g, '');
  if (digitos.length !== 8) {
    return null;
  }
  const fontes = chaveGoogle ? [{ nome: 'google', consultar: (valor: string) => consultarGoogle(valor, chaveGoogle) }, ...FONTES] : FONTES;
  for (const fonte of fontes) {
    try {
      const coordenadas = await fonte.consultar(digitos);
      if (coordenadas) {
        return coordenadas;
      }
    } catch (erro) {
      console.warn(`Geocodificação de CEP falhou em ${fonte.nome}`, erro);
    }
  }
  return null;
}

// Usa a coordenada enviada pelo app (consultada no aparelho) ou, se faltar, tenta as fontes da API.
export async function resolverCoordenadas(
  cep: string,
  enviadas: { latitude?: number | null; longitude?: number | null },
  chaveGoogle?: string,
) {
  if (typeof enviadas.latitude === 'number' && typeof enviadas.longitude === 'number') {
    return montarCoordenadas(enviadas.latitude, enviadas.longitude);
  }
  return geocodificarCep(cep, chaveGoogle);
}

const RAIO_TERRA_KM = 6371;

// Fórmula de haversine: distância em km entre dois pontos.
export function calcularDistanciaKm(a: Coordenadas, b: Coordenadas) {
  const radianos = (graus: number) => (graus * Math.PI) / 180;
  const dLat = radianos(b.latitude - a.latitude);
  const dLon = radianos(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radianos(a.latitude)) * Math.cos(radianos(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAIO_TERRA_KM * Math.asin(Math.sqrt(h));
}

// Retângulo que contém o círculo do raio: filtro barato no SQL antes do cálculo exato.
export function calcularCaixa(centro: Coordenadas, raioKm: number) {
  const deltaLat = raioKm / 111;
  const deltaLon = raioKm / (111 * Math.max(Math.cos((centro.latitude * Math.PI) / 180), 0.01));
  return {
    latMin: centro.latitude - deltaLat,
    latMax: centro.latitude + deltaLat,
    lonMin: centro.longitude - deltaLon,
    lonMax: centro.longitude + deltaLon,
  };
}
