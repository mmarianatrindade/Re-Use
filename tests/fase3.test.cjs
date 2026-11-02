const test = require('node:test');
const assert = require('node:assert/strict');
const { loadProject, deferred, storageMock, database, settle } = require('./helpers.cjs');
const native = { Platform: { OS: 'web' } };

test('401 de token substituído não encerra a sessão atual', async () => {
  const pending = deferred();
  const api = loadProject({ 'react-native': native }, { fetch: () => pending.promise })('src/services/api.ts');
  let token = 'antigo';
  let expired = 0;
  api.configurarSessaoApi({ obterToken: () => token, aoExpirarSessao: () => { expired++; } });
  const request = api.requisitar('/me').catch((error) => error);
  token = 'novo';
  pending.resolve(new Response('{}', { status: 401 }));
  assert.equal((await request).status, 401);
  assert.equal(expired, 0);
});

test('401 da credencial atual informa encerramento', async () => {
  let expired = 0;
  const api = loadProject({ 'react-native': native }, { fetch: async () => new Response('{}', { status: 401 }) })('src/services/api.ts');
  api.configurarSessaoApi({ obterToken: () => 'atual', aoExpirarSessao: () => { expired++; } });
  await assert.rejects(() => api.requisitar('/me'));
  assert.equal(expired, 1);
});

test('GET repete 502, POST não repete, JSON inválido e 422 preservam erros', async () => {
  let attempts = 0;
  const api = loadProject({ 'react-native': native }, { fetch: async () => { attempts++; return attempts === 1 ? new Response('{}', { status: 502 }) : new Response('{"ok":true}'); } })('src/services/api.ts');
  assert.equal((await api.requisitar('/teste')).ok, true);
  assert.equal(attempts, 2);
  attempts = 0;
  await assert.rejects(() => api.requisitar('/teste', { metodo: 'POST' }), (error) => error.status === 502);
  assert.equal(attempts, 1);
  const invalid = loadProject({ 'react-native': native }, { fetch: async () => new Response('<html>erro</html>') })('src/services/api.ts');
  await assert.rejects(() => invalid.requisitar('/teste'), (error) => error.codigo === 'RESPOSTA_INVALIDA');
  const fields = loadProject({ 'react-native': native }, { fetch: async () => new Response('{"campos":{"titulo":"Obrigatório"}}', { status: 422 }) })('src/services/api.ts');
  await assert.rejects(() => fields.requisitar('/teste'), (error) => error.campos.titulo === 'Obrigatório');
});

test('timeout aborta GET após duas tentativas', async () => {
  let attempts = 0;
  const api = loadProject({ 'react-native': native }, {
    fetch: async (_url, options) => { attempts++; return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('abort')))); },
    setTimeout: (callback) => { queueMicrotask(callback); return 1; }, clearTimeout: () => {},
  })('src/services/api.ts');
  await assert.rejects(() => api.requisitar('/teste'), (error) => error.codigo === 'TEMPO_ESGOTADO');
  assert.equal(attempts, 2);
});

test('cache expira, limita a 40 entradas e permite remover e limpar', async () => {
  const storage = storageMock();
  const cache = loadProject({ '@react-native-async-storage/async-storage': storage })('src/services/cache.ts');
  for (let index = 0; index < 45; index++) await cache.salvarCache('item/' + index, index);
  assert.equal(storage.data.size, 41);
  assert.equal(await cache.lerCache('item/0', 1000), null);
  assert.equal(await cache.lerCache('item/44', -1), null);
  assert.equal((await cache.lerCache('item/44', 1000)).dados, 44);
  await cache.removerCache('item/44');
  assert.equal(await cache.lerCache('item/44', 1000), null);
  await cache.limparCache();
  assert.equal(storage.data.size, 0);
});

test('resposta em voo não recria dados após logout ou troca de conta', async () => {
  const pending = deferred();
  const storage = storageMock();
  const load = loadProject({ '@react-native-async-storage/async-storage': storage, 'expo-secure-store': {}, 'react-native': native, './api': { requisitar: () => pending.promise } });
  const account = load('src/services/contaLocal.ts');
  account.ativarContaLocal('conta-a');
  const service = load('src/services/anunciosService.ts');
  const local = load('src/services/armazenamento.ts');
  const request = service.listarMeusAnuncios();
  await local.limparDadosDaConta();
  account.ativarContaLocal('conta-b');
  pending.resolve([{ id: 'privado-a' }]);
  await request;
  assert.equal(await local.lerLocal(local.chavesLocais.meusAnuncios), null);
  assert.equal(storage.data.has('@reuse/meus-anuncios/conta-a'), false);
});

test('rascunhos são isolados por conta e gravação antiga é descartada', async () => {
  const storage = storageMock();
  const load = loadProject({ '@react-native-async-storage/async-storage': storage, 'expo-secure-store': {}, 'react-native': native });
  const account = load('src/services/contaLocal.ts');
  const local = load('src/services/armazenamento.ts');
  const first = account.ativarContaLocal('conta-a');
  await local.salvarLocal(local.chavesLocais.rascunhoAnuncio, { titulo: 'Conta A' }, first);
  account.ativarContaLocal('conta-b');
  assert.equal(await local.lerLocal(local.chavesLocais.rascunhoAnuncio), null);
  await local.salvarLocal(local.chavesLocais.rascunhoAnuncio, { titulo: 'Atrasado' }, first);
  assert.equal(await local.lerLocal(local.chavesLocais.rascunhoAnuncio), null);
});

function sessionSetup(expiration, pending = deferred()) {
  const effects = [];
  const states = [];
  const callbacks = {};
  let saved = { token: 'original', expiraEm: expiration, usuarioId: 'conta-a' };
  let renewals = 0;
  let cleared = 0;
  const react = { createContext: () => ({ Provider: 'provider' }), useState: (initial) => [initial, (value) => states.push(value)], useRef: (initial) => ({ current: initial }), useCallback: (callback) => callback, useMemo: (callback) => callback(), useEffect: (effect) => effects.push(effect) };
  const load = loadProject({ react, 'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
    'react-native': { AppState: { addEventListener: (_name, callback) => { callbacks.active = callback; return { remove() {} }; } } },
    '../services/api': { ApiError: class ApiError extends Error {}, configurarSessaoApi: (options) => { callbacks.expired = options.aoExpirarSessao; } },
    '../services/armazenamento': { carregarSessao: async () => saved, salvarSessao: async (value) => { saved = value; }, limparDadosDaConta: async () => { cleared++; saved = null; }, salvarLocal: async () => {}, chavesLocais: { ultimoEmail: 'email' } },
    '../services/authService': { renovarToken: () => { renewals++; return pending.promise; }, encerrarSessao: async () => {} },
    '../services/perfilService': { buscarMinhaConta: async () => ({ id: 'conta-a' }) },
  }, { setInterval: () => 1, clearInterval: () => {} });
  const rendered = load('src/contexts/SessaoContext.tsx').SessaoProvider({ children: null });
  effects.forEach((effect) => effect());
  return { value: rendered.props.value, saved: () => saved, renewals: () => renewals, cleared: () => cleared, states, callbacks, pending };
}

test('renovação atrasada não restaura sessão após sair', async () => {
  const state = sessionSetup(new Date(Date.now() + 86400000).toISOString());
  await settle();
  await state.value.sair();
  state.pending.resolve({ token: 'renovado', expiraEm: new Date(Date.now() + 7 * 86400000).toISOString(), usuario: { id: 'conta-a' } });
  await settle();
  assert.equal(state.saved(), null);
  assert.equal(state.states.at(-1), 'anonimo');
});

test('renovação inicial e primeiro plano compartilham a mesma operação', async () => {
  const state = sessionSetup(new Date(Date.now() + 86400000).toISOString());
  await settle();
  state.callbacks.active('active');
  assert.equal(state.renewals(), 1);
  state.pending.resolve({ token: 'novo', expiraEm: new Date(Date.now() + 7 * 86400000).toISOString(), usuario: { id: 'conta-a' } });
  await settle();
  assert.equal(state.saved().token, 'novo');
});

test('expiração na abertura limpa também os dados da conta', async () => {
  const state = sessionSetup(new Date(Date.now() - 1000).toISOString());
  await settle();
  assert.equal(state.cleared(), 1);
  assert.equal(state.saved(), null);
});

test('401 durante rotação não derruba o token renovado', async () => {
  const state = sessionSetup(new Date(Date.now() + 86400000).toISOString());
  await settle();
  state.callbacks.expired('original');
  state.pending.resolve({ token: 'novo', expiraEm: new Date(Date.now() + 7 * 86400000).toISOString(), usuario: { id: 'conta-a' } });
  await settle();
  assert.equal(state.saved().token, 'novo');
  assert.equal(state.cleared(), 0);
});

test('consulta de CEP abortada permite fallback manual', async () => {
  const service = loadProject({ '@react-native-async-storage/async-storage': storageMock(), 'react-native': native }, {
    fetch: async (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('abort')))),
    setTimeout: (callback) => { queueMicrotask(callback); return 1; }, clearTimeout: () => {},
  })('src/services/cepService.ts');
  assert.equal(await service.buscarEnderecoPorCep('01001000'), null);
  assert.equal(await service.buscarCoordenadasPorCep('01001000'), null);
});

test('produção sem envio de e-mail retorna indisponibilidade sem consultar contas', async () => {
  const routes = loadProject()('api/src/rotas/auth.ts');
  await assert.rejects(() => routes.recuperarSenha(new Request('https://example.test/auth/recuperar', { method: 'POST', body: '{}' }), { AMBIENTE: 'producao', EMAIL_REMETENTE: '' }), (error) => error.status === 503 && error.codigo === 'EMAIL_INDISPONIVEL');
});

test('limite de requisições é persistente e não excede a janela', async () => {
  const { DB, sql } = database();
  const { limitarRequisicoes } = loadProject()('api/src/limites.ts');
  const request = new Request('https://example.test/auth/login', { method: 'POST', headers: { 'CF-Connecting-IP': '192.0.2.1' } });
  for (let index = 0; index < 20; index++) await limitarRequisicoes(request, { DB });
  await assert.rejects(() => limitarRequisicoes(request, { DB }), (error) => error.status === 429);
  assert.equal(sql.prepare('SELECT quantidade FROM request_limits').get().quantidade, 20);
  sql.close();
});

test('rotação concorrente emite somente um sucessor e revoga token anterior', async () => {
  const { DB, sql, seedUser } = database();
  seedUser();
  const load = loadProject();
  const sessions = load('api/src/sessao.ts');
  const request = new Request('https://example.test/auth/renovar');
  const original = await sessions.criarSessao({ DB }, 'conta-a', request);
  const authenticated = new Request(request, { headers: { Authorization: 'Bearer ' + original.token } });
  const current = await sessions.exigirSessao({ DB }, authenticated);
  const results = await Promise.allSettled([sessions.rotacionarSessao({ DB }, current, request), sessions.rotacionarSessao({ DB }, current, request)]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(await sessions.buscarSessao({ DB }, authenticated), null);
  assert.equal(sql.prepare('SELECT COUNT(*) AS total FROM sessions WHERE revogado_em IS NULL').get().total, 1);
  sql.close();
});

test('upload rejeita formato falso e aceita PNG real com limite de tamanho', async () => {
  const { DB, sql, seedUser } = database();
  seedUser();
  const upload = loadProject({ '../sessao': { exigirSessao: async () => ({ userId: 'conta-a' }) } })('api/src/rotas/arquivos.ts');
  const request = (body) => new Request('https://example.test/uploads?tipo=anuncio', { method: 'POST', headers: { 'Content-Type': 'image/png' }, body });
  await assert.rejects(() => upload.enviarArquivo(request('texto sem imagem'), { DB }, 'https://example.test'), (error) => error.status === 415);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5xkAAAAASUVORK5CYII=', 'base64');
  assert.equal((await upload.enviarArquivo(request(png), { DB }, 'https://example.test')).status, 201);
  await assert.rejects(() => upload.enviarArquivo(request(Buffer.alloc(2 * 1024 * 1024)), { DB }, 'https://example.test'), (error) => error.status === 413);
  assert.equal(sql.prepare('SELECT COUNT(*) AS total FROM arquivos').get().total, 1);
  sql.close();
});
