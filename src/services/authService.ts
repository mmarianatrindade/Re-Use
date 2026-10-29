import { TERMOS_VERSAO, extrairDigitos } from '../schemas/comum';
import type { CadastroFormDados, LoginDados } from '../schemas/usuario';
import type { MensagemResposta, SessaoResposta } from '../types/api';
import { requisitar } from './api';
import { buscarCoordenadasPorCep } from './cepService';

export async function cadastrarUsuario(dados: CadastroFormDados) {
  const coordenadas = await buscarCoordenadasPorCep(dados.cep);
  return requisitar<SessaoResposta>('/auth/cadastro', {
    metodo: 'POST',
    token: null,
    corpo: {
      nome: dados.nome,
      email: dados.email,
      senha: dados.senha,
      cpf: extrairDigitos(dados.cpf),
      telefone: extrairDigitos(dados.telefone),
      dataNascimento: dados.dataNascimento,
      endereco: {
        cep: extrairDigitos(dados.cep),
        logradouro: dados.logradouro,
        numero: dados.numero,
        complemento: dados.complemento,
        bairro: dados.bairro,
        cidade: dados.cidade,
        uf: dados.uf,
        latitude: coordenadas?.latitude ?? null,
        longitude: coordenadas?.longitude ?? null,
      },
      tipoConta: dados.tipoConta,
      aceiteTermos: dados.aceiteTermos,
      termosVersao: TERMOS_VERSAO,
    },
  });
}

export function entrarComSenha(dados: LoginDados) {
  return requisitar<SessaoResposta>('/auth/login', { metodo: 'POST', token: null, corpo: dados });
}

export function renovarToken(token: string) {
  return requisitar<SessaoResposta>('/auth/renovar', { metodo: 'POST', token });
}

export function encerrarSessao(token: string) {
  return requisitar<MensagemResposta>('/auth/sair', { metodo: 'POST', token });
}

export function ativarEmail(token: string) {
  return requisitar<MensagemResposta>('/auth/ativar', { metodo: 'POST', token: null, corpo: { token } });
}

export function reenviarEmailAtivacao() {
  return requisitar<MensagemResposta>('/auth/reenviar-ativacao', { metodo: 'POST' });
}

export function solicitarRecuperacaoSenha(email: string) {
  return requisitar<MensagemResposta>('/auth/recuperar', { metodo: 'POST', token: null, corpo: { email } });
}

export function redefinirSenha(token: string, senha: string) {
  return requisitar<MensagemResposta>('/auth/redefinir', { metodo: 'POST', token: null, corpo: { token, senha } });
}
