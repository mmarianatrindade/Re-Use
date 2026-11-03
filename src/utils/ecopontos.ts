import type { Ecoponto, MaterialDescarte } from '../schemas/ecoponto';

const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function filtrarEcopontos(pontos: Ecoponto[], material: MaterialDescarte | 'todos', busca: string): Ecoponto[] {
  const termos = normalizar(busca).split(/\s+/).filter(Boolean);
  return pontos.filter((ponto) => (material === 'todos' || ponto.materiais.includes(material)) &&
    termos.every((termo) => normalizar(`${ponto.nome} ${ponto.endereco} ${ponto.distrito} ${ponto.subprefeitura}`).includes(termo)));
}
export function urlRotaEcoponto(ponto: Ecoponto): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${ponto.latitude},${ponto.longitude}`)}`;
}
