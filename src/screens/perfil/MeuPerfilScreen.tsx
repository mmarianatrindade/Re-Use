import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AuthGate from '../../components/AuthGate';
import Banner from '../../components/Banner';
import EmptyState from '../../components/EmptyState';
import PerfilPublicoCard from '../../components/PerfilPublicoCard';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { tipografia } from '../../constants/tipografia';
import { useSessao } from '../../contexts/SessaoContext';
import type { TelaAbaProps } from '../../navigation/tipos';
import { formatarCep } from '../../schemas/comum';
import { obterMensagemErro } from '../../services/api';
import { buscarPerfilPublico } from '../../services/perfilService';
import type { UsuarioPublico } from '../../types/api';
import { confirmarAcao } from '../../utils/confirmarAcao';
import { mascararTelefone } from '../../utils/mascaras';

function ConteudoMeuPerfil({ navigation }: TelaAbaProps<'PerfilInicio'>) {
  const { usuario, sair, recarregarUsuario } = useSessao();
  const [perfil, setPerfil] = useState<UsuarioPublico | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [privadosAbertos, setPrivadosAbertos] = useState(false);

  const carregarPerfil = useCallback(async () => {
    setErro(null);
    try {
      const atual = usuario ?? (await recarregarUsuario());
      if (atual) {
        setPerfil(await buscarPerfilPublico(atual.id));
      }
    } catch (falha) {
      setErro(obterMensagemErro(falha));
    }
  }, [usuario, recarregarUsuario]);

  // Recarrega ao voltar para a aba (ex.: depois de editar o perfil ou concluir um anúncio).
  useFocusEffect(
    useCallback(() => {
      void carregarPerfil();
    }, [carregarPerfil]),
  );

  const handleAtualizar = async () => {
    setAtualizando(true);
    await recarregarUsuario().catch(() => null);
    await carregarPerfil();
    setAtualizando(false);
  };

  const handleSair = async () => {
    const confirmado = await confirmarAcao({
      titulo: 'Sair da conta?',
      mensagem: 'A sessão será encerrada neste aparelho. Rascunhos não publicados serão apagados.',
      confirmar: 'Sair',
      destrutivo: true,
    });
    if (confirmado) {
      await sair();
    }
  };

  if (!usuario) {
    return (
      <Screen>
        <EmptyState
          icone="!"
          titulo={erro ? 'Sem conexão' : 'Carregando perfil'}
          mensagem={erro ?? undefined}
          carregando={!erro}
          acao={erro ? { label: 'Tentar de novo', onPress: () => void carregarPerfil() } : undefined}
        />
      </Screen>
    );
  }

  const endereco = usuario.endereco;
  const dadosPrivados = [
    { label: 'Nome completo', valor: usuario.nomeCompleto },
    { label: 'E-mail', valor: usuario.email },
    { label: 'Celular', valor: mascararTelefone(usuario.telefone) },
    { label: 'CPF', valor: usuario.cpfMascarado },
    {
      label: 'Endereço',
      valor: endereco
        ? `${endereco.logradouro}, ${endereco.numero}${endereco.complemento ? ` – ${endereco.complemento}` : ''}\n${endereco.bairro}, ${endereco.cidade}/${endereco.uf}  ${formatarCep(endereco.cep)}`
        : 'Não informado',
    },
  ];

  const itensMenu = [
    { rotulo: 'Salvos', destino: () => navigation.navigate('Salvos') },
    { rotulo: 'Meus anúncios e negociações', destino: () => navigation.navigate('Negociacoes') },
    { rotulo: 'Termos de Uso e Privacidade', destino: () => navigation.navigate('Termos') },
  ];

  return (
    <Screen atualizando={atualizando} onAtualizar={handleAtualizar}>
      {usuario.exigeConfirmacaoEmail && !usuario.emailConfirmado ? (
        <Banner
          tom="aviso"
          titulo="Confirme seu e-mail"
          acao={<PrimaryButton label="Confirmar agora" compacto onPress={() => navigation.navigate('ConfirmarEmail')} />}
        >
          Sem a confirmação, você ainda não pode publicar itens.
        </Banner>
      ) : null}
      {!usuario.fotoUrl ? (
        <Banner
          tom="aviso"
          titulo="Falta a foto do rosto"
          acao={<PrimaryButton label="Adicionar foto" compacto onPress={() => navigation.navigate('EditarPerfil')} />}
        >
          Ela identifica você na entrega de trocas e doações e é necessária para publicar.
        </Banner>
      ) : null}

      {erro ? <Banner tom="erro">{erro}</Banner> : null}

      {perfil ? (
        <PerfilPublicoCard perfil={perfil} onAnuncioPress={(anuncioId) => navigation.navigate('GerenciarAnuncio', { anuncioId })} />
      ) : (
        <EmptyState titulo="Carregando perfil" carregando />
      )}

      <PrimaryButton label="Editar perfil" onPress={() => navigation.navigate('EditarPerfil')} style={styles.editar} />
      <Pressable
        onPress={() => navigation.navigate('PerfilPublico', { userId: usuario.id })}
        accessibilityRole="link"
        hitSlop={6}
        style={styles.link}
      >
        <Text style={styles.linkTexto}>Ver como os outros veem meu perfil</Text>
      </Pressable>

      {/* Dados privados recolhidos: só você vê, e raramente precisa consultar */}
      <View style={styles.secao}>
        <Pressable
          onPress={() => setPrivadosAbertos((atual) => !atual)}
          accessibilityRole="button"
          accessibilityState={{ expanded: privadosAbertos }}
          style={styles.secaoCabecalho}
        >
          <View style={styles.secaoTextos}>
            <Text style={tipografia.tituloBloco}>Dados privados</Text>
            <Text style={tipografia.apoio}>Só você vê. Nunca aparecem no perfil público.</Text>
          </View>
          <Text style={[styles.seta, privadosAbertos && styles.setaAberta]}>›</Text>
        </Pressable>
        {privadosAbertos
          ? dadosPrivados.map((dado) => (
              <View key={dado.label} style={styles.dado}>
                <Text style={tipografia.legenda}>{dado.label}</Text>
                <Text style={[tipografia.corpo, styles.dadoValor]}>{dado.valor}</Text>
              </View>
            ))
          : null}
      </View>

      <View style={styles.secao}>
        {itensMenu.map((item) => (
          <Pressable key={item.rotulo} onPress={item.destino} accessibilityRole="button" style={({ pressed }) => [styles.menuItem, pressed && styles.pressionado]}>
            <Text style={tipografia.corpo}>{item.rotulo}</Text>
            <Text style={styles.seta}>›</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.secao}>
        <PrimaryButton label="Sair da conta" variante="perigo" onPress={handleSair} />
      </View>
    </Screen>
  );
}

export default function MeuPerfilScreen(props: TelaAbaProps<'PerfilInicio'>) {
  return (
    <AuthGate titulo="Seu perfil no ReUse" mensagem="Entre para ver sua reputação, seus selos e seu impacto.">
      <ConteudoMeuPerfil {...props} />
    </AuthGate>
  );
}
const styles = StyleSheet.create({
  editar: { marginTop: 28 },
  link: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginTop: 4, marginBottom: 12 },
  linkTexto: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.teal },
  secao: { paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  secaoCabecalho: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  secaoTextos: { flex: 1, gap: 2 },
  seta: { fontFamily: fonts.bodyBold, fontSize: 24, color: colors.textMuted },
  setaAberta: { transform: [{ rotate: '90deg' }] },
  dado: { paddingTop: 14 },
  dadoValor: { marginTop: 2 },
  menuItem: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pressionado: { opacity: 0.7 },
});
