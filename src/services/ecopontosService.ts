import { respostaEcopontosSchema } from '../schemas/ecoponto';
import { requisitar } from './api';
import { lerCache, salvarCache, TTL_CACHE } from './cache';
import { capturarContaLocal } from './contaLocal';

const CHAVE = 'ecopontos/sao-paulo';
export async function lerEcopontosSalvos() {
  const entrada = await lerCache<unknown>(CHAVE, TTL_CACHE.ecopontos);
  const dados = respostaEcopontosSchema.safeParse(entrada?.dados);
  return entrada && dados.success ? { dados: dados.data, salvoEm: entrada.salvoEm } : null;
}
export async function buscarEcopontos() {
  const contexto = capturarContaLocal();
  const resposta = respostaEcopontosSchema.safeParse(await requisitar<unknown>('/ecopontos', { token: null }));
  if (!resposta.success) throw new Error('A consulta aos ecopontos retornou dados inválidos. Tente novamente.');
  await salvarCache(CHAVE, resposta.data, contexto);
  return resposta.data;
}
