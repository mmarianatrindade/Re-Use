import type { ModalidadeId } from '../data/reuseData';

// Rótulo de preço de um item: valor em reais na venda, "Gratuito" na doação e propostas na troca.
export function formatItemPrice(price: number | undefined, modality: ModalidadeId) {
  if (price !== undefined) {
    return `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return modality === 'doacao' ? 'Gratuito' : 'Aberto a propostas';
}
