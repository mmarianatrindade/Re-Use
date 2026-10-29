import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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
}

// SecureStore não existe no navegador; na web o token fica no armazenamento do próprio site.
const usaSecureStore = Platform.OS !== 'web';

export async function salvarSessao(sessao: SessaoSalva) {
  const valor = JSON.stringify(sessao);
  if (usaSecureStore) {
    await SecureStore.setItemAsync(CHAVE_SESSAO, valor, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
  } else {
    await AsyncStorage.setItem(CHAVE_SESSAO, valor);
  }
}

export async function carregarSessao(): Promise<SessaoSalva | null> {
  try {
    const valor = usaSecureStore ? await SecureStore.getItemAsync(CHAVE_SESSAO) : await AsyncStorage.getItem(CHAVE_SESSAO);
    return valor ? (JSON.parse(valor) as SessaoSalva) : null;
  } catch {
    return null;
  }
}

export async function apagarSessao() {
  if (usaSecureStore) {
    await SecureStore.deleteItemAsync(CHAVE_SESSAO);
  } else {
    await AsyncStorage.removeItem(CHAVE_SESSAO);
  }
}

export async function lerLocal<T>(chave: string): Promise<T | null> {
  try {
    const valor = await AsyncStorage.getItem(chave);
    return valor ? (JSON.parse(valor) as T) : null;
  } catch {
    return null;
  }
}

export async function salvarLocal(chave: string, valor: unknown) {
  try {
    await AsyncStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Cache é conveniência: falhar ao gravar não deve interromper o fluxo.
  }
}

export async function removerLocal(chave: string) {
  try {
    await AsyncStorage.removeItem(chave);
  } catch {
    // Idem: sem impacto no fluxo principal.
  }
}

// Ao sair, remove os dados da conta guardados no aparelho (o último e-mail fica para agilizar o próximo login).
export async function limparDadosDaConta() {
  await Promise.all([
    apagarSessao(),
    removerLocal(chavesLocais.meusAnuncios),
    removerLocal(chavesLocais.rascunhoAnuncio),
  ]);
}
