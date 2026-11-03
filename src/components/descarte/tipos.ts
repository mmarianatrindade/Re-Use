import type { Ecoponto } from '../../schemas/ecoponto';
export interface MapaDescarteProps {
  pontos: Ecoponto[];
  foco: { id: string; pedido: number } | null;
  onSelecionar: (id: string) => void;
}
export const URL_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const ATRIBUICAO_MAPA = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';
