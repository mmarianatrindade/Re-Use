import type { EstatisticasPlataforma } from '../types/api';
import { requisitar } from './api';
import { lerCache, salvarCache, TTL_CACHE } from './cache';
import { capturarContaLocal } from './contaLocal';

export async function buscarEstatisticas() {
  const conta = capturarContaLocal();
  const estatisticas = await requisitar<EstatisticasPlataforma>('/estatisticas', { token: null });
  void salvarCache('estatisticas', estatisticas, conta);
  return estatisticas;
}

// Últimos números de impacto recebidos, para a Home mostrar a frase na hora.
export function lerEstatisticasEmCache() {
  return lerCache<EstatisticasPlataforma>('estatisticas', TTL_CACHE.estatisticas);
}
