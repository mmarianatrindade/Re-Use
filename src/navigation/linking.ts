import type { LinkingOptions, PathConfig } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import type { AbasParamList, RootStackParamList } from './tipos';

// Tipada à parte: dentro de LinkingOptions o TypeScript não infere o segundo nível de navegadores aninhados.
const configAbas: PathConfig<AbasParamList> = {
  screens: {
    Inicio: { screens: { HomeInicio: '' } },
    Anuncios: {
      initialRouteName: 'AnunciosLista',
      screens: {
        AnunciosLista: 'anuncios',
        AnuncioDetalhe: 'anuncios/:anuncioId',
        PerfilPublico: 'usuarios/:userId',
      },
    },
    Anunciar: { screens: { AnunciarInicio: 'anunciar' } },
    Negociacoes: {
      initialRouteName: 'NegociacoesLista',
      screens: {
        NegociacoesLista: 'negociacoes',
        GerenciarAnuncio: 'meus-anuncios/:anuncioId',
        EditarAnuncio: 'meus-anuncios/:anuncioId/editar',
        DestacarAnuncio: 'meus-anuncios/:anuncioId/destaque',
      },
    },
    Perfil: {
      initialRouteName: 'PerfilInicio',
      screens: {
        PerfilInicio: 'perfil',
        EditarPerfil: 'perfil/editar',
        Salvos: 'salvos',
      },
    },
  },
};

// Os links dos e-mails (https://.../ativar?token=... e /redefinir-senha?token=...) abrem estas telas.
// Na web, também definem as URLs de cada tela. Cada tela interna tem uma URL, dentro da aba mais natural.
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'https://reuse-fiapweb2.pages.dev'],
  config: {
    screens: {
      Abas: configAbas,
      Entrar: 'entrar',
      Cadastro: 'cadastro',
      ConfirmarEmail: 'confirmar-email',
      AtivarConta: 'ativar',
      RecuperarSenha: 'recuperar-senha',
      RedefinirSenha: 'redefinir-senha',
      Termos: 'termos',
    },
  },
};
