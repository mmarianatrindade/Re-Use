import type { EstatisticasPlataforma } from '../types/api';
import { requisitar } from './api';

export function buscarEstatisticas() {
  return requisitar<EstatisticasPlataforma>('/estatisticas', { token: null });
}
