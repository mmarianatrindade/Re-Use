const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const api = 'https://reuse-api.r3vmarcos.workers.dev';
const expo = path.join(path.dirname(require.resolve('expo/package.json')), 'bin', 'cli');
const resultado = spawnSync(process.execPath, [expo, 'export', '-p', 'web', '--clear', '--output-dir', 'dist'], {
  cwd: root,
  // O .env local continua disponível para desenvolvimento; a publicação usa a API online.
  env: { ...process.env, EXPO_NO_DOTENV: '1', EXPO_PUBLIC_API_URL: api },
  stdio: 'inherit',
});
if (resultado.error) throw resultado.error;
if (resultado.status !== 0) process.exit(resultado.status ?? 1);

const pasta = path.join(root, 'dist', '_expo', 'static', 'js', 'web');
const bundles = fs.readdirSync(pasta).filter((arquivo) => /^AppEntry-.*\.js$/.test(arquivo));
if (!bundles.length) throw new Error('Publicação interrompida: o bundle web não foi encontrado.');
for (const arquivo of bundles) {
  const texto = fs.readFileSync(path.join(pasta, arquivo), 'utf8');
  if (!texto.includes(api) || texto.includes('http://localhost:8787')) {
    throw new Error('Publicação interrompida: o app não está configurado para a API de produção.');
  }
}
console.log('Versão de produção validada. API: ' + api);
