import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { BackHandler, StyleSheet, View, type ScrollView } from 'react-native';
import AnuncioPreview from '../../../components/AnuncioPreview';
import Banner from '../../../components/Banner';
import FotosAnuncioPicker from '../../../components/FotosAnuncioPicker';
import PrimaryButton from '../../../components/PrimaryButton';
import Screen from '../../../components/Screen';
import StepIndicator from '../../../components/StepIndicator';
import { useSessao } from '../../../contexts/SessaoContext';
import { useResponsive } from '../../../hooks/useResponsive';
import {
  anuncioFormSchema,
  converterPrecoParaCentavos,
  exigeLocalizacao,
  type AnuncioFormDados,
  type Modalidade,
} from '../../../schemas/anuncio';
import { ApiError, obterMensagemErro } from '../../../services/api';
import { montarDadosAnuncio, publicarAnuncio, salvarEdicaoAnuncio } from '../../../services/anunciosService';
import { chavesLocais, lerLocal, removerLocal, salvarLocal } from '../../../services/armazenamento';
import { enviarImagem } from '../../../services/midiaService';
import type { AnuncioProprio } from '../../../types/api';
import { confirmarAcao } from '../../../utils/confirmarAcao';
import EtapaDetalhes from './EtapaDetalhes';
import EtapaEntrega from './EtapaEntrega';
import EtapaModalidade from './EtapaModalidade';
import { ETAPAS_ANUNCIO, VALORES_INICIAIS_ANUNCIO, encontrarEtapaDoCampoAnuncio } from './etapas';

interface RascunhoAnuncio {
  valores: AnuncioFormDados;
  etapa: number;
  salvoEm: string;
}

interface FormularioAnuncioProps {
  // Sem anúncio: criação (com rascunho local). Com anúncio: edição.
  anuncio?: AnuncioProprio;
  valoresIniciais?: AnuncioFormDados;
  onConcluido: (anuncio: AnuncioProprio) => void;
}

// Nomes da API que diferem dos campos do formulário.
const CAMPOS_API_PARA_FORM: Record<string, string> = { imagens: 'fotos', precoCentavos: 'preco' };

// Rascunho salvo no AsyncStorage pouco depois de cada alteração: fechar o app não perde o anúncio.
const ATRASO_RASCUNHO_MS = 600;

export default function FormularioAnuncio({ anuncio, valoresIniciais, onConcluido }: FormularioAnuncioProps) {
  const navigation = useNavigation();
  const { usuario } = useSessao();
  const { gutter } = useResponsive();
  const editando = anuncio !== undefined;
  const [etapa, setEtapa] = useState(0);
  const [erroGeral, setErroGeral] = useState<{ mensagem: string; codigo?: string } | null>(null);
  const [progresso, setProgresso] = useState<string | null>(null);
  const [rascunhoRestaurado, setRascunhoRestaurado] = useState(false);
  const rascunhoCarregado = useRef(editando);
  const temporizadorRascunho = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scrollRef = useRef<ScrollView>(null);

  const { control, handleSubmit, trigger, reset, watch, getValues, setValue, setError, formState } = useForm<AnuncioFormDados>({
    resolver: zodResolver(anuncioFormSchema),
    defaultValues: valoresIniciais ?? VALORES_INICIAIS_ANUNCIO,
    mode: 'onTouched',
  });

  const etapaAtual = ETAPAS_ANUNCIO[etapa];
  const ultimaEtapa = etapa === ETAPAS_ANUNCIO.length - 1;
  const localizacaoPerfil = usuario?.endereco ?? null;
  const emailPendente = usuario?.exigeConfirmacaoEmail === true && !usuario.emailConfirmado;
  const podePublicar = editando || (usuario !== null && !emailPendente && usuario.fotoUrl !== null);

  // Restaura o rascunho salvo neste aparelho (só na criação).
  useEffect(() => {
    if (editando) {
      return;
    }
    lerLocal<RascunhoAnuncio>(chavesLocais.rascunhoAnuncio).then((rascunho) => {
      if (rascunho) {
        // Mescla com os padrões: rascunhos salvos por versões antigas do app não têm os campos novos.
        reset({ ...VALORES_INICIAIS_ANUNCIO, ...rascunho.valores }, { keepDefaultValues: true });
        setEtapa(Math.min(rascunho.etapa, ETAPAS_ANUNCIO.length - 1));
        setRascunhoRestaurado(true);
      }
      rascunhoCarregado.current = true;
    });
  }, [editando, reset]);

  useEffect(() => {
    if (editando) {
      return;
    }
    const assinatura = watch((valores) => {
      if (!rascunhoCarregado.current) {
        return;
      }
      clearTimeout(temporizadorRascunho.current);
      temporizadorRascunho.current = setTimeout(() => {
        const rascunho: RascunhoAnuncio = { valores: valores as AnuncioFormDados, etapa, salvoEm: new Date().toISOString() };
        void salvarLocal(chavesLocais.rascunhoAnuncio, rascunho);
      }, ATRASO_RASCUNHO_MS);
    });
    return () => {
      clearTimeout(temporizadorRascunho.current);
      assinatura.unsubscribe();
    };
  }, [editando, watch, etapa]);

  // Android: o botão voltar do sistema volta uma etapa.
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
    if (!editando && rascunhoCarregado.current) {
      void salvarLocal(chavesLocais.rascunhoAnuncio, { valores: getValues(), etapa: indice, salvoEm: new Date().toISOString() });
    }
  };

  const handleAvancar = async () => {
    const valido = await trigger(etapaAtual.campos, { shouldFocus: true });
    if (!valido) {
      return;
    }
    if (etapa === 3 && exigeLocalizacao(getValues('entregas')) && !localizacaoPerfil) {
      setError('entregas', { message: 'Cadastre seu endereço no perfil ou escolha outra forma de entrega.' });
      return;
    }
    irParaEtapa(etapa + 1);
  };

  const handleDescartarRascunho = async () => {
    const confirmado = await confirmarAcao({
      titulo: 'Descartar rascunho?',
      mensagem: 'As fotos e os dados preenchidos serão apagados deste aparelho.',
      confirmar: 'Descartar',
      destrutivo: true,
    });
    if (confirmado) {
      await removerLocal(chavesLocais.rascunhoAnuncio);
      reset(VALORES_INICIAIS_ANUNCIO);
      setRascunhoRestaurado(false);
      irParaEtapa(0);
    }
  };

  const handlePublicar = handleSubmit(async (dados) => {
    setErroGeral(null);
    try {
      // Envia só as fotos novas; as já enviadas mantêm a chave (evita reenvio ao tentar de novo).
      const fotos = [...dados.fotos];
      const pendentes = fotos.filter((foto) => !foto.chave).length;
      let enviadas = 0;
      for (let indice = 0; indice < fotos.length; indice += 1) {
        if (!fotos[indice].chave) {
          enviadas += 1;
          setProgresso(`Enviando foto ${enviadas} de ${pendentes}`);
          const upload = await enviarImagem(fotos[indice].uri, 'anuncio');
          fotos[indice] = { uri: fotos[indice].uri, chave: upload.chave };
          setValue('fotos', [...fotos]);
        }
      }

      setProgresso(editando ? 'Salvando alterações' : 'Publicando');
      const corpo = montarDadosAnuncio(dados, fotos.map((foto) => foto.chave ?? ''));
      const resultado = anuncio ? await salvarEdicaoAnuncio(anuncio.id, corpo) : await publicarAnuncio(corpo);

      if (!editando) {
        // Pausa o rascunho enquanto limpa, para nenhum salvamento pendente recriá-lo.
        rascunhoCarregado.current = false;
        clearTimeout(temporizadorRascunho.current);
        await removerLocal(chavesLocais.rascunhoAnuncio);
        reset(VALORES_INICIAIS_ANUNCIO);
        setEtapa(0);
        setRascunhoRestaurado(false);
        rascunhoCarregado.current = true;
      }
      onConcluido(resultado);
    } catch (erro) {
      if (erro instanceof ApiError && erro.campos) {
        const [primeiro] = Object.keys(erro.campos);
        if (primeiro) {
          irParaEtapa(encontrarEtapaDoCampoAnuncio(CAMPOS_API_PARA_FORM[primeiro] ?? primeiro));
        }
      }
      setErroGeral({ mensagem: obterMensagemErro(erro), codigo: erro instanceof ApiError ? erro.codigo : undefined });
    } finally {
      setProgresso(null);
    }
  });

  const valores = watch();
  const dadosPreview = {
    fotos: valores.fotos.map((foto) => foto.uri),
    titulo: valores.titulo,
    descricao: valores.descricao,
    categoria: valores.categoria,
    condicao: valores.condicao,
    modalidade: (valores.modalidade || 'venda') as Modalidade,
    precoCentavos: valores.modalidade === 'venda' ? converterPrecoParaCentavos(valores.preco) : null,
    aceitaOfertas: valores.aceitaOfertas,
    preferenciaTroca: valores.preferenciaTroca || null,
    subcategoria: valores.subcategoria,
    valorEstimadoCentavos: valores.modalidade === 'troca' ? converterPrecoParaCentavos(valores.valorEstimado) : null,
    trocaQualquerCategoria: valores.trocaQualquerCategoria,
    trocaCategorias: valores.trocaCategorias,
    trocaComplemento: valores.trocaComplemento,
    doacaoDestino: valores.doacaoDestino,
    doacaoImediata: valores.doacaoImediata,
    entregas: valores.entregas,
    localizacao: localizacaoPerfil,
  };

  const acaoDoErro =
    erroGeral?.codigo === 'EMAIL_NAO_CONFIRMADO' ? (
      <PrimaryButton label="Confirmar e-mail" compacto onPress={() => navigation.navigate('ConfirmarEmail')} />
    ) : erroGeral?.codigo === 'FOTO_OBRIGATORIA' || erroGeral?.codigo === 'ENDERECO_OBRIGATORIO' ? (
      <PrimaryButton label="Completar perfil" compacto onPress={() => navigation.navigate('EditarPerfil')} />
    ) : undefined;

  return (
    <Screen
      scrollRef={scrollRef}
      rodape={
        <View style={styles.acoes}>
          {etapa > 0 ? (
            <PrimaryButton label="Voltar" variante="secundario" onPress={() => irParaEtapa(etapa - 1)} style={styles.voltar} />
          ) : null}
          <PrimaryButton
            label={progresso ?? (ultimaEtapa ? (editando ? 'Salvar alterações' : 'Publicar anúncio') : 'Continuar')}
            onPress={ultimaEtapa ? handlePublicar : handleAvancar}
            carregando={formState.isSubmitting}
            desabilitado={ultimaEtapa && !podePublicar}
            style={styles.avancar}
          />
        </View>
      }
    >
      <StepIndicator etapaAtual={etapa + 1} totalEtapas={ETAPAS_ANUNCIO.length} titulo={etapaAtual.titulo} />

      {!podePublicar && usuario ? (
        <Banner
          tom="aviso"
          titulo={emailPendente ? 'Confirme seu e-mail para publicar' : 'Adicione a foto do rosto para publicar'}
          acao={
            <PrimaryButton
              label={emailPendente ? 'Confirmar e-mail' : 'Adicionar foto'}
              compacto
              onPress={() => (emailPendente ? navigation.navigate('ConfirmarEmail') : navigation.navigate('EditarPerfil'))}
            />
          }
        >
          Você pode preencher o anúncio agora: ele fica salvo como rascunho neste aparelho.
        </Banner>
      ) : null}

      {rascunhoRestaurado ? (
        <Banner
          tom="info"
          titulo="Rascunho recuperado"
          acao={<PrimaryButton label="Descartar rascunho" variante="secundario" compacto onPress={handleDescartarRascunho} />}
        >
          Continuamos de onde você parou.
        </Banner>
      ) : null}

      {erroGeral ? (
        <Banner tom="erro" acao={acaoDoErro}>
          {erroGeral.mensagem}
        </Banner>
      ) : null}

      {etapa === 0 ? (
        <Controller
          control={control}
          name="fotos"
          render={({ field, fieldState }) => (
            <FotosAnuncioPicker fotos={field.value} onChange={field.onChange} erro={fieldState.error?.message} />
          )}
        />
      ) : null}
      {etapa === 1 ? <EtapaDetalhes control={control} onCategoriaAlterada={() => setValue('subcategoria', '')} /> : null}
      {etapa === 2 ? <EtapaModalidade control={control} /> : null}
      {etapa === 3 ? <EtapaEntrega control={control} localizacaoPerfil={localizacaoPerfil} /> : null}
      {etapa === 4 ? <AnuncioPreview dados={dadosPreview} gutter={gutter} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  acoes: { flexDirection: 'row', gap: 10 },
  voltar: { flex: 1 },
  avancar: { flex: 2 },
});
