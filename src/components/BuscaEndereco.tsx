import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { radii } from '../constants/radii';
import { ApiError } from '../services/api';
import { buscarEnderecoSugerido, buscarSugestoesEndereco, gerarSessaoBuscaEndereco } from '../services/cepService';
import type { EnderecoSugerido, SugestaoEndereco } from '../types/api';
import TextField from './TextField';

interface BuscaEnderecoProps {
  onSelecionar: (endereco: EnderecoSugerido) => void;
}

// Espera a pessoa parar de digitar antes de consultar (cada consulta ao Google tem custo).
const ATRASO_MS = 350;

// Busca de endereço com sugestões (Google Places). Se a busca não estiver configurada na API, o campo some
// e o formulário continua com CEP + preenchimento manual.
export default function BuscaEndereco({ onSelecionar }: BuscaEnderecoProps) {
  const [texto, setTexto] = useState('');
  const [sugestoes, setSugestoes] = useState<SugestaoEndereco[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [disponivel, setDisponivel] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const sessao = useRef(gerarSessaoBuscaEndereco());
  const ultimoSelecionado = useRef('');

  useEffect(() => {
    const termo = texto.trim();
    if (termo.length < 3 || termo === ultimoSelecionado.current) {
      setSugestoes([]);
      return;
    }

    let cancelado = false;
    const temporizador = setTimeout(async () => {
      setCarregando(true);
      try {
        const resultado = await buscarSugestoesEndereco(termo, sessao.current);
        if (!cancelado) {
          setSugestoes(resultado);
          setErro(null);
        }
      } catch (falha) {
        if (cancelado) return;
        if (falha instanceof ApiError && falha.codigo === 'PLACES_NAO_CONFIGURADO') {
          setDisponivel(false);
        } else {
          setErro('Não foi possível buscar agora. Preencha pelo CEP.');
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }, ATRASO_MS);

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [texto]);

  const handleSelecionar = async (sugestao: SugestaoEndereco) => {
    setCarregando(true);
    try {
      const endereco = await buscarEnderecoSugerido(sugestao.id, sessao.current);
      ultimoSelecionado.current = sugestao.texto;
      setTexto(sugestao.texto);
      setSugestoes([]);
      onSelecionar(endereco);
    } catch {
      setErro('Não foi possível carregar esse endereço. Preencha pelo CEP.');
    } finally {
      setCarregando(false);
      // Nova sessão para a próxima busca.
      sessao.current = gerarSessaoBuscaEndereco();
    }
  };

  if (!disponivel) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TextField
        label="Buscar endereço"
        value={texto}
        onChangeText={setTexto}
        placeholder="Digite rua e número ou o CEP"
        autoCorrect={false}
        autoComplete="street-address"
        dica={erro ?? 'Escolha uma sugestão para preencher os campos abaixo.'}
        acessorio={carregando ? <ActivityIndicator color={colors.primary} /> : null}
      />
      {sugestoes.length > 0 ? (
        <View style={styles.lista} accessibilityRole="list">
          {sugestoes.map((sugestao) => (
            <Pressable
              key={sugestao.id}
              onPress={() => void handleSelecionar(sugestao)}
              accessibilityRole="button"
              accessibilityLabel={`Usar endereço ${sugestao.texto}`}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressionado]}
            >
              <Text style={styles.itemTexto}>{sugestao.texto}</Text>
            </Pressable>
          ))}
          <Text style={styles.creditos}>Sugestões do Google</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 4 },
  lista: {
    marginTop: -10,
    marginBottom: 18,
    backgroundColor: colors.surface,
    borderRadius: radii.inner,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  item: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemPressionado: { backgroundColor: colors.surfaceAlt },
  itemTexto: { fontFamily: fonts.body, fontSize: 15, lineHeight: 20, color: colors.text },
  creditos: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, textAlign: 'right', paddingHorizontal: 12, paddingVertical: 6 },
});
