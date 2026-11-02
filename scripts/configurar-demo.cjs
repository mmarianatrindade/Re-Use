const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const files = [
  ['.env', 'EXPO_PUBLIC_API_URL=http://localhost:8787\n'],
  ['api/.dev.vars', 'CPF_CHAVE=' + crypto.randomBytes(32).toString('base64') + '\n'],
];
for (const [relative, content] of files) {
  const target = path.join(root, relative);
  if (fs.existsSync(target)) console.log(relative + ' já existe; mantido.');
  else { fs.writeFileSync(target, content, { flag: 'wx' }); console.log(relative + ' criado para desenvolvimento local.'); }
}
console.log('Execute npm run api:migrar:local, depois npm run api:dev e npm start em terminais separados.');
