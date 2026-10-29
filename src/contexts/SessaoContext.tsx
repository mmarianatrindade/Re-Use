import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiError, configurarSessaoApi } from '../services/api';
import {
  apagarSessao,
  carregarSessao,
  chavesLocais,
  limparDadosDaConta,
  salvarLocal,
  salvarSessao,
  type SessaoSalva,
} from '../services/armazenamento';
import { cadastrarUsuario, encerrarSessao, entrarComSenha, renovarToken } from '../services/authService';
import { buscarMinhaConta } from '../services/perfilService';
import type { CadastroFormDados, LoginDados } from '../schemas/usuario';
import type { SessaoResposta, UsuarioPrivado } from '../types/api';

type StatusSessao = 'carregando' | 'anonimo' | 'autenticado';

interface SessaoContextValor {
  status: StatusSessao;
  // Pode ser null com sessão válida quando o app abre sem conexão; as telas oferecem "tentar de novo".
  usuario: UsuarioPrivado | null;
  entrar: (dados: LoginDados) => Promise<void>;
  cadastrar: (dados: CadastroFormDados) => Promise<SessaoResposta>;
  sair: () => Promise<void>;
  atualizarUsuario: (usuario: UsuarioPrivado) => void;
  recarregarUsuario: () => Promise<UsuarioPrivado | null>;
}

// Renova o token quando faltam menos de 2 dias para expirar (sessão de 7 dias no servidor).
const RENOVAR_ANTES_MS = 2 * 24 * 60 * 60_000;

const SessaoContext = createContext<SessaoContextValor | null>(null);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StatusSessao>('carregando');
  const [usuario, setUsuario] = useState<UsuarioPrivado | null>(null);
  const sessaoRef = useRef<SessaoSalva | null>(null);

  const limparSessaoLocal = useCallback(async () => {
    sessaoRef.current = null;
    setUsuario(null);
    setStatus('anonimo');
    await limparDadosDaConta();
  }, []);

  const iniciarSessao = useCallback(async (resposta: SessaoResposta) => {
    const sessao = { token: resposta.token, expiraEm: resposta.expiraEm };
    sessaoRef.current = sessao;
    await salvarSessao(sessao);
    setUsuario(resposta.usuario);
    setStatus('autenticado');
  }, []);

  useEffect(() => {
    configurarSessaoApi({
      obterToken: () => sessaoRef.current?.token ?? null,
      aoExpirarSessao: () => {
        void limparSessaoLocal();
      },
    });
  }, [limparSessaoLocal]);

  useEffect(() => {
    const restaurarSessao = async () => {
      const salva = await carregarSessao();
      if (!salva || new Date(salva.expiraEm).getTime() <= Date.now()) {
        if (salva) {
          await apagarSessao();
        }
        setStatus('anonimo');
        return;
      }

      sessaoRef.current = salva;
      setStatus('autenticado');

      try {
        if (new Date(salva.expiraEm).getTime() - Date.now() < RENOVAR_ANTES_MS) {
          await iniciarSessao(await renovarToken(salva.token));
        } else {
          setUsuario(await buscarMinhaConta());
        }
      } catch (erro) {
        // Sem conexão a sessão continua; 401 já limpa a sessão pelo aoExpirarSessao.
        if (!(erro instanceof ApiError) || erro.status !== 0) {
          console.warn('Falha ao restaurar a sessão', erro);
        }
      }
    };

    void restaurarSessao();
  }, [iniciarSessao]);

  const entrar = useCallback(
    async (dados: LoginDados) => {
      const resposta = await entrarComSenha(dados);
      await salvarLocal(chavesLocais.ultimoEmail, dados.email.trim().toLowerCase());
      await iniciarSessao(resposta);
    },
    [iniciarSessao],
  );

  const cadastrar = useCallback(
    async (dados: CadastroFormDados) => {
      const resposta = await cadastrarUsuario(dados);
      await salvarLocal(chavesLocais.ultimoEmail, dados.email.trim().toLowerCase());
      await iniciarSessao(resposta);
      return resposta;
    },
    [iniciarSessao],
  );

  const sair = useCallback(async () => {
    const token = sessaoRef.current?.token;
    if (token) {
      // Revoga no servidor; mesmo sem conexão, o aparelho encerra a sessão local.
      await encerrarSessao(token).catch(() => undefined);
    }
    await limparSessaoLocal();
  }, [limparSessaoLocal]);

  const recarregarUsuario = useCallback(async () => {
    if (!sessaoRef.current) {
      return null;
    }
    const atual = await buscarMinhaConta();
    setUsuario(atual);
    return atual;
  }, []);

  const valor = useMemo<SessaoContextValor>(
    () => ({ status, usuario, entrar, cadastrar, sair, atualizarUsuario: setUsuario, recarregarUsuario }),
    [status, usuario, entrar, cadastrar, sair, recarregarUsuario],
  );

  return <SessaoContext.Provider value={valor}>{children}</SessaoContext.Provider>;
}

export function useSessao() {
  const contexto = useContext(SessaoContext);
  if (!contexto) {
    throw new Error('useSessao precisa estar dentro de SessaoProvider.');
  }
  return contexto;
}
