import AuthGate from '../../components/AuthGate';
import type { TelaAbaProps } from '../../navigation/tipos';
import FormularioAnuncio from './publicar/FormularioAnuncio';

export default function PublicarScreen({ navigation }: TelaAbaProps<'AnunciarInicio'>) {
  return (
    <AuthGate titulo="Publique em poucos passos" mensagem="Entre na sua conta para vender, trocar ou doar um item.">
      <FormularioAnuncio
        onConcluido={(anuncio) => {
          // Abre "Meu anúncio" na aba Negociações, com a lista por baixo (initial: false) para o voltar funcionar.
          navigation.navigate('Negociacoes', {
            screen: 'GerenciarAnuncio',
            params: { anuncioId: anuncio.id, aviso: 'Anúncio publicado! Ele já aparece para quem procura.' },
            initial: false,
          });
        }}
      />
    </AuthGate>
  );
}
