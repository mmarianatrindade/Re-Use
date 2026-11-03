const test = require('node:test');
const assert = require('node:assert/strict');
const { loadProject, deferred, storageMock } = require('./helpers.cjs');

function ponto(id = 'ecoponto.1', gesso = '') {
  return { type: 'Feature', id, geometry: { type: 'Point', coordinates: [-46.60646234, -23.5434034] }, properties: {
    nm_ecoponto: 'Bresser', nm_endereco: 'Praça Giuseppe Cesari, 54', nm_distrito: 'Brás', nm_subprefeitura: 'Mooca',
    tx_atendimento: 'segunda a sábado, das 6h às 22h', tx_recebimento_comum: 'Entulho, volumosos, restos de poda e recicláveis secos', tx_recebimento_diferenciado: gesso,
  } };
}
const colecao = (...features) => ({ type: 'FeatureCollection', numberMatched: features.length, features });

test('GeoSampa: coordenadas GeoJSON e aceite de gesso específico por unidade', () => {
  const api = loadProject()('api/src/rotas/ecopontos.ts');
  const [comum, diferenciado] = api.normalizarEcopontos(colecao(ponto(), ponto('ecoponto.2', 'Gesso')));
  assert.equal(comum.latitude, -23.5434034);
  assert.equal(comum.longitude, -46.60646234);
  assert.equal(comum.materiais.includes('gesso'), false);
  assert.equal(diferenciado.materiais.includes('gesso'), true);
  assert.equal(comum.materiais.length, 4);
  const negado = ponto('negado', 'Não recebe gesso');
  negado.properties.tx_recebimento_comum = 'Não recebe entulho';
  assert.equal(api.normalizarEcopontos(colecao(negado))[0].materiais.length, 0);
});

test('GeoSampa: descarta geometrias fora da cidade, campos inválidos e IDs repetidos', () => {
  const { normalizarEcopontos } = loadProject()('api/src/rotas/ecopontos.ts');
  const fora = ponto('fora'); fora.geometry.coordinates = [10, 20];
  const invalido = ponto('inválido'); invalido.properties.nm_endereco = '';
  assert.equal(normalizarEcopontos(colecao(ponto(), fora, invalido, ponto())).length, 1);
  assert.throws(() => normalizarEcopontos(colecao(fora)));
  assert.throws(() => normalizarEcopontos({ ...colecao(ponto()), numberMatched: 501 }));
});

test('GeoSampa: compartilha consulta concorrente e reutiliza resposta no servidor', async () => {
  const espera = deferred(); let chamadas = 0;
  const { listarEcopontos } = loadProject({}, { fetch: async () => { chamadas++; await espera.promise; return Response.json(colecao(ponto())); } })('api/src/rotas/ecopontos.ts');
  const primeira = listarEcopontos(); const segunda = listarEcopontos();
  espera.resolve();
  const respostas = await Promise.all([primeira, segunda]);
  await listarEcopontos();
  assert.equal(chamadas, 1);
  assert.equal((await respostas[0].json()).pontos.length, 1);
});

test('GeoSampa: falha externa não vira sucesso nem uma lista vazia em cache', async () => {
  let chamadas = 0;
  const { listarEcopontos } = loadProject({}, { fetch: async () => { chamadas++; return new Response('indisponível', { status: 503 }); } })('api/src/rotas/ecopontos.ts');
  await assert.rejects(listarEcopontos(), (erro) => erro.status === 503 && erro.codigo === 'ECOPONTOS_INDISPONIVEIS');
  await assert.rejects(listarEcopontos());
  assert.equal(chamadas, 2);
});

test('Descarte: busca sem acento combinada com material e rota sem enviar localização pessoal', () => {
  const load = loadProject();
  const pontos = load('api/src/rotas/ecopontos.ts').normalizarEcopontos(colecao(ponto(), ponto('ecoponto.2', 'Gesso')));
  const { filtrarEcopontos, urlRotaEcoponto } = load('src/utils/ecopontos.ts');
  assert.equal(filtrarEcopontos(pontos, 'gesso', 'bras mooca').length, 1);
  assert.equal(filtrarEcopontos(pontos, 'todos', 'inexistente').length, 0);
  const url = new URL(urlRotaEcoponto(pontos[0]));
  assert.equal(url.searchParams.get('destination'), '-23.5434034,-46.60646234');
  assert.equal(url.searchParams.has('origin'), false);
});

test('Descarte: consulta pública validada e cópia local disponível por 24 horas', async () => {
  const storage = storageMock(); let opcoes;
  const load = loadProject({ '@react-native-async-storage/async-storage': storage, './api': { requisitar: async (_, args) => { opcoes = args; return resposta; } } });
  const resposta = { pontos: load('api/src/rotas/ecopontos.ts').normalizarEcopontos(colecao(ponto())), consultadoEm: new Date().toISOString(), fonte: load('src/schemas/ecoponto.ts').FONTE_ECOPONTOS };
  const servico = load('src/services/ecopontosService.ts');
  await servico.buscarEcopontos();
  assert.equal(opcoes.token, null);
  assert.equal((await servico.lerEcopontosSalvos()).dados.pontos.length, 1);
  for (const [chave, valor] of storage.data) {
    if (chave.endsWith('ecopontos/sao-paulo')) storage.data.set(chave, JSON.stringify({ ...JSON.parse(valor), salvoEm: Date.now() - 25 * 60 * 60_000 }));
  }
  assert.equal(await servico.lerEcopontosSalvos(), null);
});

test('Descarte: rejeita dados de rede e de cache fora do contrato', async () => {
  const load = loadProject({ '@react-native-async-storage/async-storage': storageMock(), './api': { requisitar: async () => ({ pontos: [] }) } });
  const servico = load('src/services/ecopontosService.ts');
  await assert.rejects(servico.buscarEcopontos());
  await load('src/services/cache.ts').salvarCache('ecopontos/sao-paulo', { pontos: [] });
  assert.equal(await servico.lerEcopontosSalvos(), null);
});

test('Mapa nativo: texto da fonte não injeta HTML ou encerra o script', () => {
  const load = loadProject();
  const [local] = load('api/src/rotas/ecopontos.ts').normalizarEcopontos(colecao(ponto()));
  local.nome = '</script><script>alert(1)</script>';
  const html = load('src/components/descarte/htmlMapa.ts').criarHtmlMapa([local]);
  assert.equal(html.includes(local.nome), false);
  assert.equal(html.includes('\\u003c/script\\u003e'), true);
  assert.equal(html.includes('nome.textContent='), true);
  assert.equal(html.includes('OpenStreetMap'), true);
  const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  assert.doesNotThrow(() => new (require('node:vm').Script)(script));
});
