import { useCallback, useEffect, useState } from 'react';
import Banner from '../../components/Banner';
import EmptyState from '../../components/EmptyState';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import type { TelaAbaProps } from '../../navigation/tipos';
import { STATUS_EDITAVEIS, type AnuncioFormDados } from '../../schemas/anuncio';
import { obterMensagemErro } from '../../services/api';
import { buscarMeuAnuncio } from '../../services/anunciosService';
import type { AnuncioProprio } from '../../types/api';
import { mascararPreco } from '../../utils/mascaras';
import FormularioAnuncio from './publicar/FormularioAnuncio';

function converterAnuncioEmFormulario(anuncio: AnuncioProprio): AnuncioFormDados {
  return {
    fotos: anuncio.imagens.map((imagem) => ({ uri: imagem.url, chave: imagem.chave })),
    titulo: anuncio.titulo,
    descricao: anuncio.descricao,
    categoria: anuncio.categoria,
    subcategoria: anuncio.subcategoria,
    condicao: anuncio.condicao,
    modalidade: anuncio.modalidade,
    preco: anuncio.precoCentavos !== null ? mascararPreco(String(anuncio.precoCentavos)) : '',
    aceitaOfertas: anuncio.aceitaOfertas,
    preferenciaTroca: anuncio.preferenciaTroca ?? '',
    valorEstimado: anuncio.valorEstimadoCentavos !== null ? mascararPreco(String(anuncio.valorEstimadoCentavos)) : '',
    trocaQualquerCategoria: anuncio.trocaQualquerCategoria,
    trocaCategorias: anuncio.trocaCategorias,
    trocaComplemento: anuncio.trocaComplemento ?? 'nao_aceita',
    doacaoDestino: anuncio.doacaoDestino ?? 'todos',
    doacaoImediata: anuncio.doacaoImediata,
    entregas: anuncio.entregas,
  };
}

export default function EditarAnuncioScreen({ navigation, route }: TelaAbaProps<'EditarAnuncio'>) {
  const { anuncioId } = route.params;
  const [anuncio, setAnuncio] = useState<AnuncioProprio | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregarAnuncio = useCallback(async () => {
    setErro(null);
    try {
      setAnuncio(await buscarMeuAnuncio(anuncioId));
    } catch (falha) {
      setErro(obterMensagemErro(falha));
    }
  }, [anuncioId]);

  useEffect(() => {
    void carregarAnuncio();
  }, [carregarAnuncio]);

  if (!anuncio) {
    return (
      <Screen>
        <EmptyState
          icone="!"
          titulo={erro ? 'Não foi possível carregar' : 'Carregando anúncio'}
          mensagem={erro ?? undefined}
          carregando={!erro}
          acao={erro ? { label: 'Tentar de novo', onPress: () => void carregarAnuncio() } : undefined}
        />
      </Screen>
    );
  }

  if (!STATUS_EDITAVEIS.includes(anuncio.status) || anuncio.jaConcluido) {
    return (
      <Screen>
        <Banner tom="aviso" titulo="Edição bloqueada">
          Anúncios reservados, em negociação ou concluídos mantêm os dados combinados com o interessado. Volte o status para disponível para editar.
        </Banner>
        <PrimaryButton label="Voltar" variante="secundario" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  return (
    <FormularioAnuncio
      anuncio={anuncio}
      valoresIniciais={converterAnuncioEmFormulario(anuncio)}
      onConcluido={() =>
        navigation.canGoBack() ? navigation.goBack() : navigation.replace('GerenciarAnuncio', { anuncioId, aviso: 'Alterações salvas.' })
      }
    />
  );
}
