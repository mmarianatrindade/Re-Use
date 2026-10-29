// Catálogo de anúncios compartilhado entre app e API: categorias com subcategorias, estados do produto,
// formas de recebimento e tipos de anunciante. Os ids são estáveis (gravados no banco); os rótulos podem mudar.

export function gerarSlug(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface CategoriaBase {
  id: string;
  label: string;
  subcategorias: string[];
}

const CATEGORIAS_BASE: CategoriaBase[] = [
  {
    id: 'eletronicos',
    label: 'Eletrônicos e Tecnologia',
    subcategorias: ['Celulares', 'Smartphones', 'Tablets', 'Notebooks', 'Computadores', 'Monitores', 'TVs', 'Videogames', 'Consoles', 'Controles', 'Impressoras', 'Câmeras', 'Lentes', 'Fones de ouvido', 'Caixas de som', 'Microfones', 'Cabos', 'Carregadores', 'Roteadores', 'Componentes de PC', 'Placas de vídeo', 'Memórias', 'HDs / SSDs', 'Teclados', 'Mouses', 'Acessórios', 'Outros eletrônicos'],
  },
  {
    id: 'casa',
    label: 'Casa e Decoração',
    subcategorias: ['Móveis', 'Sofás', 'Mesas', 'Cadeiras', 'Estantes', 'Armários', 'Camas', 'Colchões', 'Criados-mudos', 'Prateleiras', 'Decoração', 'Quadros', 'Espelhos', 'Tapetes', 'Cortinas', 'Luminárias', 'Utensílios domésticos', 'Organização', 'Outros'],
  },
  {
    id: 'construcao',
    label: 'Materiais de Construção',
    subcategorias: ['Cimento', 'Argamassa', 'Areia', 'Pedra', 'Tijolos', 'Blocos', 'Pisos', 'Azulejos', 'Revestimentos', 'Tintas', 'Vernizes', 'Madeiras', 'Tábuas', 'Compensados', 'MDF', 'Portas', 'Janelas', 'Vidros', 'Telhas', 'Tubos', 'Conexões', 'Fios e cabos', 'Materiais elétricos', 'Materiais hidráulicos', 'Ferragens', 'Pregos', 'Parafusos', 'Ferramentas', 'Sobras de obra', 'Outros'],
  },
  {
    id: 'brinquedos',
    label: 'Brinquedos e Jogos',
    subcategorias: ['Brinquedos educativos', 'Bonecas', 'Bonecos', 'Carrinhos', 'Pelúcias', 'Jogos de tabuleiro', 'Quebra-cabeças', 'Cartas', 'Brinquedos eletrônicos', 'Videogames', 'Brinquedos para bebês', 'Brinquedos de montar', 'LEGO e similares', 'Bicicletas infantis', 'Patinetes', 'Outros'],
  },
  {
    id: 'moda',
    label: 'Moda e Vestuário',
    subcategorias: ['Roupas femininas', 'Roupas masculinas', 'Roupas infantis', 'Roupas de bebê', 'Calçados', 'Bolsas', 'Mochilas', 'Malas', 'Acessórios', 'Joias e bijuterias', 'Relógios', 'Fantasias', 'Uniformes', 'Roupas esportivas', 'Outros'],
  },
  {
    id: 'livros',
    label: 'Livros e Educação',
    subcategorias: ['Livros', 'Livros didáticos', 'Apostilas', 'HQs', 'Mangás', 'Revistas', 'Enciclopédias', 'Material escolar', 'Material de escritório', 'Instrumentos educacionais', 'Cursos/material de estudo', 'Outros'],
  },
  {
    id: 'musica',
    label: 'Música e Instrumentos',
    subcategorias: ['Violões', 'Guitarras', 'Baixos', 'Teclados', 'Pianos', 'Baterias', 'Percussão', 'Instrumentos de sopro', 'Instrumentos de corda', 'Amplificadores', 'Pedais', 'Microfones', 'Equipamentos de áudio', 'Partituras', 'Acessórios', 'Outros'],
  },
  {
    id: 'esportes',
    label: 'Esportes e Lazer',
    subcategorias: ['Bicicletas', 'Skates', 'Patins', 'Patinetes', 'Equipamentos de academia', 'Pesos', 'Bolas', 'Equipamentos de futebol', 'Equipamentos de artes marciais', 'Equipamentos de camping', 'Pesca', 'Equipamentos de praia', 'Piscina', 'Jogos', 'Outros'],
  },
  {
    id: 'automotivo',
    label: 'Automotivo',
    subcategorias: ['Peças automotivas', 'Pneus', 'Rodas', 'Acessórios', 'Ferramentas automotivas', 'Som automotivo', 'Eletrônicos automotivos', 'Bancos', 'Tapetes', 'Peças de moto', 'Acessórios para moto', 'Outros'],
  },
  {
    id: 'ferramentas',
    label: 'Ferramentas e Equipamentos',
    subcategorias: ['Furadeiras', 'Parafusadeiras', 'Serras', 'Lixadeiras', 'Esmerilhadeiras', 'Ferramentas manuais', 'Chaves', 'Alicates', 'Equipamentos de medição', 'Equipamentos profissionais', 'Máquinas', 'Equipamentos de jardinagem', 'Outros'],
  },
  {
    id: 'jardim',
    label: 'Jardim e Área Externa',
    subcategorias: ['Plantas', 'Vasos', 'Sementes', 'Mudas', 'Ferramentas de jardinagem', 'Móveis externos', 'Churrasqueiras', 'Piscinas', 'Equipamentos de irrigação', 'Materiais para jardim', 'Outros'],
  },
  {
    id: 'cozinha',
    label: 'Cozinha',
    subcategorias: ['Panelas', 'Pratos', 'Copos', 'Talheres', 'Eletrodomésticos', 'Liquidificadores', 'Cafeteiras', 'Air Fryers', 'Fornos', 'Micro-ondas', 'Utensílios', 'Organizadores', 'Outros'],
  },
  {
    id: 'eletrodomesticos',
    label: 'Eletrodomésticos',
    subcategorias: ['Geladeiras', 'Freezers', 'Máquinas de lavar', 'Secadoras', 'Fogões', 'Fornos', 'Micro-ondas', 'Aspiradores', 'Ventiladores', 'Ar-condicionado', 'Purificadores', 'Outros'],
  },
  {
    id: 'bebes',
    label: 'Bebês e Crianças',
    subcategorias: ['Carrinhos', 'Berços', 'Cadeirinhas', 'Bebê-conforto', 'Roupas', 'Brinquedos', 'Mamadeiras', 'Móveis infantis', 'Itens para alimentação', 'Outros'],
  },
  {
    id: 'pets',
    label: 'Pets',
    subcategorias: ['Camas', 'Casinhas', 'Brinquedos', 'Roupas', 'Guias', 'Coleiras', 'Aquários', 'Gaiolas', 'Comedouros', 'Acessórios', 'Outros'],
  },
  {
    id: 'arte',
    label: 'Arte e Artesanato',
    subcategorias: ['Materiais de pintura', 'Tintas', 'Pincéis', 'Telas', 'Tecidos', 'Linhas', 'Lãs', 'Máquinas de costura', 'Ferramentas de artesanato', 'Materiais para DIY', 'Decoração artesanal', 'Outros'],
  },
  {
    id: 'escritorio',
    label: 'Escritório e Empresas',
    subcategorias: ['Mesas', 'Cadeiras', 'Armários', 'Computadores', 'Monitores', 'Impressoras', 'Material de escritório', 'Equipamentos', 'Mobiliário comercial', 'Expositores', 'Outros'],
  },
  {
    id: 'reciclaveis',
    label: 'Recicláveis e Reutilizáveis',
    subcategorias: ['Papel', 'Papelão', 'Plástico', 'Vidro', 'Metal', 'Madeira', 'Tecidos', 'Eletrônicos para reaproveitamento', 'Componentes', 'Materiais para artesanato', 'Sobras de materiais', 'Outros'],
  },
];

export interface Subcategoria {
  id: string;
  label: string;
}

export interface Categoria {
  id: string;
  label: string;
  subcategorias: Subcategoria[];
}

export const CATEGORIAS: Categoria[] = CATEGORIAS_BASE.map((categoria) => ({
  id: categoria.id,
  label: categoria.label,
  subcategorias: categoria.subcategorias.map((label) => ({ id: gerarSlug(label), label })),
}));

export const CATEGORIA_IDS = CATEGORIAS.map((categoria) => categoria.id);

// Busca sem acento e sem diferença de maiúsculas ("pra" encontra "Prateleiras").
export function normalizarBusca(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// Ordem alfabética para as listas de escolha; "Outros..." fica sempre no fim.
function ordenarPorRotulo<T extends { label: string }>(lista: readonly T[]): T[] {
  return [...lista].sort((a, b) => {
    const aOutros = a.label.startsWith('Outros');
    const bOutros = b.label.startsWith('Outros');
    if (aOutros !== bOutros) {
      return aOutros ? 1 : -1;
    }
    return a.label.localeCompare(b.label, 'pt-BR');
  });
}

export const CATEGORIAS_ORDENADAS: Categoria[] = ordenarPorRotulo(CATEGORIAS).map((categoria) => ({
  ...categoria,
  subcategorias: ordenarPorRotulo(categoria.subcategorias),
}));

export interface ResultadoBuscaCategoria {
  categoriaId: string;
  categoriaLabel: string;
  subcategoriaId: string;
  subcategoriaLabel: string;
}

// Índice montado uma vez: cada subcategoria com o texto normalizado e as palavras para casar pelo início.
const INDICE_SUBCATEGORIAS = CATEGORIAS_ORDENADAS.flatMap((categoria) =>
  categoria.subcategorias.map((sub) => {
    const chave = normalizarBusca(sub.label);
    return {
      resultado: { categoriaId: categoria.id, categoriaLabel: categoria.label, subcategoriaId: sub.id, subcategoriaLabel: sub.label },
      chave,
      palavras: chave.split(/[^a-z0-9]+/).filter(Boolean),
    };
  }),
);

export const MINIMO_CARACTERES_BUSCA = 2;

// Subcategorias cujo nome começa pelo termo (ou alguma palavra dele) vêm primeiro; depois, as que só contêm o termo.
export function buscarSubcategorias(termo: string, limite = 30): ResultadoBuscaCategoria[] {
  const busca = normalizarBusca(termo);
  if (busca.length < MINIMO_CARACTERES_BUSCA) {
    return [];
  }
  const inicio: ResultadoBuscaCategoria[] = [];
  const contem: ResultadoBuscaCategoria[] = [];
  for (const item of INDICE_SUBCATEGORIAS) {
    if (item.chave.startsWith(busca) || item.palavras.some((palavra) => palavra.startsWith(busca))) {
      inicio.push(item.resultado);
    } else if (item.chave.includes(busca)) {
      contem.push(item.resultado);
    }
  }
  return [...inicio, ...contem].slice(0, limite);
}

export function encontrarCategoria(id: string) {
  return CATEGORIAS.find((categoria) => categoria.id === id);
}

export function subcategoriaPertence(categoriaId: string, subcategoriaId: string) {
  return encontrarCategoria(categoriaId)?.subcategorias.some((sub) => sub.id === subcategoriaId) ?? false;
}

// Ordem do mais novo ao mais desgastado.
export const CONDICOES = [
  { id: 'novo', label: 'Novo', descricao: 'Novo, na embalagem original.' },
  { id: 'novo_sem_embalagem', label: 'Novo sem embalagem', descricao: 'Nunca usado, sem a embalagem.' },
  { id: 'nunca_utilizado', label: 'Nunca utilizado', descricao: 'Aberto ou testado, mas nunca usado de fato.' },
  { id: 'seminovo', label: 'Seminovo', descricao: 'Pouco uso, sem marcas visíveis.' },
  { id: 'usado_otimo', label: 'Usado – ótimo estado', descricao: 'Usado, funcionando perfeitamente, sinais mínimos.' },
  { id: 'usado_bom', label: 'Usado – bom estado', descricao: 'Funciona bem, com marcas de uso.' },
  { id: 'precisa_reparo', label: 'Usado – precisa de reparo', descricao: 'Com defeito ou peça faltando (descreva).' },
  { id: 'para_restauracao', label: 'Para restauração', descricao: 'Precisa de reforma para voltar a ser usado.' },
  { id: 'para_pecas', label: 'Para peças/componentes', descricao: 'Aproveitamento de partes; não funciona como um todo.' },
] as const;
export type CondicaoId = (typeof CONDICOES)[number]['id'];
export const CONDICAO_IDS = CONDICOES.map((condicao) => condicao.id) as [CondicaoId, ...CondicaoId[]];

// usaLocalizacao: a entrega parte do endereço do anunciante.
export const ENTREGAS = [
  { id: 'retirada', label: 'Retirada em mãos', descricao: 'A pessoa busca com você.', usaLocalizacao: true },
  { id: 'correios', label: 'Correios', descricao: 'Envio a partir do seu CEP.', usaLocalizacao: true },
  { id: 'transportadora', label: 'Transportadora', descricao: 'Coleta no seu endereço.', usaLocalizacao: true },
  { id: 'ponto_reuse', label: 'Ponto ReUse', descricao: 'Entrega e retirada num Ponto ReUse.', usaLocalizacao: false },
  { id: 'ponto_parceiro', label: 'Ponto parceiro', descricao: 'Entrega num ponto parceiro do ReUse.', usaLocalizacao: false },
  { id: 'entrega', label: 'Entrega pelo anunciante', descricao: 'Você leva até um local combinado.', usaLocalizacao: false },
] as const;
export type EntregaId = (typeof ENTREGAS)[number]['id'];
export const ENTREGA_IDS = ENTREGAS.map((entrega) => entrega.id) as [EntregaId, ...EntregaId[]];

// Tipo declarado pela própria conta; a verificação de organizações chega numa fase futura.
export const TIPOS_ANUNCIANTE = [
  { id: 'pessoa', label: 'Pessoa' },
  { id: 'empresa', label: 'Empresa' },
  { id: 'escola', label: 'Escola' },
  { id: 'faculdade', label: 'Faculdade' },
  { id: 'ong', label: 'ONG' },
  { id: 'condominio', label: 'Condomínio' },
  { id: 'associacao', label: 'Associação' },
  { id: 'loja_parceira', label: 'Loja parceira' },
  { id: 'ponto_reuse', label: 'Ponto ReUse' },
] as const;
export type TipoAnuncianteId = (typeof TIPOS_ANUNCIANTE)[number]['id'];
export const TIPO_ANUNCIANTE_IDS = TIPOS_ANUNCIANTE.map((tipo) => tipo.id) as [TipoAnuncianteId, ...TipoAnuncianteId[]];

export const COMPLEMENTO_TROCA = [
  { id: 'aceita', label: 'Aceita complemento financeiro' },
  { id: 'nao_aceita', label: 'Não aceita complemento' },
] as const;
export type ComplementoTrocaId = (typeof COMPLEMENTO_TROCA)[number]['id'];

export const DESTINOS_DOACAO = [
  { id: 'todos', label: 'Para qualquer pessoa ou organização' },
  { id: 'organizacoes', label: 'Para organizações' },
  { id: 'pessoas', label: 'Para pessoas' },
] as const;
export type DestinoDoacaoId = (typeof DESTINOS_DOACAO)[number]['id'];

// Faixas de preço do filtro (centavos). "Grátis" corresponde às doações.
export const FAIXAS_PRECO = [
  { id: 'gratis', label: 'Grátis', min: null, max: null },
  { id: 'ate_25', label: 'Até R$ 25', min: null, max: 2500 },
  { id: '25_50', label: 'R$ 25–50', min: 2500, max: 5000 },
  { id: '50_100', label: 'R$ 50–100', min: 5000, max: 10000 },
  { id: '100_250', label: 'R$ 100–250', min: 10000, max: 25000 },
  { id: '250_500', label: 'R$ 250–500', min: 25000, max: 50000 },
  { id: '500_1000', label: 'R$ 500–1.000', min: 50000, max: 100000 },
  { id: '1000_2500', label: 'R$ 1.000–2.500', min: 100000, max: 250000 },
  { id: '2500_5000', label: 'R$ 2.500–5.000', min: 250000, max: 500000 },
  { id: 'acima_5000', label: 'Acima de R$ 5.000', min: 500000, max: null },
  { id: 'personalizado', label: 'Personalizado', min: null, max: null },
] as const;
export type FaixaPrecoId = (typeof FAIXAS_PRECO)[number]['id'];

// Posições do slider de preço (em centavos). Passos menores nos valores baixos, onde está a maioria dos usados;
// a última posição significa "sem limite" (acima de R$ 5.000).
export const PASSOS_PRECO_CENTAVOS = [
  0, 1000, 2500, 5000, 7500, 10000, 15000, 20000, 30000, 40000, 50000, 75000, 100000, 150000, 200000, 250000, 300000, 400000,
  500000,
] as const;
export const POSICAO_SEM_LIMITE = PASSOS_PRECO_CENTAVOS.length;
export const TOTAL_POSICOES_PRECO = PASSOS_PRECO_CENTAVOS.length + 1;

// Posição do slider mais próxima de um valor (null = ponta correspondente do trilho).
export function posicaoDoPreco(centavos: number | null, ponta: 'inicio' | 'fim') {
  if (centavos === null) {
    return ponta === 'inicio' ? 0 : POSICAO_SEM_LIMITE;
  }
  let melhor = 0;
  PASSOS_PRECO_CENTAVOS.forEach((passo, indice) => {
    if (Math.abs(passo - centavos) < Math.abs(PASSOS_PRECO_CENTAVOS[melhor] - centavos)) melhor = indice;
  });
  return melhor;
}

export function precoDaPosicao(posicao: number) {
  return posicao >= POSICAO_SEM_LIMITE ? null : PASSOS_PRECO_CENTAVOS[posicao];
}

// Posições do slider de distância (km), de 0 (sem limite) a 1.000: passos curtos perto de casa, maiores para longe.
export const RAIOS_KM = [0, 1, 2, 5, 10, 15, 20, 30, 50, 75, 100, 150, 200, 300, 500, 750, 1000] as const;
