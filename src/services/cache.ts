import AsyncStorage from '@react-native-async-storage/async-storage';
import { capturarContaLocal, contaLocalValida } from './contaLocal';

// Cache local de respostas da API (AsyncStorage), no padrão "mostra o salvo e atualiza em seguida":
// a tela abre na hora (e sem conexão) com a última resposta guardada, enquanto a API devolve a nova.
// Só entram dados públicos ou da própria pessoa; nada sensível (CPF, senha, telefone, token).

// Ao mudar o formato de alguma resposta guardada, aumente a versão: as cópias antigas deixam de ser lidas
// (e são apagadas por limparVersoesAntigasDoCache) em vez de quebrar a tela com um formato que não existe mais.
const VERSAO_CACHE = 2;
const RAIZ = '@reuse/cache/';
const PREFIXO = `${RAIZ}v${VERSAO_CACHE}/`;
const CHAVE_INDICE = `${PREFIXO}_indice`;
// Limite de entradas: ao passar, as mais antigas saem primeiro.
const MAX_ENTRADAS = 40;

// Idade máxima aceita de cada tipo de dado; depois disso a entrada é ignorada.
export const TTL_CACHE = {
  listagens: 6 * 60 * 60_000, // Home e catálogo: 6 horas
  detalhe: 24 * 60 * 60_000, // anúncio aberto: 24 horas
  estatisticas: 24 * 60 * 60_000, // números de impacto: 24 horas
  ecopontos: 24 * 60 * 60_000, // lista municipal de locais de descarte: 24 horas
  cep: 30 * 24 * 60 * 60_000, // endereço de um CEP quase nunca muda: 30 dias
} as const;

interface Envelope<T> {
  salvoEm: number;
  dados: T;
}

export interface EntradaCache<T> {
  dados: T;
  // Quando a resposta foi guardada (ms desde 1970), para mostrar "atualizado há ...".
  salvoEm: number;
}

// Gravações em fila: várias telas gravam ao mesmo tempo e o índice não pode perder atualizações.
let fila: Promise<unknown> = Promise.resolve();
function emFila<T>(tarefa: () => Promise<T>): Promise<T> {
  const resultado = fila.then(tarefa);
  fila = resultado.catch(() => undefined);
  return resultado;
}

async function lerIndice(): Promise<string[]> {
  try {
    const valor = await AsyncStorage.getItem(CHAVE_INDICE);
    return valor ? (JSON.parse(valor) as string[]) : [];
  } catch {
    return [];
  }
}

export async function lerCache<T>(chave: string, maxIdadeMs: number): Promise<EntradaCache<T> | null> {
  try {
    const valor = await AsyncStorage.getItem(PREFIXO + chave);
    if (!valor) {
      return null;
    }
    const envelope = JSON.parse(valor) as Envelope<T>;
    if (!envelope || !Number.isFinite(envelope.salvoEm) || !('dados' in envelope) || Date.now() - envelope.salvoEm > maxIdadeMs) {
      return null;
    }
    return { dados: envelope.dados, salvoEm: envelope.salvoEm };
  } catch {
    return null;
  }
}

export function salvarCache<T>(chave: string, dados: T, contexto = capturarContaLocal()): Promise<void> {
  return emFila(async () => {
    try {
      if (!contaLocalValida(contexto)) return;
      const envelope: Envelope<T> = { salvoEm: Date.now(), dados };
      await AsyncStorage.setItem(PREFIXO + chave, JSON.stringify(envelope));

      const indice = (await lerIndice()).filter((existente) => existente !== chave);
      indice.push(chave);
      const excedentes = indice.splice(0, Math.max(0, indice.length - MAX_ENTRADAS));
      if (excedentes.length > 0) {
        await AsyncStorage.multiRemove(excedentes.map((antiga) => PREFIXO + antiga));
      }
      await AsyncStorage.setItem(CHAVE_INDICE, JSON.stringify(indice));
    } catch {
      // Cache é conveniência: falhar ao gravar não deve interromper o fluxo.
    }
  });
}

export function removerCache(chave: string): Promise<void> {
  return emFila(async () => {
    try {
      await AsyncStorage.removeItem(PREFIXO + chave);
      const indice = (await lerIndice()).filter((existente) => existente !== chave);
      await AsyncStorage.setItem(CHAVE_INDICE, JSON.stringify(indice));
    } catch {
      // Idem: sem impacto no fluxo principal.
    }
  });
}

// Ao sair da conta, apaga todas as respostas guardadas (a Home, por exemplo, depende do endereço do perfil).
export function limparCache(): Promise<void> {
  return emFila(async () => {
    try {
      // Tudo que for do cache (inclusive de versões antigas), não só o que está no índice.
      const chaves = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(chaves.filter((chave) => chave.startsWith(RAIZ)));
    } catch {
      // Idem.
    }
  });
}

// Apaga o que sobrou de versões antigas do cache (chamada uma vez ao abrir o app).
export async function limparVersoesAntigasDoCache(): Promise<void> {
  try {
    const chaves = await AsyncStorage.getAllKeys();
    const antigas = chaves.filter((chave) => chave.startsWith(RAIZ) && !chave.startsWith(PREFIXO));
    if (antigas.length > 0) {
      await AsyncStorage.multiRemove(antigas);
    }
  } catch {
    // Sem impacto no fluxo principal.
  }
}

// "há 5 min", "há 2 h" para avisos de dados salvos.
export function descreverIdade(salvoEm: number): string {
  const minutos = Math.max(0, Math.round((Date.now() - salvoEm) / 60_000));
  if (minutos < 1) return 'agora há pouco';
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  return `há ${Math.round(horas / 24)} d`;
}
