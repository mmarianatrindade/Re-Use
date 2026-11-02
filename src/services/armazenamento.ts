import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { limparCache } from './cache';
import { capturarContaLocal, contaLocalValida, encerrarContaLocal, type ContextoContaLocal } from './contaLocal';

// StorageService: segredos (token de sessão) no SecureStore — Keychain no iOS, Keystore no Android —
// e cache/rascunhos não sensíveis no AsyncStorage. CPF, senha e telefone nunca vão para o AsyncStorage.

const CHAVE_SESSAO = 'reuse.sessao';

export const chavesLocais = {
  meusAnuncios: '@reuse/meus-anuncios',
  rascunhoAnuncio: '@reuse/rascunho-anuncio',
  ultimoEmail: '@reuse/ultimo-email',
  // Anúncios salvos: ficam no aparelho mesmo após sair da conta (não têm dado sensível).
  salvos: '@reuse/salvos',
} as const;

export interface SessaoSalva {
  token: string;
  expiraEm: string;
  usuarioId?: string;
}

// SecureStore não existe no navegador; na web o token fica no armazenamento do próprio site.
const usaSecureStore = Platform.OS !== 'web';
let fila: Promise<unknown> = Promise.resolve();

function emFila<T>(tarefa: () => Promise<T>): Promise<T> {
  const resultado = fila.then(tarefa);
  fila = resultado.catch(() => undefined);
  return resultado;
}

function chaveDaConta(chave: string, contexto: ContextoContaLocal) {
  if (chave !== chavesLocais.meusAnuncios && chave !== chavesLocais.rascunhoAnuncio) return chave;
  return contexto.usuarioId ? `${chave}/${contexto.usuarioId}` : null;
}

export function salvarSessao(sessao: SessaoSalva, contexto = capturarContaLocal()) {
  return emFila(async () => {
    if (!contaLocalValida(contexto)) return;
    const valor = JSON.stringify(sessao);
    if (usaSecureStore) {
      await SecureStore.setItemAsync(CHAVE_SESSAO, valor, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
    } else {
      await AsyncStorage.setItem(CHAVE_SESSAO, valor);
    }
  });
}

export async function carregarSessao(): Promise<SessaoSalva | null> {
  try {
    await fila;
    const valor = usaSecureStore ? await SecureStore.getItemAsync(CHAVE_SESSAO) : await AsyncStorage.getItem(CHAVE_SESSAO);
    const sessao = valor ? JSON.parse(valor) as SessaoSalva : null;
    return sessao && typeof sessao.token === 'string' && Number.isFinite(Date.parse(sessao.expiraEm)) ? sessao : null;
  } catch {
    return null;
  }
}

export function apagarSessao() {
  return emFila(async () => {
    if (usaSecureStore) {
      await SecureStore.deleteItemAsync(CHAVE_SESSAO);
    } else {
      await AsyncStorage.removeItem(CHAVE_SESSAO);
    }
  });
}

export async function lerLocal<T>(chave: string, contexto = capturarContaLocal()): Promise<T | null> {
  try {
    const destino = chaveDaConta(chave, contexto);
    if (!destino || !contaLocalValida(contexto)) return null;
    await fila;
    const valor = await AsyncStorage.getItem(destino);
    if (!contaLocalValida(contexto)) return null;
    return valor ? (JSON.parse(valor) as T) : null;
  } catch {
    return null;
  }
}

export function salvarLocal(chave: string, valor: unknown, contexto = capturarContaLocal()) {
  return emFila(async () => {
    try {
      const destino = chaveDaConta(chave, contexto);
      if (!destino || !contaLocalValida(contexto)) return;
      await AsyncStorage.setItem(destino, JSON.stringify(valor));
    } catch {
      // Cache é conveniência: falhar ao gravar não deve interromper o fluxo.
    }
  });
}

export function removerLocal(chave: string, contexto = capturarContaLocal()) {
  return emFila(async () => {
    try {
      const destino = chaveDaConta(chave, contexto);
      if (destino && contaLocalValida(contexto)) await AsyncStorage.removeItem(destino);
    } catch {
      // Idem: sem impacto no fluxo principal.
    }
  });
}

// Ao sair, remove os dados da conta guardados no aparelho (o último e-mail fica para agilizar o próximo login).
export async function limparDadosDaConta() {
  encerrarContaLocal();
  await Promise.all([
    apagarSessao(),
    emFila(async () => {
      const chaves = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(chaves.filter((chave) =>
        [chavesLocais.meusAnuncios, chavesLocais.rascunhoAnuncio].some((prefixo) => chave === prefixo || chave.startsWith(`${prefixo}/`)),
      ));
    }),
    limparCache(),
  ]);
}
