import { z } from 'zod';
import {
  IDADE_MINIMA,
  calcularIdade,
  converterDataBrParaIso,
  extrairDigitos,
  validarCelular,
  validarCep,
  validarCpf,
} from './comum';
import { TIPO_ANUNCIANTE_IDS } from './catalogo';

// Schemas usados pelo app (validação no envio) e pela API (validação obrigatória no servidor).

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Informe seu e-mail.')
  .pipe(z.email('E-mail inválido.'));

export const senhaSchema = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .max(72, 'A senha pode ter no máximo 72 caracteres.')
  .regex(/[A-Za-z]/, 'Use pelo menos uma letra.')
  .regex(/\d/, 'Use pelo menos um número.');

const cpfSchema = z
  .string()
  .min(1, 'Informe seu CPF.')
  .refine(validarCpf, 'CPF inválido.')
  .transform(extrairDigitos);

const telefoneSchema = z
  .string()
  .min(1, 'Informe seu celular.')
  .refine(validarCelular, 'Informe um celular com DDD, ex.: (11) 91234-5678.')
  .transform(extrairDigitos);

const dataNascimentoSchema = z
  .string()
  .min(1, 'Informe sua data de nascimento.')
  .refine((valor) => converterDataBrParaIso(valor) !== null, 'Data inválida. Use DD/MM/AAAA.')
  .refine((valor) => {
    const iso = converterDataBrParaIso(valor);
    return iso !== null && calcularIdade(iso) >= IDADE_MINIMA;
  }, `O ReUse é destinado a maiores de ${IDADE_MINIMA} anos.`)
  .refine((valor) => {
    const iso = converterDataBrParaIso(valor);
    return iso !== null && calcularIdade(iso) <= 120;
  }, 'Confira o ano de nascimento.');

export const enderecoSchema = z.object({
  cep: z.string().refine(validarCep, 'CEP inválido.').transform(extrairDigitos),
  logradouro: z.string().trim().min(2, 'Informe a rua.').max(120),
  numero: z.string().trim().min(1, 'Informe o número.').max(10, 'Número muito longo.'),
  complemento: z.string().trim().max(60, 'Complemento muito longo.').optional().default(''),
  bairro: z.string().trim().min(2, 'Informe o bairro.').max(80),
  cidade: z.string().trim().min(2, 'Informe a cidade.').max(80),
  uf: z.enum(UFS, 'Selecione o estado.'),
  // Centro aproximado do CEP, consultado pelo aparelho (limites aproximados do Brasil). Opcional: a API tenta obter se faltar.
  latitude: z.number().min(-34).max(6).nullable().optional(),
  longitude: z.number().min(-74).max(-28).nullable().optional(),
});

const nomeSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu nome completo.')
  .max(100, 'Nome muito longo.')
  .refine((valor) => valor.split(/\s+/).length >= 2, 'Informe nome e sobrenome.');

// Corpo de POST /auth/cadastro.
export const cadastroApiSchema = z.object({
  nome: nomeSchema,
  email: emailSchema,
  senha: senhaSchema,
  cpf: cpfSchema,
  telefone: telefoneSchema,
  dataNascimento: dataNascimentoSchema,
  endereco: enderecoSchema,
  // Tipo declarado pela conta (padrão: pessoa). A verificação de organizações vem numa fase futura.
  tipoConta: z.enum(TIPO_ANUNCIANTE_IDS, 'Tipo de conta inválido.').optional().default('pessoa'),
  aceiteTermos: z.literal(true, 'É preciso aceitar os Termos de Uso e a Política de Privacidade.'),
  termosVersao: z.string().min(1),
});

// Formulário de cadastro no app: acrescenta confirmação de senha e a foto do rosto.
export const cadastroFormSchema = z
  .object({
    nome: nomeSchema,
    email: emailSchema,
    senha: senhaSchema,
    confirmarSenha: z.string().min(1, 'Confirme sua senha.'),
    cpf: z.string().min(1, 'Informe seu CPF.').refine(validarCpf, 'CPF inválido.'),
    telefone: z
      .string()
      .min(1, 'Informe seu celular.')
      .refine(validarCelular, 'Informe um celular com DDD, ex.: (11) 91234-5678.'),
    dataNascimento: dataNascimentoSchema,
    cep: z.string().refine(validarCep, 'CEP inválido.'),
    logradouro: z.string().trim().min(2, 'Informe a rua.').max(120),
    numero: z.string().trim().min(1, 'Informe o número.').max(10, 'Número muito longo.'),
    complemento: z.string().trim().max(60, 'Complemento muito longo.'),
    bairro: z.string().trim().min(2, 'Informe o bairro.').max(80),
    cidade: z.string().trim().min(2, 'Informe a cidade.').max(80),
    uf: z.string().refine((valor) => (UFS as readonly string[]).includes(valor), 'Selecione o estado.'),
    fotoUri: z.string().min(1, 'Tire uma foto do seu rosto.'),
    tipoConta: z.string().refine((valor) => (TIPO_ANUNCIANTE_IDS as readonly string[]).includes(valor), 'Escolha como você anuncia.'),
    aceiteTermos: z.boolean().refine((valor) => valor, 'É preciso aceitar os Termos de Uso e a Política de Privacidade.'),
  })
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    message: 'As senhas não conferem.',
    path: ['confirmarSenha'],
  });

export type CadastroFormDados = z.input<typeof cadastroFormSchema>;
export type CadastroApiDados = z.input<typeof cadastroApiSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  senha: z.string().min(1, 'Informe sua senha.'),
});

export type LoginDados = z.input<typeof loginSchema>;

export const recuperarSenhaSchema = z.object({ email: emailSchema });

export type RecuperarSenhaDados = z.input<typeof recuperarSenhaSchema>;

export const redefinirSenhaApiSchema = z.object({
  token: z.string().min(20, 'Link inválido.'),
  senha: senhaSchema,
});

export const redefinirSenhaFormSchema = z
  .object({
    senha: senhaSchema,
    confirmarSenha: z.string().min(1, 'Confirme sua senha.'),
  })
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    message: 'As senhas não conferem.',
    path: ['confirmarSenha'],
  });

export type RedefinirSenhaFormDados = z.input<typeof redefinirSenhaFormSchema>;

export const tokenSchema = z.object({ token: z.string().min(20, 'Link inválido.') });

// Corpo de PATCH /me: todos os campos são opcionais.
export const atualizarPerfilApiSchema = z.object({
  nomePublico: z.string().trim().min(2, 'Informe um nome público.').max(40, 'Use até 40 caracteres.').optional(),
  descricao: z.string().trim().max(400, 'Use até 400 caracteres.').optional(),
  telefone: telefoneSchema.optional(),
  fotoChave: z.string().min(1).max(200).optional(),
  endereco: enderecoSchema.optional(),
  tipoConta: z.enum(TIPO_ANUNCIANTE_IDS, 'Tipo de conta inválido.').optional(),
});

export const editarPerfilFormSchema = z.object({
  tipoConta: z.string().refine((valor) => (TIPO_ANUNCIANTE_IDS as readonly string[]).includes(valor), 'Escolha como você anuncia.'),
  nomePublico: z.string().trim().min(2, 'Informe um nome público.').max(40, 'Use até 40 caracteres.'),
  descricao: z.string().trim().max(400, 'Use até 400 caracteres.'),
  telefone: z
    .string()
    .min(1, 'Informe seu celular.')
    .refine(validarCelular, 'Informe um celular com DDD, ex.: (11) 91234-5678.'),
  cep: z.string().refine(validarCep, 'CEP inválido.'),
  logradouro: z.string().trim().min(2, 'Informe a rua.').max(120),
  numero: z.string().trim().min(1, 'Informe o número.').max(10, 'Número muito longo.'),
  complemento: z.string().trim().max(60, 'Complemento muito longo.'),
  bairro: z.string().trim().min(2, 'Informe o bairro.').max(80),
  cidade: z.string().trim().min(2, 'Informe a cidade.').max(80),
  uf: z.string().refine((valor) => (UFS as readonly string[]).includes(valor), 'Selecione o estado.'),
});

export type EditarPerfilFormDados = z.input<typeof editarPerfilFormSchema>;
