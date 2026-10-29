import { z } from 'zod';
import {
  CATEGORIA_IDS,
  CONDICAO_IDS,
  ENTREGAS,
  ENTREGA_IDS,
  subcategoriaPertence,
  type CondicaoId,
} from './catalogo';

// Regras de anúncio compartilhadas entre o app e a API.

export const MAX_FOTOS_ANUNCIO = 5;
export const PRECO_MAXIMO_CENTAVOS = 100_000_000; // R$ 1.000.000,00

export const MODALIDADES = ['venda', 'troca', 'doacao'] as const;
export type Modalidade = (typeof MODALIDADES)[number];

// Categorias, estados e formas de entrega ficam no catálogo (schemas/catalogo.ts).
export type CategoriaId = string;
export type { CondicaoId, EntregaId, TipoAnuncianteId, ComplementoTrocaId, DestinoDoacaoId } from './catalogo';
export { CATEGORIAS, CONDICOES, ENTREGAS } from './catalogo';

// Retirada, Correios e transportadora partem do endereço do anunciante: o anúncio usa a localização do perfil.
export function exigeLocalizacao(entregas: readonly string[]) {
  return ENTREGAS.some((entrega) => entrega.usaLocalizacao && entregas.includes(entrega.id));
}

export const STATUS_ANUNCIO = [
  { id: 'disponivel', label: 'Disponível' },
  { id: 'reservado', label: 'Reservado' },
  { id: 'negociando', label: 'Negociando' },
  { id: 'concluido', label: 'Concluído' },
  { id: 'arquivado', label: 'Arquivado' },
] as const;
export type StatusAnuncio = (typeof STATUS_ANUNCIO)[number]['id'];
const STATUS_IDS = STATUS_ANUNCIO.map((status) => status.id) as [StatusAnuncio, ...StatusAnuncio[]];

// Mudanças de status que o próprio anunciante pode fazer. Arquivado volta a disponível
// só se o item nunca foi concluído (a API verifica); concluído pode apenas ser arquivado.
export const TRANSICOES_STATUS: Record<StatusAnuncio, StatusAnuncio[]> = {
  disponivel: ['reservado', 'negociando', 'arquivado'],
  reservado: ['disponivel', 'negociando', 'concluido'],
  negociando: ['disponivel', 'reservado', 'concluido'],
  concluido: ['arquivado'],
  arquivado: ['disponivel'],
};

// Com negociação em andamento ou concluída, os dados do anúncio ficam congelados.
export const STATUS_EDITAVEIS: StatusAnuncio[] = ['disponivel', 'arquivado'];

// Excluir só é permitido para anúncios sem histórico de conclusão; nos demais casos, arquivar.
export const STATUS_EXCLUIVEIS: StatusAnuncio[] = ['disponivel', 'arquivado'];

export const PLANOS_DESTAQUE = [
  { id: 'destaque_7', dias: 7, precoCentavos: 990, label: '7 dias' },
  { id: 'destaque_15', dias: 15, precoCentavos: 1790, label: '15 dias' },
  { id: 'destaque_30', dias: 30, precoCentavos: 2990, label: '30 dias' },
] as const;
export type PlanoDestaqueId = (typeof PLANOS_DESTAQUE)[number]['id'];
const PLANO_IDS = PLANOS_DESTAQUE.map((plano) => plano.id) as [PlanoDestaqueId, ...PlanoDestaqueId[]];

const tituloSchema = z.string().trim().min(5, 'Use pelo menos 5 caracteres.').max(80, 'Use até 80 caracteres.');
const descricaoSchema = z
  .string()
  .trim()
  .min(20, 'Descreva o item com pelo menos 20 caracteres.')
  .max(2000, 'Use até 2000 caracteres.');

// Corpo de POST /anuncios e PUT /anuncios/:id.
export const anuncioApiSchema = z
  .object({
    titulo: tituloSchema,
    descricao: descricaoSchema,
    categoria: z.string().refine((valor) => CATEGORIA_IDS.includes(valor), 'Selecione uma categoria.'),
    subcategoria: z.string().min(1, 'Selecione a subcategoria.'),
    condicao: z.enum(CONDICAO_IDS, 'Selecione o estado do produto.'),
    modalidade: z.enum(MODALIDADES, 'Selecione a modalidade.'),
    precoCentavos: z.number().int().positive().max(PRECO_MAXIMO_CENTAVOS).nullable(),
    aceitaOfertas: z.boolean(),
    preferenciaTroca: z.string().trim().max(300, 'Use até 300 caracteres.').nullable(),
    // Troca: valor estimado só como referência (não é moeda nem crédito).
    valorEstimadoCentavos: z.number().int().positive().max(PRECO_MAXIMO_CENTAVOS).nullable(),
    trocaQualquerCategoria: z.boolean(),
    trocaCategorias: z.array(z.string()).max(CATEGORIA_IDS.length),
    trocaComplemento: z.enum(['aceita', 'nao_aceita']).nullable(),
    // Doação: para quem e se já pode ser retirada.
    doacaoDestino: z.enum(['todos', 'organizacoes', 'pessoas']).nullable(),
    doacaoImediata: z.boolean(),
    entregas: z.array(z.enum(ENTREGA_IDS)).min(1, 'Escolha pelo menos uma forma de entrega.'),
    imagens: z
      .array(z.string().min(1).max(200))
      .min(1, 'Adicione pelo menos uma foto.')
      .max(MAX_FOTOS_ANUNCIO, `Use até ${MAX_FOTOS_ANUNCIO} fotos.`),
  })
  .superRefine((dados, contexto) => {
    if (dados.modalidade === 'venda' && dados.precoCentavos === null) {
      contexto.addIssue({ code: 'custom', path: ['precoCentavos'], message: 'Informe o preço.' });
    }
    if (dados.modalidade !== 'venda' && dados.precoCentavos !== null) {
      contexto.addIssue({ code: 'custom', path: ['precoCentavos'], message: 'Preço é usado apenas em vendas.' });
    }
    if (dados.modalidade === 'troca' && (!dados.preferenciaTroca || dados.preferenciaTroca.length < 3)) {
      contexto.addIssue({ code: 'custom', path: ['preferenciaTroca'], message: 'Conte o que você aceita em troca.' });
    }
    if (new Set(dados.entregas).size !== dados.entregas.length) {
      contexto.addIssue({ code: 'custom', path: ['entregas'], message: 'Formas de entrega repetidas.' });
    }
    if (!subcategoriaPertence(dados.categoria, dados.subcategoria)) {
      contexto.addIssue({ code: 'custom', path: ['subcategoria'], message: 'Selecione a subcategoria.' });
    }
    if (dados.trocaCategorias.some((categoria) => !CATEGORIA_IDS.includes(categoria))) {
      contexto.addIssue({ code: 'custom', path: ['trocaCategorias'], message: 'Categoria desejada inválida.' });
    }
    if (dados.modalidade === 'troca' && dados.trocaComplemento === null) {
      contexto.addIssue({ code: 'custom', path: ['trocaComplemento'], message: 'Diga se aceita complemento financeiro.' });
    }
    if (dados.modalidade === 'doacao' && dados.doacaoDestino === null) {
      contexto.addIssue({ code: 'custom', path: ['doacaoDestino'], message: 'Escolha para quem é a doação.' });
    }
  });

export type AnuncioApiDados = z.input<typeof anuncioApiSchema>;

// Converte "1.234,56" em centavos; retorna null se não for um valor válido.
export function converterPrecoParaCentavos(texto: string) {
  const limpo = texto.replace(/[^\d,]/g, '');
  if (!limpo) {
    return null;
  }
  const [inteiros, decimais = ''] = limpo.split(',');
  const centavos = Number(inteiros || '0') * 100 + Number(decimais.padEnd(2, '0').slice(0, 2));
  return Number.isFinite(centavos) && centavos > 0 ? centavos : null;
}

export const fotoFormSchema = z.object({
  // URI local (câmera/galeria) ou URL pública de uma foto já enviada.
  uri: z.string().min(1),
  // Chave no armazenamento da API quando a foto já foi enviada.
  chave: z.string().nullable(),
});

export type FotoForm = z.infer<typeof fotoFormSchema>;

export const anuncioFormSchema = z
  .object({
    fotos: z
      .array(fotoFormSchema)
      .min(1, 'Adicione pelo menos uma foto.')
      .max(MAX_FOTOS_ANUNCIO, `Use até ${MAX_FOTOS_ANUNCIO} fotos.`),
    titulo: tituloSchema,
    descricao: descricaoSchema,
    categoria: z.string().refine((valor) => CATEGORIA_IDS.includes(valor), 'Selecione uma categoria.'),
    subcategoria: z.string().min(1, 'Selecione a subcategoria.'),
    condicao: z.string().refine((valor) => CONDICAO_IDS.includes(valor as CondicaoId), 'Selecione o estado do produto.'),
    modalidade: z.string().refine((valor) => MODALIDADES.includes(valor as Modalidade), 'Selecione a modalidade.'),
    preco: z.string(),
    aceitaOfertas: z.boolean(),
    preferenciaTroca: z.string().trim().max(300, 'Use até 300 caracteres.'),
    valorEstimado: z.string(),
    trocaQualquerCategoria: z.boolean(),
    trocaCategorias: z.array(z.string()),
    trocaComplemento: z.string(),
    doacaoDestino: z.string(),
    doacaoImediata: z.boolean(),
    entregas: z.array(z.string()).min(1, 'Escolha pelo menos uma forma de entrega.'),
  })
  .superRefine((dados, contexto) => {
    if (dados.modalidade === 'venda') {
      const centavos = converterPrecoParaCentavos(dados.preco);
      if (centavos === null) {
        contexto.addIssue({ code: 'custom', path: ['preco'], message: 'Informe o preço.' });
      } else if (centavos > PRECO_MAXIMO_CENTAVOS) {
        contexto.addIssue({ code: 'custom', path: ['preco'], message: 'Preço acima do limite permitido.' });
      }
    }
    if (dados.modalidade === 'troca' && dados.preferenciaTroca.trim().length < 3) {
      contexto.addIssue({ code: 'custom', path: ['preferenciaTroca'], message: 'Conte o que você aceita em troca.' });
    }
    if (dados.categoria && dados.subcategoria && !subcategoriaPertence(dados.categoria, dados.subcategoria)) {
      contexto.addIssue({ code: 'custom', path: ['subcategoria'], message: 'Selecione a subcategoria.' });
    }
    if (dados.modalidade === 'troca' && !['aceita', 'nao_aceita'].includes(dados.trocaComplemento)) {
      contexto.addIssue({ code: 'custom', path: ['trocaComplemento'], message: 'Diga se aceita complemento financeiro.' });
    }
    if (dados.modalidade === 'doacao' && !['todos', 'organizacoes', 'pessoas'].includes(dados.doacaoDestino)) {
      contexto.addIssue({ code: 'custom', path: ['doacaoDestino'], message: 'Escolha para quem é a doação.' });
    }
  });

export type AnuncioFormDados = z.input<typeof anuncioFormSchema>;

export const alterarStatusApiSchema = z.object({ status: z.enum(STATUS_IDS, 'Status inválido.') });

export const destaqueApiSchema = z.object({ plano: z.enum(PLANO_IDS, 'Plano inválido.') });

export const MOTIVOS_DENUNCIA = [
  { id: 'proibido', label: 'Item proibido ou perigoso' },
  { id: 'enganoso', label: 'Fotos ou descrição enganosas' },
  { id: 'golpe', label: 'Suspeita de golpe' },
  { id: 'dados_pessoais', label: 'Expõe dados pessoais' },
  { id: 'outro', label: 'Outro motivo' },
] as const;
const MOTIVO_IDS = MOTIVOS_DENUNCIA.map((motivo) => motivo.id) as [string, ...string[]];

export const denunciaApiSchema = z.object({
  motivo: z.enum(MOTIVO_IDS, 'Escolha um motivo.'),
  detalhes: z.string().trim().max(500, 'Use até 500 caracteres.').optional().default(''),
});
