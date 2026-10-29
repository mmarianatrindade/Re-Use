import { atualizarPerfilApiSchema } from '../../../src/schemas/usuario';
import type { Env } from '../env';
import { ErroApi, agoraIso, lerCorpo, responderJson } from '../http';
import { buscarUsuario, carregarUsuarioPublico, mapearUsuarioPrivado } from '../mapeadores';
import { resolverCoordenadas } from '../geo';
import { exigirSessao } from '../sessao';
import { arquivoPertenceAoUsuario, removerArquivos } from './arquivos';

export async function obterMinhaConta(request: Request, env: Env, origem: string) {
  const sessao = await exigirSessao(env, request);
  const usuario = await buscarUsuario(env, sessao.userId);
  if (!usuario) {
    throw new ErroApi(401, 'SESSAO_INVALIDA', 'Sua sessão expirou. Entre novamente.');
  }
  return responderJson(mapearUsuarioPrivado(usuario, origem, env));
}

export async function atualizarMinhaConta(request: Request, env: Env, origem: string) {
  const sessao = await exigirSessao(env, request);
  const dados = await lerCorpo(request, atualizarPerfilApiSchema);
  const usuario = await buscarUsuario(env, sessao.userId);
  if (!usuario) {
    throw new ErroApi(401, 'SESSAO_INVALIDA', 'Sua sessão expirou. Entre novamente.');
  }

  const colunas: Record<string, string | number | null> = {};
  if (dados.nomePublico !== undefined) colunas.nome_publico = dados.nomePublico;
  if (dados.descricao !== undefined) colunas.descricao = dados.descricao;
  if (dados.telefone !== undefined) colunas.telefone = dados.telefone;
  if (dados.tipoConta !== undefined) colunas.tipo_conta = dados.tipoConta;
  if (dados.endereco) {
    colunas.cep = dados.endereco.cep;
    colunas.logradouro = dados.endereco.logradouro;
    colunas.numero = dados.endereco.numero;
    colunas.complemento = dados.endereco.complemento;
    colunas.bairro = dados.endereco.bairro;
    colunas.cidade = dados.endereco.cidade;
    colunas.uf = dados.endereco.uf;
    // Novo CEP: recalcula o ponto aproximado usado no filtro por distância.
    const recebeuCoordenadas = typeof dados.endereco.latitude === 'number';
    if (recebeuCoordenadas || dados.endereco.cep !== usuario.cep || usuario.latitude === null) {
      const coordenadas = await resolverCoordenadas(dados.endereco.cep, dados.endereco, env.GOOGLE_PLACES_API_KEY);
      colunas.latitude = coordenadas?.latitude ?? null;
      colunas.longitude = coordenadas?.longitude ?? null;
    }
  }
  if (dados.fotoChave !== undefined) {
    if (!(await arquivoPertenceAoUsuario(env, dados.fotoChave, usuario.id, 'perfil'))) {
      throw new ErroApi(422, 'FOTO_INVALIDA', 'Foto não encontrada. Envie novamente.', { fotoChave: 'Foto não encontrada.' });
    }
    colunas.foto_chave = dados.fotoChave;
  }

  const nomes = Object.keys(colunas);
  if (nomes.length > 0) {
    const atribuicoes = [...nomes.map((nome) => `${nome} = ?`), 'atualizado_em = ?'].join(', ');
    await env.DB.prepare(`UPDATE users SET ${atribuicoes} WHERE id = ?`)
      .bind(...Object.values(colunas), agoraIso(), usuario.id)
      .run();
  }

  // A foto anterior sai do armazenamento depois que a nova foi vinculada.
  if (dados.fotoChave !== undefined && usuario.foto_chave && usuario.foto_chave !== dados.fotoChave) {
    await removerArquivos(env, [usuario.foto_chave]);
  }

  const atualizado = await buscarUsuario(env, usuario.id);
  return responderJson(mapearUsuarioPrivado(atualizado ?? usuario, origem, env));
}

export async function obterPerfilPublico(env: Env, userId: string, origem: string) {
  const perfil = await carregarUsuarioPublico(env, userId, origem);
  if (!perfil) {
    throw new ErroApi(404, 'NAO_ENCONTRADO', 'Perfil não encontrado.');
  }
  return responderJson(perfil);
}
