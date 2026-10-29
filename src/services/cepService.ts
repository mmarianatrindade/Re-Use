import { extrairDigitos } from '../schemas/comum';
import type { EnderecoSugerido, SugestaoEndereco } from '../types/api';
import { requisitar } from './api';

export interface EnderecoCep {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

interface RespostaViaCep {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
}

// Preenche rua, bairro, cidade e UF a partir do CEP (ViaCEP, serviço público e gratuito).
// Retorna null se o CEP não existir ou o serviço não responder — o usuário pode preencher à mão.
export async function buscarEnderecoPorCep(cep: string): Promise<EnderecoCep | null> {
  const digitos = extrairDigitos(cep);
  if (digitos.length !== 8) {
    return null;
  }

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
    if (!resposta.ok) {
      return null;
    }
    const dados = (await resposta.json()) as RespostaViaCep;
    if (dados.erro) {
      return null;
    }
    return {
      logradouro: dados.logradouro ?? '',
      bairro: dados.bairro ?? '',
      cidade: dados.localidade ?? '',
      uf: dados.uf ?? '',
    };
  } catch {
    return null;
  }
}

export interface CoordenadasCep {
  latitude: number;
  longitude: number;
}

// Centro aproximado do CEP (AwesomeAPI, gratuita). Consultado pelo aparelho para o filtro por distância;
// a API arredonda e nunca publica essa coordenada. Falha → null (a API tenta outras fontes).
export async function buscarCoordenadasPorCep(cep: string): Promise<CoordenadasCep | null> {
  const digitos = extrairDigitos(cep);
  if (digitos.length !== 8) {
    return null;
  }
  try {
    const resposta = await fetch(`https://cep.awesomeapi.com.br/json/${digitos}`);
    if (!resposta.ok) {
      return null;
    }
    const dados = (await resposta.json()) as { lat?: string; lng?: string };
    const latitude = Number(dados.lat);
    const longitude = Number(dados.lng);
    return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude !== 0 ? { latitude, longitude } : null;
  } catch {
    return null;
  }
}

// Identificador da "sessão" de busca: agrupa digitação + escolha numa única cobrança do Google.
export function gerarSessaoBuscaEndereco() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (caractere) => {
    const aleatorio = Math.floor(Math.random() * 16);
    return (caractere === 'x' ? aleatorio : (aleatorio & 0x3) | 0x8).toString(16);
  });
}

// Sugestões de endereço enquanto a pessoa digita (Google Places, pela API ReUse).
export async function buscarSugestoesEndereco(texto: string, sessao: string) {
  const resposta = await requisitar<{ sugestoes: SugestaoEndereco[] }>(
    `/enderecos/sugestoes?texto=${encodeURIComponent(texto)}&sessao=${sessao}`,
    { token: null },
  );
  return resposta.sugestoes;
}

// Endereço completo do lugar escolhido (CEP, rua, número, bairro, cidade, UF e coordenada aproximada).
export function buscarEnderecoSugerido(lugarId: string, sessao: string) {
  return requisitar<EnderecoSugerido>(`/enderecos/lugar/${encodeURIComponent(lugarId)}?sessao=${sessao}`, { token: null });
}
