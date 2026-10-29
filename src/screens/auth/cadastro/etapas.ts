import type { CadastroFormDados } from '../../../schemas/usuario';

export interface EtapaCadastro {
  titulo: string;
  campos: (keyof CadastroFormDados)[];
}

// Cada etapa valida só os seus campos antes de avançar.
export const ETAPAS_CADASTRO: EtapaCadastro[] = [
  { titulo: 'Crie seu acesso', campos: ['nome', 'tipoConta', 'email', 'senha', 'confirmarSenha'] },
  { titulo: 'Dados de segurança', campos: ['cpf', 'telefone', 'dataNascimento'] },
  { titulo: 'Onde você está', campos: ['cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf'] },
  { titulo: 'Foto do seu rosto', campos: ['fotoUri'] },
  { titulo: 'Revise e aceite', campos: ['aceiteTermos'] },
];

export function encontrarEtapaDoCampo(campo: string) {
  const indice = ETAPAS_CADASTRO.findIndex((etapa) => (etapa.campos as string[]).includes(campo));
  return indice === -1 ? 0 : indice;
}

export const VALORES_INICIAIS_CADASTRO: CadastroFormDados = {
  nome: '',
  email: '',
  senha: '',
  confirmarSenha: '',
  cpf: '',
  telefone: '',
  dataNascimento: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  fotoUri: '',
  tipoConta: 'pessoa',
  aceiteTermos: false,
};
