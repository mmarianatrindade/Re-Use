import { useCallback, useEffect, useState } from 'react';
import EmptyState from '../../components/EmptyState';
import PerfilPublicoCard from '../../components/PerfilPublicoCard';
import Screen from '../../components/Screen';
import type { TelaAbaProps } from '../../navigation/tipos';
import { obterMensagemErro } from '../../services/api';
import { buscarPerfilPublico } from '../../services/perfilService';
import type { UsuarioPublico } from '../../types/api';

export default function PerfilPublicoScreen({ navigation, route }: TelaAbaProps<'PerfilPublico'>) {
  const { userId } = route.params;
  const [perfil, setPerfil] = useState<UsuarioPublico | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregarPerfil = useCallback(async () => {
    setErro(null);
    try {
      setPerfil(await buscarPerfilPublico(userId));
    } catch (falha) {
      setErro(obterMensagemErro(falha));
    }
  }, [userId]);

  useEffect(() => {
    void carregarPerfil();
  }, [carregarPerfil]);

  return (
    <Screen>
      {perfil ? (
        <PerfilPublicoCard perfil={perfil} onAnuncioPress={(anuncioId) => navigation.navigate('AnuncioDetalhe', { anuncioId })} />
      ) : (
        <EmptyState
          icone="!"
          titulo={erro ? 'Não foi possível carregar' : 'Carregando perfil'}
          mensagem={erro ?? undefined}
          carregando={!erro}
          acao={erro ? { label: 'Tentar de novo', onPress: () => void carregarPerfil() } : undefined}
        />
      )}
    </Screen>
  );
}
