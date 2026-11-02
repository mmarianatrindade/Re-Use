import { AppState } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiError, configurarSessaoApi } from '../services/api';
import { carregarSessao, chavesLocais, limparDadosDaConta, salvarLocal, salvarSessao, type SessaoSalva } from '../services/armazenamento';
import { ativarContaLocal } from '../services/contaLocal';
import { cadastrarUsuario, encerrarSessao, entrarComSenha, renovarToken } from '../services/authService';
import { buscarMinhaConta } from '../services/perfilService';
import type { CadastroFormDados, LoginDados } from '../schemas/usuario';
import type { SessaoResposta, UsuarioPrivado } from '../types/api';

type StatusSessao = 'carregando' | 'anonimo' | 'autenticado';

interface SessaoContextValor {
  status: StatusSessao;
  usuario: UsuarioPrivado | null;
  entrar: (dados: LoginDados) => Promise<void>;
  cadastrar: (dados: CadastroFormDados) => Promise<SessaoResposta>;
  sair: () => Promise<void>;
  atualizarUsuario: (usuario: UsuarioPrivado) => void;
  recarregarUsuario: () => Promise<UsuarioPrivado | null>;
}

const RENOVAR_ANTES_MS = 2 * 24 * 60 * 60_000;
const CONFERIR_RENOVACAO_MS = 60 * 60_000;
const SessaoContext = createContext<SessaoContextValor | null>(null);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StatusSessao>('carregando');
  const [usuario, setUsuario] = useState<UsuarioPrivado | null>(null);
  const sessaoRef = useRef<SessaoSalva | null>(null);
  const geracaoRef = useRef(0);
  const renovacaoRef = useRef<Promise<void> | null>(null);

  const limparSessaoLocal = useCallback(async () => {
    geracaoRef.current += 1;
    sessaoRef.current = null;
    renovacaoRef.current = null;
    setUsuario(null);
    setStatus('anonimo');
    await limparDadosDaConta();
  }, []);

  const iniciarSessao = useCallback(async (resposta: SessaoResposta, geracao: number) => {
    if (geracao !== geracaoRef.current) return false;
    const conta = ativarContaLocal(resposta.usuario.id);
    const sessao = { token: resposta.token, expiraEm: resposta.expiraEm, usuarioId: resposta.usuario.id };
    await salvarSessao(sessao, conta);
    if (geracao !== geracaoRef.current) return false;
    sessaoRef.current = sessao;
    setUsuario(resposta.usuario);
    setStatus('autenticado');
    return true;
  }, []);

  const renovarSeNecessario = useCallback((): Promise<void> => {
    if (renovacaoRef.current) return renovacaoRef.current;
    const atual = sessaoRef.current;
    if (!atual) return Promise.resolve();
    const restante = Date.parse(atual.expiraEm) - Date.now();
    if (!Number.isFinite(restante) || restante <= 0) return limparSessaoLocal();
    if (restante >= RENOVAR_ANTES_MS) return Promise.resolve();
    const geracao = geracaoRef.current;
    const tarefa = (async () => {
      try {
        const resposta = await renovarToken(atual.token);
        if (geracao !== geracaoRef.current || sessaoRef.current?.token !== atual.token) {
          void encerrarSessao(resposta.token).catch(() => undefined);
          return;
        }
        await iniciarSessao(resposta, geracao);
      } catch (erro) {
        if (!(erro instanceof ApiError) || erro.status !== 0) console.warn('Falha ao renovar a sessão', erro);
      }
    })();
    renovacaoRef.current = tarefa;
    void tarefa.finally(() => {
      if (renovacaoRef.current === tarefa) renovacaoRef.current = null;
    });
    return tarefa;
  }, [iniciarSessao, limparSessaoLocal]);

  useEffect(() => {
    configurarSessaoApi({
      obterToken: () => sessaoRef.current?.token ?? null,
      aoExpirarSessao: (token) => {
        void (async () => {
          await renovacaoRef.current;
          if (sessaoRef.current?.token === token) await limparSessaoLocal();
        })();
      },
    });
  }, [limparSessaoLocal]);

  useEffect(() => {
    let ativo = true;
    const geracao = geracaoRef.current;
    const restaurar = async () => {
      const salva = await carregarSessao();
      if (!ativo || geracao !== geracaoRef.current) return;
      if (!salva || !Number.isFinite(Date.parse(salva.expiraEm)) || Date.parse(salva.expiraEm) <= Date.now()) {
        await limparSessaoLocal();
        return;
      }
      sessaoRef.current = salva;
      if (salva.usuarioId) ativarContaLocal(salva.usuarioId);
      setStatus('autenticado');
      try {
        if (Date.parse(salva.expiraEm) - Date.now() < RENOVAR_ANTES_MS) {
          await renovarSeNecessario();
        } else {
          const atual = await buscarMinhaConta();
          if (ativo && geracao === geracaoRef.current && sessaoRef.current?.token === salva.token) {
            await iniciarSessao({ ...salva, usuario: atual }, geracao);
          }
        }
      } catch (erro) {
        if (!(erro instanceof ApiError) || erro.status !== 0) console.warn('Falha ao restaurar a sessão', erro);
      }
    };
    void restaurar().catch(() => { if (ativo) setStatus('anonimo'); });
    return () => { ativo = false; };
  }, [iniciarSessao, limparSessaoLocal, renovarSeNecessario]);

  useEffect(() => {
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void renovarSeNecessario();
    });
    const intervalo = setInterval(() => void renovarSeNecessario(), CONFERIR_RENOVACAO_MS);
    return () => { assinatura.remove(); clearInterval(intervalo); };
  }, [renovarSeNecessario]);

  const entrar = useCallback(async (dados: LoginDados) => {
    const geracao = ++geracaoRef.current;
    const resposta = await entrarComSenha(dados);
    if (await iniciarSessao(resposta, geracao)) await salvarLocal(chavesLocais.ultimoEmail, dados.email.trim().toLowerCase());
  }, [iniciarSessao]);

  const cadastrar = useCallback(async (dados: CadastroFormDados) => {
    const geracao = ++geracaoRef.current;
    const resposta = await cadastrarUsuario(dados);
    if (await iniciarSessao(resposta, geracao)) await salvarLocal(chavesLocais.ultimoEmail, dados.email.trim().toLowerCase());
    return resposta;
  }, [iniciarSessao]);

  const sair = useCallback(async () => {
    const token = sessaoRef.current?.token;
    const limpeza = limparSessaoLocal();
    await Promise.all([limpeza, token ? encerrarSessao(token).catch(() => undefined) : Promise.resolve()]);
  }, [limparSessaoLocal]);

  const recarregarUsuario = useCallback(async () => {
    const token = sessaoRef.current?.token;
    const geracao = geracaoRef.current;
    if (!token) return null;
    const atual = await buscarMinhaConta();
    if (geracao !== geracaoRef.current || token !== sessaoRef.current?.token) return null;
    setUsuario(atual);
    return atual;
  }, []);

  const atualizarUsuario = useCallback((atual: UsuarioPrivado) => {
    if (sessaoRef.current?.usuarioId === atual.id) setUsuario(atual);
  }, []);

  const valor = useMemo<SessaoContextValor>(() => ({ status, usuario, entrar, cadastrar, sair, atualizarUsuario, recarregarUsuario }),
    [status, usuario, entrar, cadastrar, sair, atualizarUsuario, recarregarUsuario]);
  return <SessaoContext.Provider value={valor}>{children}</SessaoContext.Provider>;
}

export function useSessao() {
  const contexto = useContext(SessaoContext);
  if (!contexto) throw new Error('useSessao precisa estar dentro de SessaoProvider.');
  return contexto;
}
