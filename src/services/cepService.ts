import { extrairDigitos } from '../schemas/comum';
import type { EnderecoSugerido, SugestaoEndereco } from '../types/api';
import { requisitar } from './api';
import { lerCache, salvarCache, TTL_CACHE } from './cache';
import { capturarContaLocal } from './contaLocal';

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
  const conta = capturarContaLocal();
  const digitos = extrairDigitos(cep);
  if (digitos.length !== 8) {
    return null;
  }

  // CEP já consultado: responde do cache (vale até sem internet) e poupa a chamada ao ViaCEP.
  const salvo = await lerCache<EnderecoCep>(`cep/${digitos}`, TTL_CACHE.cep);
  if (salvo) {
    return salvo.dados;
  }

  try {
    const dados = await consultarCep<RespostaViaCep>(`https://viacep.com.br/ws/${digitos}/json/`);
    if (dados.erro) {
      return null;
    }
    const endereco: EnderecoCep = {
      logradouro: dados.logradouro ?? '',
      bairro: dados.bairro ?? '',
      cidade: dados.localidade ?? '',
      uf: dados.uf ?? '',
    };
    void salvarCache(`cep/${digitos}`, endereco, conta);
    return endereco;
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
    const dados = await consultarCep<{ lat?: string; lng?: string }>(`https://cep.awesomeapi.com.br/json/${digitos}`);
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

async function consultarCep<T>(url: string): Promise<T> {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), 5000);
  try {
    const resposta = await fetch(url, { signal: controlador.signal });
    if (!resposta.ok) throw new Error('Consulta de CEP indisponível.');
    return await resposta.json() as T;
  } finally {
    clearTimeout(temporizador);
  }
}
