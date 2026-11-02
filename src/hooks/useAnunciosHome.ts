import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import type { ModalidadeId } from '../data/reuseData';
import { obterMensagemErro } from '../services/api';
import { lerVitrineEmCache, listarVitrine } from '../services/anunciosService';
import { buscarEstatisticas, lerEstatisticasEmCache } from '../services/estatisticasService';
import type { AnuncioVitrine, EstatisticasPlataforma } from '../types/api';

// Quantos anúncios cada carrossel de "Nas proximidades" mostra antes do bloco "Confira mais".
export const ITENS_POR_CARROSSEL = 5;

const MODALIDADES_HOME: ModalidadeId[] = ['venda', 'troca', 'doacao'];

type PorModalidade = Record<ModalidadeId, AnuncioVitrine[] | null>;

// Dados reais da Home: um carrossel por modalidade (mais próximos do endereço do perfil, quando logado)
// e os números de impacto. Atualiza ao voltar para a Home.
// Cache local: na primeira abertura mostra as últimas listas salvas no aparelho enquanto a API responde;
// se a API falhar, elas continuam na tela (emCache = true) em vez de uma mensagem de erro.
export function useAnunciosHome() {
  const [porModalidade, setPorModalidade] = useState<PorModalidade>({ venda: null, troca: null, doacao: null });
  const [estatisticas, setEstatisticas] = useState<EstatisticasPlataforma | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [emCache, setEmCache] = useState(false);
  // Evita que o cache (mais velho) sobrescreva dados que a API já entregou.
  const temDados = useRef(false);

  const aplicarListas = useCallback((listas: AnuncioVitrine[][]) => {
    temDados.current = true;
    setPorModalidade({
      venda: listas[0].slice(0, ITENS_POR_CARROSSEL),
      troca: listas[1].slice(0, ITENS_POR_CARROSSEL),
      doacao: listas[2].slice(0, ITENS_POR_CARROSSEL),
    });
  }, []);

  const carregarAnuncios = useCallback(async () => {
    if (!temDados.current) {
      const salvas = await Promise.all(
        MODALIDADES_HOME.map((modalidade) => lerVitrineEmCache({ modalidade, proximosDoPerfil: true })),
      );
      if (!temDados.current && salvas.every((entrada) => entrada !== null)) {
        aplicarListas(salvas.map((entrada) => entrada!.dados.itens));
      }
      void lerEstatisticasEmCache().then((entrada) => {
        if (entrada) {
          setEstatisticas((atual) => atual ?? entrada.dados);
        }
      });
    }

    try {
      const listas = await Promise.all(
        MODALIDADES_HOME.map((modalidade) => listarVitrine({ modalidade, proximosDoPerfil: true }, 0)),
      );
      aplicarListas(listas.map((lista) => lista.itens));
      setEmCache(false);
      setErro(null);
    } catch (falha) {
      setErro(obterMensagemErro(falha));
      // Com listas na tela (do cache ou de uma carga anterior), elas ficam e a Home avisa em vez de dar erro.
      setEmCache(temDados.current);
    }
    // Números de impacto à parte: uma falha aqui não esconde os anúncios.
    buscarEstatisticas().then(setEstatisticas).catch(() => undefined);
  }, [aplicarListas]);

  useFocusEffect(
    useCallback(() => {
      void carregarAnuncios();
    }, [carregarAnuncios]),
  );

  const carregou = Object.values(porModalidade).some((lista) => lista !== null);
  return { porModalidade, estatisticas, emCache, erro: carregou ? null : erro, recarregar: carregarAnuncios };
}
