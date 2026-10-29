import type { TipoTag } from '../constants/images';
import { colors } from '../constants/colors';

// Conteúdo fixo da Home. Anúncios e números de impacto vêm da API.

export interface CartaoConteudo {
  icon: string;
  title: string;
  text: string;
}

export type ModalidadeId = 'venda' | 'troca' | 'doacao';

// Conteúdo exibido dentro do componente TagIcon: símbolo ou texto curto.
export interface ConteudoTag {
  icon?: string;
  label?: string;
  tipo?: TipoTag;
}

export interface Modalidade {
  id: ModalidadeId;
  title: string;
  label: string;
  tag: ConteudoTag;
  color: string;
  summary: string;
  details: string[];
  cta: string;
}



export type SectionId = 'modalidades' | 'explorar' | 'impacto' | 'como-funciona';

export const navSections: { id: SectionId; label: string }[] = [
  { id: 'modalidades', label: 'Modalidades' },
  { id: 'explorar', label: 'Explorar' },
  { id: 'impacto', label: 'Impacto' },
  { id: 'como-funciona', label: 'Como funciona' },
];


// Cartões da seção de modalidades: as três formas de anunciar e o "Reutilizar", lado de quem procura.
export type CartaoModalidadeId = ModalidadeId | 'reutilizar';

export interface CartaoModalidade extends Omit<Modalidade, 'id'> {
  id: CartaoModalidadeId;
}

export const modalities: Modalidade[] = [
  {
    id: 'venda',
    title: 'Vender',
    label: 'Venda',
    tag: { label: 'R$', tipo: 'venda' },
    color: colors.sale,
    summary: 'O que perdeu espaço na sua casa ainda tem valor para alguém.',
    details: [
      'A bicicleta que ficou pequena vira o primeiro passeio de outra criança.',
      'Você decide o preço e conversa direto com quem se interessou.',
      'O dinheiro fica com você, e o objeto continua sendo usado.',
    ],
    cta: 'Ver itens à venda',
  },
  {
    id: 'troca',
    title: 'Trocar',
    label: 'Troca',
    tag: { icon: '⇄', tipo: 'troca' },
    color: colors.trade,
    summary: 'O que está parado com você pode ser exatamente o que alguém procura. E o contrário também.',
    details: [
      'O violão esquecido no armário pode virar a furadeira que faltava.',
      'Troque um item por outro ou junte vários na mesma proposta.',
      'Ninguém precisa comprar nada novo, e dois objetos voltam a ser úteis.',
    ],
    cta: 'Ver itens para troca',
  },
  {
    id: 'doacao',
    title: 'Doar',
    label: 'Doação',
    tag: { icon: '♥', tipo: 'doacao' },
    color: colors.donation,
    summary: 'Tem coisa que não precisa de preço, só de um novo endereço.',
    details: [
      'Roupas, livros e móveis chegam a pessoas e organizações perto de você.',
      'Você escolhe para quem doar e combina a entrega pelo app.',
      'Quem recebe não paga nada, e o objeto ganha uma segunda vida.',
    ],
    cta: 'Ver doações',
  },
];

export const cartaoReutilizar: CartaoModalidade = {
  id: 'reutilizar',
  title: 'Reutilizar',
  label: 'Reutilizar',
  tag: { icon: '♻' },
  color: colors.primary,
  summary: 'Antes de comprar novo, veja o que já existe perto de você.',
  details: [
    'Móveis, eletrônicos, roupas e livros em bom estado, cada um com a sua história.',
    'Quem anuncia tem perfil com foto e reputação à vista.',
    'Escolher um usado é o jeito mais simples de gerar menos lixo.',
  ],
  cta: 'Explorar anúncios',
};

export const cartoesModalidade: CartaoModalidade[] = [...modalities, cartaoReutilizar];




export const steps: CartaoConteudo[] = [
  {
    icon: '1',
    title: 'Publique',
    text: 'Tire uma foto, conte a história do objeto e escolha se ele vai ser vendido, trocado ou doado.',
  },
  {
    icon: '2',
    title: 'Converse',
    text: 'Quem se interessou fala com você pelo app, e vocês combinam tudo por ali.',
  },
  {
    icon: '3',
    title: 'Entregue',
    text: 'Escolham juntos o jeito de entregar: retirada, envio ou um ponto parceiro perto de casa.',
  },
  {
    icon: '4',
    title: 'Conclua',
    text: 'O objeto chega a quem vai usar, e começa uma nova história.',
  },
];
