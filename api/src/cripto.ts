// Criptografia com a Web Crypto API do Workers: hash de senha, tokens e cifra do CPF.

const encoder = new TextEncoder();

// Limite de iterações PBKDF2 suportado pelo runtime do Workers.
const PBKDF2_ITERACOES = 100_000;

function paraBase64Url(bytes: Uint8Array) {
  let binario = '';
  for (const byte of bytes) {
    binario += String.fromCharCode(byte);
  }
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function deBase64Url(texto: string) {
  const base64 = texto.replace(/-/g, '+').replace(/_/g, '/');
  const binario = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binario, (caractere) => caractere.charCodeAt(0));
}

function paraHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Comparação em tempo constante para não vazar informação pelo tempo de resposta.
function compararSeguro(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) {
    return false;
  }
  let diferenca = 0;
  for (let indice = 0; indice < a.length; indice += 1) {
    diferenca |= a[indice] ^ b[indice];
  }
  return diferenca === 0;
}

export function gerarId() {
  return crypto.randomUUID();
}

// Token opaco de 256 bits, enviado ao cliente; o banco guarda só o hash.
export function gerarToken() {
  return paraBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function calcularSha256(texto: string) {
  return paraHex(await crypto.subtle.digest('SHA-256', encoder.encode(texto)));
}

async function derivarSenha(senha: string, sal: Uint8Array, iteracoes: number) {
  const chave = await crypto.subtle.importKey('raw', encoder.encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteracoes }, chave, 256);
  return new Uint8Array(bits);
}

// Formato armazenado: pbkdf2$<iterações>$<sal>$<hash>
export async function gerarHashSenha(senha: string) {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivarSenha(senha, sal, PBKDF2_ITERACOES);
  return `pbkdf2$${PBKDF2_ITERACOES}$${paraBase64Url(sal)}$${paraBase64Url(hash)}`;
}

export async function verificarSenha(senha: string, armazenado: string) {
  const [algoritmo, iteracoes, sal, hash] = armazenado.split('$');
  if (algoritmo !== 'pbkdf2' || !iteracoes || !sal || !hash) {
    return false;
  }
  const calculado = await derivarSenha(senha, deBase64Url(sal), Number(iteracoes));
  return compararSeguro(calculado, deBase64Url(hash));
}

// Hash de referência para gastar o mesmo tempo quando o e-mail não existe (evita enumeração de contas).
let hashFicticio: Promise<string> | null = null;
export function obterHashFicticio() {
  hashFicticio ??= gerarHashSenha('senha-ficticia-reuse-0');
  return hashFicticio;
}

function lerChaveCpf(chaveBase64: string) {
  if (!chaveBase64) {
    throw new Error('CPF_CHAVE não configurada.');
  }
  const bytes = Uint8Array.from(atob(chaveBase64), (caractere) => caractere.charCodeAt(0));
  if (bytes.length !== 32) {
    throw new Error('CPF_CHAVE precisa ter 32 bytes em base64.');
  }
  return bytes;
}

export async function cifrarCpf(cpf: string, chaveBase64: string) {
  const chave = await crypto.subtle.importKey('raw', lerChaveCpf(chaveBase64), 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cifrado = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, chave, encoder.encode(cpf));
  return `${paraBase64Url(iv)}.${paraBase64Url(new Uint8Array(cifrado))}`;
}

// HMAC determinístico do CPF: permite checar duplicidade sem guardar o número em claro.
export async function calcularHashCpf(cpf: string, chaveBase64: string) {
  const material = new Uint8Array([...lerChaveCpf(chaveBase64), ...encoder.encode('cpf-hmac')]);
  const chaveHmac = await crypto.subtle.digest('SHA-256', material);
  const chave = await crypto.subtle.importKey('raw', chaveHmac, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return paraHex(await crypto.subtle.sign('HMAC', chave, encoder.encode(cpf)));
}
