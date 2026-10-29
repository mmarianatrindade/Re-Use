import { calcularSha256, gerarId, gerarToken } from './cripto';
import { emDesenvolvimento, type Env } from './env';
import { agoraIso, somarMinutos } from './http';

type TipoTokenEmail = 'ativacao' | 'recuperacao';

const VALIDADE_MINUTOS: Record<TipoTokenEmail, number> = {
  ativacao: 24 * 60,
  recuperacao: 30,
};

const CAMINHOS: Record<TipoTokenEmail, string> = {
  ativacao: 'ativar',
  recuperacao: 'redefinir-senha',
};

function escaparHtml(texto: string) {
  return texto.replace(/[&<>"']/g, (caractere) => `&#${caractere.charCodeAt(0)};`);
}

function montarMensagem(tipo: TipoTokenEmail, nome: string, link: string) {
  const primeiroNome = escaparHtml(nome.split(' ')[0]);

  if (tipo === 'ativacao') {
    return {
      assunto: 'Confirme seu e-mail no ReUse',
      texto: `Olá, ${nome.split(' ')[0]}!\n\nConfirme seu e-mail para publicar itens no ReUse:\n${link}\n\nO link vale por 24 horas. Se você não criou esta conta, ignore este e-mail.`,
      html: `<p>Olá, ${primeiroNome}!</p><p>Confirme seu e-mail para publicar itens no ReUse:</p><p><a href="${link}">Confirmar e-mail</a></p><p>O link vale por 24 horas. Se você não criou esta conta, ignore este e-mail.</p>`,
    };
  }

  return {
    assunto: 'Redefinição de senha do ReUse',
    texto: `Olá, ${nome.split(' ')[0]}!\n\nRecebemos um pedido para redefinir sua senha:\n${link}\n\nO link vale por 30 minutos. Se não foi você, ignore este e-mail: sua senha continua a mesma.`,
    html: `<p>Olá, ${primeiroNome}!</p><p>Recebemos um pedido para redefinir sua senha:</p><p><a href="${link}">Redefinir senha</a></p><p>O link vale por 30 minutos. Se não foi você, ignore este e-mail: sua senha continua a mesma.</p>`,
  };
}

// Cria um link de uso único e envia por e-mail. Sem envio configurado, em desenvolvimento
// o link é devolvido (linkDev) para testes; em produção ele nunca volta na resposta.
export async function enviarLinkPorEmail(
  env: Env,
  destino: { userId: string; email: string; nome: string },
  tipo: TipoTokenEmail,
): Promise<string | undefined> {
  const token = gerarToken();

  // Um novo link invalida os anteriores do mesmo tipo.
  await env.DB.batch([
    env.DB.prepare('UPDATE email_tokens SET usado_em = ? WHERE user_id = ? AND tipo = ? AND usado_em IS NULL').bind(
      agoraIso(),
      destino.userId,
      tipo,
    ),
    env.DB.prepare(
      'INSERT INTO email_tokens (id, user_id, tipo, token_hash, criado_em, expira_em) VALUES (?, ?, ?, ?, ?, ?)',
    ).bind(gerarId(), destino.userId, tipo, await calcularSha256(token), agoraIso(), somarMinutos(VALIDADE_MINUTOS[tipo])),
  ]);

  const link = `${env.APP_URL}/${CAMINHOS[tipo]}?token=${encodeURIComponent(token)}`;
  const mensagem = montarMensagem(tipo, destino.nome, link);

  if (env.EMAIL && env.EMAIL_REMETENTE) {
    try {
      await env.EMAIL.send({
        to: destino.email,
        from: { email: env.EMAIL_REMETENTE, name: 'ReUse' },
        subject: mensagem.assunto,
        text: mensagem.texto,
        html: mensagem.html,
      });
      return undefined;
    } catch (erro) {
      console.error('Falha ao enviar e-mail', tipo, erro);
    }
  } else {
    console.warn(`Envio de e-mail não configurado (${tipo}).`);
  }

  return emDesenvolvimento(env) ? link : undefined;
}

// Consome um link de uso único; retorna o usuário dono do token ou null se inválido/expirado.
export async function consumirTokenEmail(env: Env, token: string, tipo: TipoTokenEmail) {
  // UPDATE ... RETURNING marca o uso e lê o dono na mesma instrução: dois cliques simultâneos não consomem o link duas vezes.
  const agora = agoraIso();
  const registro = await env.DB.prepare(
    'UPDATE email_tokens SET usado_em = ? WHERE token_hash = ? AND tipo = ? AND usado_em IS NULL AND expira_em > ? RETURNING user_id',
  )
    .bind(agora, await calcularSha256(token), tipo, agora)
    .first<{ user_id: string }>();

  return registro?.user_id ?? null;
}

// Evita disparar vários e-mails seguidos para a mesma conta.
export async function enviouRecentemente(env: Env, userId: string, tipo: TipoTokenEmail, segundos = 60) {
  const limite = new Date(Date.now() - segundos * 1000).toISOString();
  const recente = await env.DB.prepare('SELECT 1 FROM email_tokens WHERE user_id = ? AND tipo = ? AND criado_em > ? LIMIT 1')
    .bind(userId, tipo, limite)
    .first();
  return recente !== null;
}
