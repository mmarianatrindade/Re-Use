import { TERMOS_VERSAO, converterDataBrParaIso } from '../../../src/schemas/comum';
import {
  cadastroApiSchema,
  loginSchema,
  recuperarSenhaSchema,
  redefinirSenhaApiSchema,
  tokenSchema,
} from '../../../src/schemas/usuario';
import type { MensagemResposta, SessaoResposta } from '../../../src/types/api';
import { calcularHashCpf, cifrarCpf, gerarHashSenha, gerarId, obterHashFicticio, verificarSenha } from '../cripto';
import { consumirTokenEmail, enviarLinkPorEmail, enviouRecentemente } from '../email';
import { resolverCoordenadas } from '../geo';
import { exigeConfirmacaoEmail, type Env } from '../env';
import { ErroApi, agoraIso, lerCorpo, obterDispositivo, obterIp, responderJson, somarMinutos } from '../http';
import { buscarUsuario, gerarNomePublico, mapearUsuarioPrivado, type UsuarioRow } from '../mapeadores';
import { criarSessao, exigirSessao, revogarSessao, revogarTodasSessoes } from '../sessao';

// Após MAX_TENTATIVAS senhas erradas seguidas, a conta fica bloqueada por BLOQUEIO_MINUTOS.
const MAX_TENTATIVAS = 5;
const BLOQUEIO_MINUTOS = 15;

function ehErroUnico(erro: unknown) {
  return erro instanceof Error && erro.message.includes('UNIQUE');
}

export async function cadastrar(request: Request, env: Env, origem: string) {
  const dados = await lerCorpo(request, cadastroApiSchema);

  if (dados.termosVersao !== TERMOS_VERSAO) {
    throw new ErroApi(409, 'TERMOS_DESATUALIZADOS', 'Os termos foram atualizados. Leia e aceite a versão atual.');
  }

  const cpfHash = await calcularHashCpf(dados.cpf, env.CPF_CHAVE);
  const [emailExistente, cpfExistente] = await env.DB.batch([
    env.DB.prepare('SELECT 1 FROM users WHERE email = ?').bind(dados.email),
    env.DB.prepare('SELECT 1 FROM users WHERE cpf_hash = ?').bind(cpfHash),
  ]);
  if (emailExistente.results.length > 0) {
    throw new ErroApi(409, 'EMAIL_EM_USO', 'Este e-mail já tem cadastro.', { email: 'Este e-mail já tem cadastro. Tente entrar.' });
  }
  if (cpfExistente.results.length > 0) {
    throw new ErroApi(409, 'CPF_EM_USO', 'Este CPF já tem cadastro.', { cpf: 'Este CPF já está vinculado a uma conta.' });
  }

  const userId = gerarId();
  const agora = agoraIso();
  const { endereco } = dados;
  const coordenadas = await resolverCoordenadas(endereco.cep, endereco, env.GOOGLE_PLACES_API_KEY);

  try {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO users (id, email, senha_hash, nome_completo, nome_publico, telefone, cpf_cifrado, cpf_hash, cpf_final,
          data_nascimento, cep, logradouro, numero, complemento, bairro, cidade, uf, tipo_conta, latitude, longitude,
          criado_em, atualizado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        userId,
        dados.email,
        await gerarHashSenha(dados.senha),
        dados.nome,
        gerarNomePublico(dados.nome),
        dados.telefone,
        await cifrarCpf(dados.cpf, env.CPF_CHAVE),
        cpfHash,
        dados.cpf.slice(-2),
        converterDataBrParaIso(dados.dataNascimento),
        endereco.cep,
        endereco.logradouro,
        endereco.numero,
        endereco.complemento,
        endereco.bairro,
        endereco.cidade,
        endereco.uf,
        dados.tipoConta,
        coordenadas?.latitude ?? null,
        coordenadas?.longitude ?? null,
        agora,
        agora,
      ),
      env.DB.prepare(
        'INSERT INTO terms_acceptances (id, user_id, versao, aceito_em, ip, dispositivo) VALUES (?, ?, ?, ?, ?, ?)',
      ).bind(gerarId(), userId, dados.termosVersao, agora, obterIp(request), obterDispositivo(request)),
    ]);
  } catch (erro) {
    if (ehErroUnico(erro)) {
      throw new ErroApi(409, 'CADASTRO_DUPLICADO', 'E-mail ou CPF já cadastrado.');
    }
    throw erro;
  }

  // Sem confirmação exigida (ainda sem domínio de e-mail), não há link de ativação a enviar.
  const linkDev = exigeConfirmacaoEmail(env)
    ? await enviarLinkPorEmail(env, { userId, email: dados.email, nome: dados.nome }, 'ativacao')
    : undefined;
  const sessao = await criarSessao(env, userId, request);
  const usuario = await buscarUsuario(env, userId);

  const resposta: SessaoResposta = { ...sessao, usuario: mapearUsuarioPrivado(usuario as UsuarioRow, origem, env), linkDev };
  return responderJson(resposta, 201);
}

export async function entrar(request: Request, env: Env, origem: string) {
  const dados = await lerCorpo(request, loginSchema);
  const usuario = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(dados.email).first<UsuarioRow>();
  const credenciaisInvalidas = new ErroApi(401, 'CREDENCIAIS_INVALIDAS', 'E-mail ou senha incorretos.');

  if (!usuario) {
    await verificarSenha(dados.senha, await obterHashFicticio());
    throw credenciaisInvalidas;
  }

  if (usuario.bloqueado_ate && usuario.bloqueado_ate > agoraIso()) {
    const minutos = Math.ceil((new Date(usuario.bloqueado_ate).getTime() - Date.now()) / 60_000);
    throw new ErroApi(429, 'CONTA_BLOQUEADA', `Muitas tentativas. Tente novamente em ${minutos} min ou redefina sua senha.`);
  }

  if (!(await verificarSenha(dados.senha, usuario.senha_hash))) {
    const tentativas = usuario.tentativas_login + 1;
    const bloquear = tentativas >= MAX_TENTATIVAS;
    await env.DB.prepare('UPDATE users SET tentativas_login = ?, bloqueado_ate = ? WHERE id = ?')
      .bind(bloquear ? 0 : tentativas, bloquear ? somarMinutos(BLOQUEIO_MINUTOS) : null, usuario.id)
      .run();
    throw credenciaisInvalidas;
  }

  await env.DB.prepare('UPDATE users SET tentativas_login = 0, bloqueado_ate = NULL WHERE id = ?').bind(usuario.id).run();
  const sessao = await criarSessao(env, usuario.id, request);

  const resposta: SessaoResposta = { ...sessao, usuario: mapearUsuarioPrivado(usuario, origem, env) };
  return responderJson(resposta);
}

// Troca o token atual por um novo (rotação) e revoga o anterior.
export async function renovarSessao(request: Request, env: Env, origem: string) {
  const atual = await exigirSessao(env, request);
  const usuario = await buscarUsuario(env, atual.userId);
  if (!usuario) {
    throw new ErroApi(401, 'SESSAO_INVALIDA', 'Sua sessão expirou. Entre novamente.');
  }

  const sessao = await criarSessao(env, atual.userId, request);
  await revogarSessao(env, atual.sessaoId);

  const resposta: SessaoResposta = { ...sessao, usuario: mapearUsuarioPrivado(usuario, origem, env) };
  return responderJson(resposta);
}

export async function sair(request: Request, env: Env) {
  const sessao = await exigirSessao(env, request);
  await revogarSessao(env, sessao.sessaoId);
  const resposta: MensagemResposta = { mensagem: 'Sessão encerrada neste dispositivo.' };
  return responderJson(resposta);
}

export async function ativarConta(request: Request, env: Env) {
  const { token } = await lerCorpo(request, tokenSchema);
  const userId = await consumirTokenEmail(env, token, 'ativacao');
  if (!userId) {
    throw new ErroApi(410, 'LINK_INVALIDO', 'Este link expirou ou já foi usado. Peça um novo no app.');
  }

  await env.DB.prepare('UPDATE users SET email_confirmado_em = COALESCE(email_confirmado_em, ?), atualizado_em = ? WHERE id = ?')
    .bind(agoraIso(), agoraIso(), userId)
    .run();

  const resposta: MensagemResposta = { mensagem: 'E-mail confirmado. Você já pode publicar itens.' };
  return responderJson(resposta);
}

export async function reenviarAtivacao(request: Request, env: Env) {
  const sessao = await exigirSessao(env, request);
  const usuario = await buscarUsuario(env, sessao.userId);
  if (!usuario) {
    throw new ErroApi(401, 'SESSAO_INVALIDA', 'Sua sessão expirou. Entre novamente.');
  }
  if (usuario.email_confirmado_em) {
    throw new ErroApi(409, 'EMAIL_JA_CONFIRMADO', 'Seu e-mail já está confirmado.');
  }
  if (await enviouRecentemente(env, usuario.id, 'ativacao')) {
    throw new ErroApi(429, 'AGUARDE', 'Aguarde um minuto para pedir outro e-mail.');
  }

  const linkDev = await enviarLinkPorEmail(env, { userId: usuario.id, email: usuario.email, nome: usuario.nome_completo }, 'ativacao');
  const resposta: MensagemResposta = { mensagem: `Enviamos um novo link para ${usuario.email}.`, linkDev };
  return responderJson(resposta);
}

// Resposta idêntica exista ou não a conta, para não revelar quais e-mails estão cadastrados.
export async function recuperarSenha(request: Request, env: Env) {
  const { email } = await lerCorpo(request, recuperarSenhaSchema);
  const usuario = await env.DB.prepare('SELECT id, email, nome_completo FROM users WHERE email = ?')
    .bind(email)
    .first<{ id: string; email: string; nome_completo: string }>();

  let linkDev: string | undefined;
  if (usuario && !(await enviouRecentemente(env, usuario.id, 'recuperacao'))) {
    linkDev = await enviarLinkPorEmail(env, { userId: usuario.id, email: usuario.email, nome: usuario.nome_completo }, 'recuperacao');
  }

  const resposta: MensagemResposta = {
    mensagem: 'Se houver uma conta com este e-mail, você receberá um link para redefinir a senha em instantes.',
    linkDev,
  };
  return responderJson(resposta);
}

export async function redefinirSenha(request: Request, env: Env) {
  const { token, senha } = await lerCorpo(request, redefinirSenhaApiSchema);
  const userId = await consumirTokenEmail(env, token, 'recuperacao');
  if (!userId) {
    throw new ErroApi(410, 'LINK_INVALIDO', 'Este link expirou ou já foi usado. Peça um novo.');
  }

  await env.DB.prepare(
    'UPDATE users SET senha_hash = ?, tentativas_login = 0, bloqueado_ate = NULL, atualizado_em = ? WHERE id = ?',
  )
    .bind(await gerarHashSenha(senha), agoraIso(), userId)
    .run();
  // Nova senha encerra as sessões abertas em todos os dispositivos.
  await revogarTodasSessoes(env, userId);

  const resposta: MensagemResposta = { mensagem: 'Senha redefinida. Entre com a nova senha.' };
  return responderJson(resposta);
}
