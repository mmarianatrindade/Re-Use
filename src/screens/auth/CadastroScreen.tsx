import { zodResolver } from '@hookform/resolvers/zod';
import { usePreventRemove } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { BackHandler, StyleSheet, Text, View, type ScrollView } from 'react-native';
import Banner from '../../components/Banner';
import CamposEndereco from '../../components/CamposEndereco';
import FotoRostoPicker from '../../components/FotoRostoPicker';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import StepIndicator from '../../components/StepIndicator';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { useSessao } from '../../contexts/SessaoContext';
import type { RootScreenProps } from '../../navigation/tipos';
import { cadastroFormSchema, type CadastroFormDados } from '../../schemas/usuario';
import type { SessaoResposta } from '../../types/api';
import { ApiError, obterMensagemErro } from '../../services/api';
import { enviarImagem } from '../../services/midiaService';
import { atualizarFotoPerfil } from '../../services/perfilService';
import { confirmarAcao } from '../../utils/confirmarAcao';
import EtapaConta from './cadastro/EtapaConta';
import EtapaDadosPessoais from './cadastro/EtapaDadosPessoais';
import EtapaRevisao from './cadastro/EtapaRevisao';
import { ETAPAS_CADASTRO, VALORES_INICIAIS_CADASTRO, encontrarEtapaDoCampo } from './cadastro/etapas';

export default function CadastroScreen({ navigation }: RootScreenProps<'Cadastro'>) {
  const { cadastrar, atualizarUsuario } = useSessao();
  const [etapa, setEtapa] = useState(0);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  // Ref (e não estado): o reset de navegação acontece antes de um novo render.
  const concluidoRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  const { control, handleSubmit, trigger, setValue, setFocus, setError, watch, formState } = useForm<CadastroFormDados>({
    resolver: zodResolver(cadastroFormSchema),
    defaultValues: VALORES_INICIAIS_CADASTRO,
    mode: 'onTouched',
  });

  const etapaAtual = ETAPAS_CADASTRO[etapa];
  const ultimaEtapa = etapa === ETAPAS_CADASTRO.length - 1;

  // Sair no meio do cadastro descarta os dados digitados: pede confirmação antes.
  usePreventRemove(formState.isDirty, ({ data }) => {
    if (concluidoRef.current) {
      navigation.dispatch(data.action);
      return;
    }
    void confirmarAcao({
      titulo: 'Sair do cadastro?',
      mensagem: 'Os dados preenchidos serão descartados.',
      confirmar: 'Sair',
      destrutivo: true,
    }).then((sair) => {
      if (sair) {
        navigation.dispatch(data.action);
      }
    });
  });

  // No Android, o botão voltar do sistema volta uma etapa antes de sair da tela.
  useEffect(() => {
    const assinatura = BackHandler.addEventListener('hardwareBackPress', () => {
      if (etapa > 0) {
        setEtapa((atual) => atual - 1);
        return true;
      }
      return false;
    });
    return () => assinatura.remove();
  }, [etapa]);

  const irParaEtapa = (indice: number) => {
    setEtapa(indice);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleAvancar = async () => {
    const valido = await trigger(etapaAtual.campos, { shouldFocus: true });
    if (valido) {
      irParaEtapa(etapa + 1);
    }
  };

  const handleCriarConta = handleSubmit(async (dados) => {
    setErroGeral(null);
    let resposta: SessaoResposta;
    try {
      resposta = await cadastrar(dados);
    } catch (erro) {
      if (erro instanceof ApiError && erro.campos) {
        // A API usa "endereco.cep"; no formulário o campo é só "cep".
        const campos = Object.entries(erro.campos).map(([caminho, mensagem]) => [caminho.split('.').pop() ?? caminho, mensagem] as const);
        campos.forEach(([campo, mensagem]) => setError(campo as keyof CadastroFormDados, { message: mensagem }));
        irParaEtapa(encontrarEtapaDoCampo(campos[0]?.[0] ?? ''));
      }
      setErroGeral(obterMensagemErro(erro));
      return;
    }

    concluidoRef.current = true;
    // A conta já existe: a foto é enviada com a sessão recém-criada.
    try {
      const upload = await enviarImagem(dados.fotoUri, 'perfil');
      atualizarUsuario(await atualizarFotoPerfil(upload.chave));
    } catch {
      // Sem a foto a conta continua válida; o perfil pede para completar antes de publicar.
    }

    // Com a confirmação de e-mail desligada na API, a conta já pode publicar: vai direto para o perfil.
    if (resposta.usuario.exigeConfirmacaoEmail) {
      navigation.reset({
        index: 1,
        routes: [{ name: 'Abas', params: { screen: 'Perfil' } }, { name: 'ConfirmarEmail', params: { linkDev: resposta.linkDev } }],
      });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Abas', params: { screen: 'Perfil' } }] });
    }
  });

  return (
    <Screen
      scrollRef={scrollRef}
      rodape={
        <View style={styles.acoes}>
          {etapa > 0 ? (
            <PrimaryButton label="Voltar" variante="secundario" onPress={() => irParaEtapa(etapa - 1)} style={styles.voltar} />
          ) : null}
          <PrimaryButton
            label={ultimaEtapa ? 'Criar minha conta' : 'Continuar'}
            onPress={ultimaEtapa ? handleCriarConta : handleAvancar}
            carregando={formState.isSubmitting}
            style={styles.avancar}
          />
        </View>
      }
    >
      <StepIndicator etapaAtual={etapa + 1} totalEtapas={ETAPAS_CADASTRO.length} titulo={etapaAtual.titulo} />

      {erroGeral ? <Banner tom="erro">{erroGeral}</Banner> : null}

      {etapa === 0 ? <EtapaConta control={control} /> : null}
      {etapa === 1 ? <EtapaDadosPessoais control={control} /> : null}
      {etapa === 2 ? <CamposEndereco control={control} setValue={setValue} setFocus={setFocus} /> : null}
      {etapa === 3 ? (
        <>
          <Text style={styles.explicacao}>
            Sua foto aparece no perfil e identifica você na entrega de trocas e doações, trazendo segurança para os dois lados.
          </Text>
          <Controller
            control={control}
            name="fotoUri"
            render={({ field, fieldState }) => (
              <FotoRostoPicker uri={field.value || null} onChange={field.onChange} erro={fieldState.error?.message} />
            )}
          />
        </>
      ) : null}
      {etapa === 4 ? <EtapaRevisao control={control} dados={watch()} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  acoes: { flexDirection: 'row', gap: 10 },
  voltar: { flex: 1 },
  avancar: { flex: 2 },
  explicacao: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textMuted, marginBottom: 20 },
});
