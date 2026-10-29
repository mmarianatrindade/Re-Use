import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Modalidade } from '../schemas/anuncio';

// Telas internas que podem abrir dentro de qualquer aba, mantendo o menu inferior visível.
export type TelasCompartilhadasParamList = {
  AnuncioDetalhe: { anuncioId: string };
  PerfilPublico: { userId: string };
  EditarPerfil: undefined;
  // aviso: mensagem de sucesso exibida ao chegar (ex.: depois de publicar).
  GerenciarAnuncio: { anuncioId: string; aviso?: string };
  EditarAnuncio: { anuncioId: string };
  DestacarAnuncio: { anuncioId: string };
  Salvos: undefined;
};

// Transforma a interseção num objeto simples: o React Navigation não infere os deep links a partir de "A & B".
type Achatar<T> = { [Chave in keyof T]: T[Chave] };

// Todas as pilhas das abas usam este mesmo tipo: cada uma registra a sua tela inicial + as compartilhadas.
export type PilhaAbaParamList = Achatar<TelasCompartilhadasParamList & {
  HomeInicio: undefined;
  // A modalidade opcional já abre a vitrine filtrada (ex.: atalhos da Home).
  // busca/buscaEm: texto vindo da busca do hero da Home (buscaEm força repetir a mesma busca).
  AnunciosLista: { modalidade?: Modalidade; busca?: string; buscaEm?: number } | undefined;
  AnunciarInicio: undefined;
  // Central do que está em andamento: hoje os próprios anúncios; propostas e chat na Fase 4.
  NegociacoesLista: undefined;
  PerfilInicio: undefined;
}>;

export type AbasParamList = {
  Inicio: NavigatorScreenParams<PilhaAbaParamList> | undefined;
  Anuncios: NavigatorScreenParams<PilhaAbaParamList> | undefined;
  Anunciar: NavigatorScreenParams<PilhaAbaParamList> | undefined;
  Negociacoes: NavigatorScreenParams<PilhaAbaParamList> | undefined;
  Perfil: NavigatorScreenParams<PilhaAbaParamList> | undefined;
};

// Pilha raiz: as abas e os fluxos de tela cheia (acesso e termos), sem menu inferior.
export type RootStackParamList = {
  Abas: NavigatorScreenParams<AbasParamList> | undefined;
  Entrar: undefined;
  Cadastro: undefined;
  ConfirmarEmail: { linkDev?: string } | undefined;
  AtivarConta: { token?: string };
  RecuperarSenha: undefined;
  RedefinirSenha: { token?: string };
  Termos: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

// Telas dentro das abas: navegam na própria pilha, trocam de aba e abrem os fluxos da raiz.
export type TelaAbaProps<T extends keyof PilhaAbaParamList> = CompositeScreenProps<
  NativeStackScreenProps<PilhaAbaParamList, T>,
  CompositeScreenProps<BottomTabScreenProps<AbasParamList>, NativeStackScreenProps<RootStackParamList>>
>;

declare global {
  namespace ReactNavigation {
    // Tipagem global para useNavigation(): telas da raiz e as internas das abas.
    interface RootParamList extends RootStackParamList, TelasCompartilhadasParamList {}
  }
}
