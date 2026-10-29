import { zodResolver } from '@hookform/resolvers/zod';
import { usePreventRemove } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ActionSheet from '../../components/ActionSheet';
import Avatar from '../../components/Avatar';
import Banner from '../../components/Banner';
import CamposEndereco from '../../components/CamposEndereco';
import ChipSelect from '../../components/ChipSelect';
import FormTextField from '../../components/FormTextField';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { useSessao } from '../../contexts/SessaoContext';
import type { TelaAbaProps } from '../../navigation/tipos';
import { TIPOS_ANUNCIANTE } from '../../schemas/catalogo';
import { formatarCep } from '../../schemas/comum';
import { editarPerfilFormSchema, type EditarPerfilFormDados } from '../../schemas/usuario';
import { ApiError, obterMensagemErro } from '../../services/api';
import { PermissaoNegadaError, enviarImagem, selecionarImagens, type OrigemImagem } from '../../services/midiaService';
import { atualizarPerfil } from '../../services/perfilService';
import type { UsuarioPrivado } from '../../types/api';
import { confirmarAcao } from '../../utils/confirmarAcao';
import { mascararTelefone } from '../../utils/mascaras';
import { showMessage } from '../../utils/showMessage';

function montarValoresIniciais(usuario: UsuarioPrivado): EditarPerfilFormDados {
  return {
    tipoConta: usuario.tipoConta,
    nomePublico: usuario.nomePublico,
    descricao: usuario.descricao,
    telefone: mascararTelefone(usuario.telefone),
    cep: usuario.endereco ? formatarCep(usuario.endereco.cep) : '',
    logradouro: usuario.endereco?.logradouro ?? '',
    numero: usuario.endereco?.numero ?? '',
    complemento: usuario.endereco?.complemento ?? '',
    bairro: usuario.endereco?.bairro ?? '',
    cidade: usuario.endereco?.cidade ?? '',
    uf: usuario.endereco?.uf ?? '',
  };
}

const LIMITE_DESCRICAO = 400;

function FormularioPerfil({ usuario, navigation }: { usuario: UsuarioPrivado } & Pick<TelaAbaProps<'EditarPerfil'>, 'navigation'>) {
  const { atualizarUsuario } = useSessao();
  const [novaFotoUri, setNovaFotoUri] = useState<string | null>(null);
  const [menuFoto, setMenuFoto] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const salvoRef = useRef(false);

  const { control, handleSubmit, setValue, setFocus, setError, watch, formState } = useForm<EditarPerfilFormDados>({
    resolver: zodResolver(editarPerfilFormSchema),
    defaultValues: montarValoresIniciais(usuario),
    mode: 'onTouched',
  });

  const temAlteracoes = formState.isDirty || novaFotoUri !== null;

  usePreventRemove(temAlteracoes, ({ data }) => {
    if (salvoRef.current) {
      navigation.dispatch(data.action);
      return;
    }
    void confirmarAcao({
      titulo: 'Descartar alterações?',
      mensagem: 'As mudanças no perfil ainda não foram salvas.',
      confirmar: 'Descartar',
      destrutivo: true,
    }).then((descartar) => {
      if (descartar) {
        navigation.dispatch(data.action);
      }
    });
  });

  const handleEscolherFoto = async (origem: OrigemImagem) => {
    try {
      const [imagem] = await selecionarImagens({ origem, rosto: true });
      if (imagem) {
        setNovaFotoUri(imagem.uri);
      }
    } catch (falha) {
      showMessage(
        falha instanceof PermissaoNegadaError ? 'Permissão necessária' : 'Não foi possível abrir',
        obterMensagemErro(falha),
      );
    }
  };

  const handleSalvar = handleSubmit(async (dados) => {
    setErroGeral(null);
    try {
      const fotoChave = novaFotoUri ? (await enviarImagem(novaFotoUri, 'perfil')).chave : undefined;
      const atualizado = await atualizarPerfil(dados, fotoChave);
      atualizarUsuario(atualizado);
      salvoRef.current = true;
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Abas', { screen: 'Perfil' });
      }
    } catch (falha) {
      if (falha instanceof ApiError && falha.campos) {
        Object.entries(falha.campos).forEach(([caminho, mensagem]) =>
          setError((caminho.split('.').pop() ?? caminho) as keyof EditarPerfilFormDados, { message: mensagem }),
        );
      }
      setErroGeral(obterMensagemErro(falha));
    }
  });

  const descricao = watch('descricao');

  return (
    <Screen
      rodape={<PrimaryButton label="Salvar alterações" onPress={handleSalvar} carregando={formState.isSubmitting} desabilitado={!temAlteracoes} />}
    >
      {erroGeral ? <Banner tom="erro">{erroGeral}</Banner> : null}

      <View style={styles.foto}>
        <Avatar nome={usuario.nomePublico} uri={novaFotoUri ?? usuario.fotoUrl} tamanho={96} />
        <View style={styles.fotoTextos}>
          <Text style={styles.fotoTitulo}>Foto do rosto</Text>
          <Text style={styles.fotoDica}>Identifica você na entrega de trocas e doações.</Text>
          <Pressable onPress={() => setMenuFoto(true)} accessibilityRole="button" hitSlop={8} style={styles.fotoBotao}>
            <Text style={styles.fotoBotaoTexto}>{usuario.fotoUrl || novaFotoUri ? 'Trocar foto' : 'Adicionar foto'}</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.secao}>Perfil público</Text>
      <Controller
        control={control}
        name="tipoConta"
        render={({ field, fieldState }) => (
          <ChipSelect
            label="Você anuncia como"
            opcoes={TIPOS_ANUNCIANTE}
            valor={field.value}
            onChange={(valor) => field.onChange(valor)}
            erro={fieldState.error?.message}
          />
        )}
      />
      <Text style={styles.dicaTipo}>Aparece no perfil como declarado; a verificação de organizações chega numa próxima fase.</Text>
      <FormTextField control={control} name="nomePublico" label="Nome público" obrigatorio maxLength={40} dica="Como as pessoas veem você no ReUse." />
      <FormTextField
        control={control}
        name="descricao"
        label="Sobre você"
        multiline
        maxLength={LIMITE_DESCRICAO}
        placeholder="Conte o que você costuma anunciar, horários para combinar entregas…"
        dica={`${descricao.length}/${LIMITE_DESCRICAO}`}
      />

      <Text style={styles.secao}>Contato (privado)</Text>
      <FormTextField
        control={control}
        name="telefone"
        label="Celular"
        obrigatorio
        keyboardType="phone-pad"
        mascara={mascararTelefone}
        autoComplete="tel"
      />

      <Text style={styles.secao}>Endereço</Text>
      <CamposEndereco control={control} setValue={setValue} setFocus={setFocus} />

      <ActionSheet
        visivel={menuFoto}
        titulo="Foto do rosto"
        onFechar={() => setMenuFoto(false)}
        acoes={[
          { id: 'camera', label: 'Tirar selfie', descricao: 'Abre a câmera frontal', onPress: () => handleEscolherFoto('camera') },
          { id: 'galeria', label: 'Escolher da galeria', onPress: () => handleEscolherFoto('galeria') },
        ]}
      />
    </Screen>
  );
}

export default function EditarPerfilScreen({ navigation }: TelaAbaProps<'EditarPerfil'>) {
  const { usuario } = useSessao();

  if (!usuario) {
    return (
      <Screen>
        <Banner tom="aviso">Entre na sua conta para editar o perfil.</Banner>
        <PrimaryButton label="Entrar" onPress={() => navigation.replace('Entrar')} />
      </Screen>
    );
  }

  return <FormularioPerfil usuario={usuario} navigation={navigation} />;
}

const styles = StyleSheet.create({
  foto: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  fotoTextos: { flex: 1, marginLeft: 16 },
  fotoTitulo: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text },
  fotoDica: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: 2 },
  fotoBotao: { marginTop: 8, alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
  fotoBotaoTexto: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.teal },
  dicaTipo: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: -12, marginBottom: 18 },
  secao: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.primary, marginTop: 20, marginBottom: 14 },
});
