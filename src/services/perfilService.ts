import { extrairDigitos } from '../schemas/comum';
import type { EditarPerfilFormDados } from '../schemas/usuario';
import type { UsuarioPrivado, UsuarioPublico } from '../types/api';
import { requisitar } from './api';
import { buscarCoordenadasPorCep } from './cepService';

export function buscarMinhaConta() {
  return requisitar<UsuarioPrivado>('/me');
}

export function atualizarFotoPerfil(fotoChave: string) {
  return requisitar<UsuarioPrivado>('/me', { metodo: 'PATCH', corpo: { fotoChave } });
}

export async function atualizarPerfil(dados: EditarPerfilFormDados, fotoChave?: string) {
  const coordenadas = await buscarCoordenadasPorCep(dados.cep);
  return requisitar<UsuarioPrivado>('/me', {
    metodo: 'PATCH',
    corpo: {
      tipoConta: dados.tipoConta,
      nomePublico: dados.nomePublico,
      descricao: dados.descricao,
      telefone: extrairDigitos(dados.telefone),
      fotoChave,
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
    },
  });
}

export function buscarPerfilPublico(userId: string) {
  return requisitar<UsuarioPublico>(`/usuarios/${encodeURIComponent(userId)}`);
}
