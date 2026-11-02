const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function loadProject(mocks = {}, globals = {}) {
  const modules = new Map();
  const sandbox = { console, process, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask, AbortController, Request, Response, Headers, URL, TextEncoder, Uint8Array, ArrayBuffer, crypto: webcrypto, btoa, atob, ...globals };
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (modules.has(filename)) return modules.get(filename).exports;
    const source = fs.readFileSync(filename, 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const module = { exports: {} };
    modules.set(filename, module);
    const localRequire = (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (!name.startsWith('.')) return require(require.resolve(name, { paths: [root] }));
      const base = path.resolve(path.dirname(filename), name);
      const target = [base, base + '.ts', base + '.tsx'].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      if (!target) throw new Error('Import não encontrado: ' + name);
      return load(target);
    };
    vm.runInNewContext('(function(require,module,exports){' + compiled + '\n})', sandbox, { filename })(localRequire, module, module.exports);
    return module.exports;
  }
  return load;
}

function deferred() {
  let resolve;
  const promise = new Promise((finish) => { resolve = finish; });
  return { promise, resolve };
}

function storageMock() {
  const data = new Map();
  return { data, getItem: async (key) => data.get(key) ?? null, setItem: async (key, value) => { data.set(key, value); }, removeItem: async (key) => { data.delete(key); }, getAllKeys: async () => [...data.keys()], multiRemove: async (keys) => { keys.forEach((key) => data.delete(key)); } };
}

function database() {
  const { DatabaseSync } = require('node:sqlite');
  const sql = new DatabaseSync(':memory:');
  const migrations = path.join(root, 'api/migrations');
  for (const filename of fs.readdirSync(migrations).filter((name) => name.endsWith('.sql')).sort()) sql.exec(fs.readFileSync(path.join(migrations, filename), 'utf8'));
  const prepare = (query, values = []) => ({
    bind: (...args) => prepare(query, args.map((value) => value instanceof ArrayBuffer ? new Uint8Array(value) : value)),
    first: async (column) => { const row = sql.prepare(query).get(...values); return column ? row?.[column] ?? null : row ?? null; },
    all: async () => ({ results: sql.prepare(query).all(...values) }),
    run: async () => { const info = sql.prepare(query).run(...values); return { meta: { changes: Number(info.changes) } }; },
    execute: () => { const info = sql.prepare(query).run(...values); return { meta: { changes: Number(info.changes) } }; },
  });
  const DB = { prepare, batch: async (statements) => {
    sql.exec('BEGIN');
    try { const results = statements.map((statement) => statement.execute()); sql.exec('COMMIT'); return results; }
    catch (error) { sql.exec('ROLLBACK'); throw error; }
  } };
  const seedUser = (id = 'conta-a') => sql.prepare(`INSERT INTO users (id,email,senha_hash,nome_completo,nome_publico,telefone,cpf_cifrado,cpf_hash,cpf_final,data_nascimento,criado_em,atualizado_em)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, id + '@example.test', 'hash-teste', 'Conta Teste', 'Conta T.', 'telefone-teste', 'cifrado-teste', id, '00', '2000-01-01', new Date().toISOString(), new Date().toISOString());
  return { DB, sql, seedUser };
}

async function settle() {
  for (let iteration = 0; iteration < 50; iteration++) await Promise.resolve();
}

module.exports = { loadProject, deferred, storageMock, database, settle };
