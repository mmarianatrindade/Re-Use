import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import type { ModalidadeId } from '../data/reuseData';
import { obterMensagemErro } from '../services/api';
import { listarVitrine } from '../services/anunciosService';
import { buscarEstatisticas } from '../services/estatisticasService';
import type { AnuncioVitrine, EstatisticasPlataforma } from '../types/api';

// Quantos anúncios cada carrossel de "Nas proximidades" mostra antes do bloco "Confira mais".
export const ITENS_POR_CARROSSEL = 5;

const MODALIDADES_HOME: ModalidadeId[] = ['venda', 'troca', 'doacao'];

type PorModalidade = Record<ModalidadeId, AnuncioVitrine[] | null>;

// Dados reais da Home: um carrossel por modalidade (mais próximos do endereço do perfil, quando logado)
// e os números de impacto. Atualiza ao voltar para a Home.
export function useAnunciosHome() {
  const [porModalidade, setPorModalidade] = useState<PorModalidade>({ venda: null, troca: null, doacao: null });
  const [estatisticas, setEstatisticas] = useState<EstatisticasPlataforma | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregarAnuncios = useCallback(async () => {
    try {
      const listas = await Promise.all(
        MODALIDADES_HOME.map((modalidade) => listarVitrine({ modalidade, proximosDoPerfil: true }, 0)),
      );
      setPorModalidade({
        venda: listas[0].itens.slice(0, ITENS_POR_CARROSSEL),
        troca: listas[1].itens.slice(0, ITENS_POR_CARROSSEL),
        doacao: listas[2].itens.slice(0, ITENS_POR_CARROSSEL),
      });
      setErro(null);
    } catch (falha) {
      setErro(obterMensagemErro(falha));
    }
    // Números de impacto à parte: uma falha aqui não esconde os anúncios.
    buscarEstatisticas().then(setEstatisticas).catch(() => undefined);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregarAnuncios();
    }, [carregarAnuncios]),
  );

  const carregou = Object.values(porModalidade).some((lista) => lista !== null);
  return { porModalidade, estatisticas, erro: carregou ? null : erro, recarregar: carregarAnuncios };
}
