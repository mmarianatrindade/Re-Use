// Logos oficiais do ReUse e fotos reais (Wikimedia Commons), todos em WebP.
export const images = {
  // Logo completo (símbolo + nome + slogan), usado no cabeçalho.
  logoHorizontal: require('../../assets/images/logo_completo_horizontal.webp'),
  logoSimbolo: require('../../assets/images/logo_sem_nome.webp'),
  // Símbolo + nome, sem slogan: legível em tamanho pequeno (banners das abas).
  logoNomeHorizontal: require('../../assets/images/logo_nome_circular_horizontal.webp'),
  folha: require('../../assets/images/folha.webp'),
  tag: require('../../assets/images/logo_tag.webp'),
};

// Tags por contexto: venda (dourada), troca (azul), doação (vermelha) e negociando (cinza, usada junto da modalidade).
// Os demais assuntos usam a tag do logo (images.tag).
export const tags = {
  padrao: images.tag,
  venda: require('../../assets/images/tags/tag_venda.webp'),
  troca: require('../../assets/images/tags/tag_troca.webp'),
  doacao: require('../../assets/images/tags/tag_doacao.webp'),
  negociando: require('../../assets/images/tags/tag_negociando.webp'),
};

export type TipoTag = keyof typeof tags;

// Colagem de itens reutilizáveis (arte própria do ReUse) e recortes dela usados em telas internas.
export const fundo = {
  hero: require('../../assets/images/fundo/bg_hero.webp'),
  casa: require('../../assets/images/fundo/recorte_casa.webp'),
  lazer: require('../../assets/images/fundo/recorte_lazer.webp'),
  infantil: require('../../assets/images/fundo/recorte_infantil.webp'),
};

export const photos = {
  cta: require('../../assets/images/photos/cta.webp'),
};
