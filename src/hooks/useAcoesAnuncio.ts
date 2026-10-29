import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import type { AcaoSheet } from '../components/ActionSheet';
import { STATUS_EDITAVEIS, STATUS_EXCLUIVEIS, TRANSICOES_STATUS, type StatusAnuncio } from '../schemas/anuncio';
import { obterMensagemErro } from '../services/api';
import { alterarStatusAnuncio, excluirAnuncio } from '../services/anunciosService';
import type { AnuncioProprio } from '../types/api';
import { confirmarAcao } from '../utils/confirmarAcao';
import { obterLabelStatus } from '../utils/formatarAnuncio';
import { showMessage } from '../utils/showMessage';

interface Callbacks {
  onAtualizado: (anuncio: AnuncioProprio) => void;
  onExcluido: (anuncioId: string) => void;
}

// Confirmações para mudanças com efeito difícil de desfazer.
const CONFIRMACOES: Partial<Record<StatusAnuncio, { mensagem: string; confirmar: string }>> = {
  concluido: {
    mensagem: 'Marque como concluído só depois da entrega. Um item concluído não volta a ficar disponível e não pode ser excluído.',
    confirmar: 'Concluir',
  },
  arquivado: {
    mensagem: 'O anúncio sai da busca, mas continua no seu histórico. Você pode reativá-lo depois se ele não tiver sido concluído.',
    confirmar: 'Arquivar',
  },
};

// Regras que o app mostra; a API aplica as mesmas regras e é quem decide.
export function obterStatusPermitidos(anuncio: AnuncioProprio) {
  return TRANSICOES_STATUS[anuncio.status].filter((status) => !(anuncio.jaConcluido && status === 'disponivel'));
}

export function podeExcluir(anuncio: AnuncioProprio) {
  return STATUS_EXCLUIVEIS.includes(anuncio.status) && !anuncio.jaConcluido;
}

export function podeEditar(anuncio: AnuncioProprio) {
  return STATUS_EDITAVEIS.includes(anuncio.status) && !anuncio.jaConcluido;
}

export function useAcoesAnuncio({ onAtualizado, onExcluido }: Callbacks) {
  const navigation = useNavigation();
  const [processando, setProcessando] = useState<string | null>(null);

  const mudarStatus = async (anuncio: AnuncioProprio, status: StatusAnuncio) => {
    const confirmacao = CONFIRMACOES[status];
    if (confirmacao) {
      const confirmado = await confirmarAcao({
        titulo: `${obterLabelStatus(status)}: ${anuncio.titulo}`,
        mensagem: confirmacao.mensagem,
        confirmar: confirmacao.confirmar,
        destrutivo: status === 'arquivado',
      });
      if (!confirmado) {
        return;
      }
    }

    setProcessando(anuncio.id);
    try {
      onAtualizado(await alterarStatusAnuncio(anuncio.id, status));
    } catch (erro) {
      showMessage('Não foi possível alterar', obterMensagemErro(erro));
    } finally {
      setProcessando(null);
    }
  };

  const excluir = async (anuncio: AnuncioProprio) => {
    const confirmado = await confirmarAcao({
      titulo: 'Excluir anúncio?',
      mensagem: `"${anuncio.titulo}" e as fotos serão removidos definitivamente. Para só tirar da busca, prefira arquivar.`,
      confirmar: 'Excluir',
      destrutivo: true,
    });
    if (!confirmado) {
      return;
    }

    setProcessando(anuncio.id);
    try {
      await excluirAnuncio(anuncio.id);
      onExcluido(anuncio.id);
    } catch (erro) {
      showMessage('Não foi possível excluir', obterMensagemErro(erro));
    } finally {
      setProcessando(null);
    }
  };

  // Ações da folha de opções, na ordem de uso mais comum.
  const montarAcoes = (anuncio: AnuncioProprio): AcaoSheet[] => {
    const acoes: AcaoSheet[] = [];

    if (podeEditar(anuncio)) {
      acoes.push({ id: 'editar', label: 'Editar anúncio', onPress: () => navigation.navigate('EditarAnuncio', { anuncioId: anuncio.id }) });
    }
    obterStatusPermitidos(anuncio)
      .filter((status) => status !== 'arquivado')
      .forEach((status) =>
        acoes.push({
          id: `status-${status}`,
          label: status === 'disponivel' && anuncio.status === 'arquivado' ? 'Reativar anúncio' : `Marcar como ${obterLabelStatus(status).toLowerCase()}`,
          onPress: () => void mudarStatus(anuncio, status),
        }),
      );
    if (anuncio.status === 'disponivel' && !anuncio.destaqueAte) {
      acoes.push({
        id: 'destacar',
        label: anuncio.pedidoDestaque ? 'Ver pedido de destaque' : 'Destacar anúncio',
        descricao: 'Mais exposição na busca e na Home',
        onPress: () => navigation.navigate('DestacarAnuncio', { anuncioId: anuncio.id }),
      });
    }
    if (obterStatusPermitidos(anuncio).includes('arquivado')) {
      acoes.push({
        id: 'arquivar',
        label: 'Arquivar',
        descricao: 'Sai da busca e mantém o histórico',
        onPress: () => void mudarStatus(anuncio, 'arquivado'),
      });
    }
    if (podeExcluir(anuncio)) {
      acoes.push({ id: 'excluir', label: 'Excluir', destrutivo: true, onPress: () => void excluir(anuncio) });
    }
    return acoes;
  };

  return { processando, mudarStatus, excluir, montarAcoes };
}
