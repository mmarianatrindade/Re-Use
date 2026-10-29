import type { CategoriaId, CondicaoId, EntregaId, Modalidade, PlanoDestaqueId, StatusAnuncio } from '../schemas/anuncio';
import type { ComplementoTrocaId, DestinoDoacaoId, TipoAnuncianteId } from '../schemas/catalogo';

// Contratos de resposta da API ReUse, compartilhados entre o app e o Worker.

// Localização pública: CEP, bairro, cidade e UF. Rua, número e complemento nunca são públicos.
export interface LocalizacaoPublica {
  cep: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface Endereco extends LocalizacaoPublica {
  logradouro: string;
  numero: string;
  complemento: string;
}

export interface Selo {
  id: string;
  label: string;
  descricao: string;
}

export interface Avaliacao {
  id: string;
  nota: number;
  comentario: string | null;
  autorNome: string;
  criadoEm: string;
}

export interface Reputacao {
  media: number | null;
  total: number;
  ultimas: Avaliacao[];
}

export interface Impacto {
  vendas: number;
  trocas: number;
  doacoes: number;
  itensReutilizados: number;
}

export interface AnuncioResumo {
  id: string;
  titulo: string;
  modalidade: Modalidade;
  precoCentavos: number | null;
  capaUrl: string | null;
  status: StatusAnuncio;
  localizacao: LocalizacaoPublica | null;
  emDestaque: boolean;
}

// Card da vitrine (aba Anúncios).
export interface AnuncioVitrine {
  id: string;
  titulo: string;
  modalidade: Modalidade;
  categoria: CategoriaId;
  subcategoria: string;
  condicao: CondicaoId;
  precoCentavos: number | null;
  // Troca: valor estimado, só como referência.
  valorEstimadoCentavos: number | null;
  capaUrl: string | null;
  localizacao: LocalizacaoPublica | null;
  // Distância aproximada (km) até a localização informada no filtro; null sem localização.
  distanciaKm: number | null;
  // Destaque pago: a interface sempre identifica como "Anúncio em destaque".
  emDestaque: boolean;
  criadoEm: string;
}

export interface PaginaVitrine {
  itens: AnuncioVitrine[];
  proximaPagina: number | null;
}

export interface AnuncianteResumo {
  id: string;
  nomePublico: string;
  tipoConta: TipoAnuncianteId;
  fotoUrl: string | null;
  membroDesde: string;
  reputacaoMedia: number | null;
  totalAvaliacoes: number;
}

// Detalhe público do anúncio: sem rua, número ou dados privados do anunciante.
export interface AnuncioPublico {
  id: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaId;
  subcategoria: string;
  condicao: CondicaoId;
  modalidade: Modalidade;
  precoCentavos: number | null;
  aceitaOfertas: boolean;
  preferenciaTroca: string | null;
  valorEstimadoCentavos: number | null;
  trocaQualquerCategoria: boolean;
  trocaCategorias: CategoriaId[];
  trocaComplemento: ComplementoTrocaId | null;
  doacaoDestino: DestinoDoacaoId | null;
  doacaoImediata: boolean;
  entregas: EntregaId[];
  localizacao: LocalizacaoPublica | null;
  status: StatusAnuncio;
  imagens: string[];
  emDestaque: boolean;
  criadoEm: string;
  anunciante: AnuncianteResumo;
  // true quando quem vê é o próprio anunciante.
  proprio: boolean;
}

export interface UsuarioPublico {
  id: string;
  nomePublico: string;
  // Declarado pela conta; ainda sem verificação de organizações.
  tipoConta: TipoAnuncianteId;
  fotoUrl: string | null;
  descricao: string;
  localizacao: LocalizacaoPublica | null;
  membroDesde: string;
  emailConfirmado: boolean;
  reputacao: Reputacao;
  selos: Selo[];
  impacto: Impacto;
  anunciosAtivos: AnuncioResumo[];
}

// Dados da própria conta (GET /me). CPF volta sempre mascarado.
export interface UsuarioPrivado {
  id: string;
  email: string;
  emailConfirmado: boolean;
  // Configuração da API: quando false, publicar não depende de confirmar o e-mail.
  exigeConfirmacaoEmail: boolean;
  nomeCompleto: string;
  nomePublico: string;
  tipoConta: TipoAnuncianteId;
  fotoUrl: string | null;
  descricao: string;
  telefone: string;
  cpfMascarado: string;
  endereco: Endereco | null;
  criadoEm: string;
}

export interface SessaoResposta {
  token: string;
  expiraEm: string;
  usuario: UsuarioPrivado;
  // Só em ambiente de desenvolvimento, quando não há envio real de e-mail configurado.
  linkDev?: string;
}

export interface MensagemResposta {
  mensagem: string;
  linkDev?: string;
}

export interface ImagemAnuncio {
  chave: string;
  url: string;
}

export interface PedidoDestaque {
  id: string;
  plano: PlanoDestaqueId;
  status: 'aguardando_pagamento' | 'ativo' | 'cancelado';
  criadoEm: string;
}

export interface AnuncioProprio {
  id: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaId;
  subcategoria: string;
  condicao: CondicaoId;
  modalidade: Modalidade;
  precoCentavos: number | null;
  aceitaOfertas: boolean;
  preferenciaTroca: string | null;
  valorEstimadoCentavos: number | null;
  trocaQualquerCategoria: boolean;
  trocaCategorias: CategoriaId[];
  trocaComplemento: ComplementoTrocaId | null;
  doacaoDestino: DestinoDoacaoId | null;
  doacaoImediata: boolean;
  entregas: EntregaId[];
  localizacao: LocalizacaoPublica | null;
  status: StatusAnuncio;
  imagens: ImagemAnuncio[];
  visualizacoes: number;
  contatos: number;
  destaqueAte: string | null;
  pedidoDestaque: PedidoDestaque | null;
  // Um anúncio que já foi concluído não pode ser excluído nem reaberto.
  jaConcluido: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface UploadResposta {
  chave: string;
  url: string;
}

// Busca de endereço (Google Places via API ReUse).
export interface SugestaoEndereco {
  id: string;
  texto: string;
}

export interface EnderecoSugerido {
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  latitude: number | null;
  longitude: number | null;
}

// Números reais da plataforma (seção de impacto da Home).
export interface EstatisticasPlataforma {
  anunciosDisponiveis: number;
  itensReutilizados: number;
  doacoesConcluidas: number;
  participantes: number;
  // Contas com tipo diferente de "pessoa" (declarado).
  organizacoes: number;
  atualizadoEm: string;
}

export interface ErroResposta {
  erro: string;
  codigo: string;
  campos?: Record<string, string>;
}
