import { ecopontoSchema, FONTE_ECOPONTOS, type Ecoponto, type MaterialDescarte, type RespostaEcopontos } from '../../../src/schemas/ecoponto';
import { ErroApi, responderJson } from '../http';

export const URL_GEOSAMPA = 'https://wfs.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=geoportal%3Aecoponto&outputFormat=application%2Fjson&srsName=EPSG%3A4326&count=500';
const TTL = 60 * 60_000;
let copia: { dados: RespostaEcopontos; expiraEm: number } | null = null;
let consulta: Promise<RespostaEcopontos> | null = null;
const objeto = (valor: unknown): Record<string, unknown> => valor && typeof valor === 'object' ? valor as Record<string, unknown> : {};
const texto = (valor: unknown) => typeof valor === 'string' ? valor.trim() : '';
const simplificar = (valor: string) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function normalizarEcopontos(valor: unknown): Ecoponto[] {
  const origem = objeto(valor);
  if (origem.type !== 'FeatureCollection' || !Array.isArray(origem.features) || origem.features.length > 500) throw new Error('Coleção inválida.');
  if (typeof origem.numberMatched === 'number' && origem.numberMatched > origem.features.length) throw new Error('Coleção incompleta.');
  const ids = new Set<string>();
  const pontos: Ecoponto[] = [];
  for (const item of origem.features) {
    const feature = objeto(item);
    const geometria = objeto(feature.geometry);
    const p = objeto(feature.properties);
    if (geometria.type !== 'Point' || !Array.isArray(geometria.coordinates)) continue;
    const comum = texto(p.tx_recebimento_comum);
    const diferenciado = texto(p.tx_recebimento_diferenciado);
    const recebimento = simplificar(comum).split(/[,;]|\s+e\s+/).map((parte) => parte.trim());
    const materiais: MaterialDescarte[] = [];
    if (recebimento.includes('volumosos')) materiais.push('moveis');
    if (recebimento.includes('entulho')) materiais.push('entulho');
    if (recebimento.includes('restos de poda')) materiais.push('poda');
    if (recebimento.includes('reciclaveis secos')) materiais.push('reciclaveis');
    // O aceite de gesso vem do campo específico da unidade, nunca de uma regra geral.
    if (simplificar(diferenciado) === 'gesso') materiais.push('gesso');
    const validado = ecopontoSchema.safeParse({
      id: texto(feature.id), nome: texto(p.nm_ecoponto), endereco: texto(p.nm_endereco),
      distrito: texto(p.nm_distrito), subprefeitura: texto(p.nm_subprefeitura), horario: texto(p.tx_atendimento),
      recebimento: [comum, diferenciado].filter(Boolean).join('; '), materiais,
      longitude: geometria.coordinates[0], latitude: geometria.coordinates[1],
    });
    if (validado.success && !ids.has(validado.data.id)) {
      ids.add(validado.data.id);
      pontos.push(validado.data);
    }
  }
  if (!pontos.length) throw new Error('Nenhum ecoponto válido.');
  return pontos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

async function consultarFonte(): Promise<RespostaEcopontos> {
  const controller = new AbortController();
  const limite = setTimeout(() => controller.abort(), 10_000);
  try {
    const resposta = await fetch(URL_GEOSAMPA, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!resposta.ok) throw new Error('GeoSampa indisponível.');
    const dados: RespostaEcopontos = { pontos: normalizarEcopontos(await resposta.json()), consultadoEm: new Date().toISOString(), fonte: FONTE_ECOPONTOS };
    copia = { dados, expiraEm: Date.now() + TTL };
    return dados;
  } finally {
    clearTimeout(limite);
  }
}

export async function listarEcopontos(): Promise<Response> {
  try {
    // Uma consulta compartilhada por instância evita repetir a mesma chamada municipal em paralelo.
    if (copia && copia.expiraEm > Date.now()) return responderJson(copia.dados);
    if (!consulta) consulta = consultarFonte().finally(() => { consulta = null; });
    return responderJson(await consulta);
  } catch {
    throw new ErroApi(503, 'ECOPONTOS_INDISPONIVEIS', 'Não foi possível consultar os ecopontos. Tente novamente em alguns instantes.');
  }
}
