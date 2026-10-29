import type { EnderecoSugerido, SugestaoEndereco } from '../../../src/types/api';
import type { Env } from '../env';
import { ErroApi, responderJson } from '../http';

// Proxy do Google Places (autocomplete + detalhe): a chave fica só no Worker, nunca no app.
// Mesmo formato usado no projeto Iara Games (endpoints "legados" da Places API).

interface RespostaAutocomplete {
  status?: string;
  error_message?: string;
  predictions?: { description?: string; place_id?: string }[];
}

interface ComponenteGoogle {
  long_name?: string;
  short_name?: string;
  types?: string[];
}

interface RespostaDetalhe {
  status?: string;
  error_message?: string;
  result?: {
    formatted_address?: string;
    address_components?: ComponenteGoogle[];
    geometry?: { location?: { lat?: number; lng?: number } };
  };
}

function exigirChave(env: Env) {
  if (!env.GOOGLE_PLACES_API_KEY) {
    throw new ErroApi(503, 'PLACES_NAO_CONFIGURADO', 'Busca de endereço indisponível no momento.');
  }
  return env.GOOGLE_PLACES_API_KEY;
}

function verificarStatusGoogle(status: string | undefined, mensagem: string | undefined) {
  if (!status || status === 'OK' || status === 'ZERO_RESULTS') {
    return;
  }
  console.warn('Places API', status, mensagem);
  throw new ErroApi(status === 'INVALID_REQUEST' || status === 'NOT_FOUND' ? 400 : 502, 'PLACES_ERRO', 'Não foi possível buscar endereços agora.');
}

// Sessão de autocomplete (UUID gerado pelo app): o Google cobra digitação + detalhe como uma única sessão.
function lerSessao(url: URL) {
  const sessao = url.searchParams.get('sessao') ?? '';
  return /^[0-9a-f-]{16,64}$/i.test(sessao) ? sessao : null;
}

export async function buscarSugestoesGoogle(chave: string, texto: string, sessao: string | null) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
  url.searchParams.set('input', texto);
  url.searchParams.set('key', chave);
  url.searchParams.set('language', 'pt-BR');
  url.searchParams.set('components', 'country:br');
  if (sessao) url.searchParams.set('sessiontoken', sessao);

  const resposta = await fetch(url, { signal: AbortSignal.timeout(5000) });
  const dados = (await resposta.json()) as RespostaAutocomplete;
  verificarStatusGoogle(dados.status, dados.error_message);
  return (dados.predictions ?? [])
    .filter((predicao) => predicao.place_id && predicao.description)
    .map((predicao): SugestaoEndereco => ({ id: predicao.place_id ?? '', texto: predicao.description ?? '' }));
}

function obterComponente(componentes: ComponenteGoogle[], tipo: string, curto = false) {
  const componente = componentes.find((item) => item.types?.includes(tipo));
  return (curto ? componente?.short_name ?? componente?.long_name : componente?.long_name ?? componente?.short_name) ?? '';
}

export async function buscarDetalheGoogle(chave: string, lugarId: string, sessao: string | null): Promise<EnderecoSugerido> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', lugarId);
  url.searchParams.set('fields', 'address_component,formatted_address,geometry');
  url.searchParams.set('language', 'pt-BR');
  url.searchParams.set('key', chave);
  if (sessao) url.searchParams.set('sessiontoken', sessao);

  const resposta = await fetch(url, { signal: AbortSignal.timeout(5000) });
  const dados = (await resposta.json()) as RespostaDetalhe;
  verificarStatusGoogle(dados.status, dados.error_message);

  const componentes = dados.result?.address_components ?? [];
  const local = dados.result?.geometry?.location;
  // Coordenada arredondada (≈110 m): serve ao filtro por distância sem guardar a posição exata.
  const arredondar = (valor: number | undefined) => (typeof valor === 'number' ? Math.round(valor * 1000) / 1000 : null);

  return {
    cep: obterComponente(componentes, 'postal_code').replace(/\D/g, ''),
    logradouro: obterComponente(componentes, 'route'),
    numero: obterComponente(componentes, 'street_number'),
    bairro:
      obterComponente(componentes, 'sublocality_level_1') ||
      obterComponente(componentes, 'neighborhood') ||
      obterComponente(componentes, 'sublocality'),
    cidade: obterComponente(componentes, 'administrative_area_level_2') || obterComponente(componentes, 'locality'),
    uf: obterComponente(componentes, 'administrative_area_level_1', true).toUpperCase(),
    latitude: arredondar(local?.lat),
    longitude: arredondar(local?.lng),
  };
}

// GET /enderecos/sugestoes?texto=...&sessao=...
export async function listarSugestoesEndereco(request: Request, env: Env) {
  const chave = exigirChave(env);
  const url = new URL(request.url);
  const texto = (url.searchParams.get('texto') ?? '').trim().slice(0, 120);
  if (texto.length < 3) {
    return responderJson({ sugestoes: [] });
  }
  return responderJson({ sugestoes: await buscarSugestoesGoogle(chave, texto, lerSessao(url)) });
}

// GET /enderecos/lugar/:id?sessao=...
export async function obterEnderecoSugerido(request: Request, env: Env, lugarId: string) {
  const chave = exigirChave(env);
  if (!/^[A-Za-z0-9_-]{10,300}$/.test(lugarId)) {
    throw new ErroApi(400, 'LUGAR_INVALIDO', 'Endereço inválido.');
  }
  return responderJson(await buscarDetalheGoogle(chave, lugarId, lerSessao(new URL(request.url))));
}
