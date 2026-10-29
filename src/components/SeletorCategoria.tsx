import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { CATEGORIAS_ORDENADAS, MINIMO_CARACTERES_BUSCA, buscarSubcategorias, normalizarBusca } from '../schemas/catalogo';
import Glifo from './Glifo';
import TextField from './TextField';

// ==TIPOS==
interface SeletorCategoriaProps {
  categoria: string | null;
  subcategoria: string | null;
  onChange: (categoria: string | null, subcategoria: string | null) => void;
  // "categoria": escolhe só a categoria (ex.: aceita troca por); a busca por subcategoria leva à categoria dela.
  modo?: 'subcategoria' | 'categoria';
  rotuloBusca?: string;
}

interface ResultadoLista {
  chave: string;
  categoriaId: string;
  subcategoriaId: string | null;
  titulo: string;
  caminho: string | null;
}

// Categorias em uma coluna, em ordem alfabética: tocar numa categoria abre as subcategorias dela.
// A busca (a partir de 2 letras) vai direto à subcategoria, sem precisar saber em qual categoria ela está.
export default function SeletorCategoria({ categoria, subcategoria, onChange, modo = 'subcategoria', rotuloBusca = 'Buscar categoria' }: SeletorCategoriaProps) {
  const soCategoria = modo === 'categoria';
  // ==ESTADOS==
  const [busca, setBusca] = useState('');
  const [expandida, setExpandida] = useState<string | null>(categoria);

  const resultados = useMemo<ResultadoLista[]>(() => {
    const subcategorias = buscarSubcategorias(busca).map((item) => ({
      chave: `${item.categoriaId}-${item.subcategoriaId}`,
      categoriaId: item.categoriaId,
      // No modo categoria, a subcategoria só serve para encontrar a categoria.
      subcategoriaId: soCategoria ? null : item.subcategoriaId,
      titulo: item.subcategoriaLabel,
      caminho: item.categoriaLabel,
    }));
    if (!soCategoria) {
      return subcategorias;
    }
    // Categorias cujo nome casa com a busca vêm antes das subcategorias.
    const termo = normalizarBusca(busca);
    const categorias = CATEGORIAS_ORDENADAS.filter((item) => normalizarBusca(item.label).includes(termo)).map((item) => ({
      chave: item.id,
      categoriaId: item.id,
      subcategoriaId: null,
      titulo: item.label,
      caminho: null,
    }));
    return termo.length >= MINIMO_CARACTERES_BUSCA ? [...categorias, ...subcategorias] : [];
  }, [busca, soCategoria]);
  const buscando = normalizarBusca(busca).length >= MINIMO_CARACTERES_BUSCA;

  // ==HANDLERS==
  const handleEscolherResultado = (categoriaId: string, subcategoriaId: string | null) => {
    onChange(categoriaId, subcategoriaId);
    setExpandida(categoriaId);
    setBusca('');
  };

  const handleAlternarCategoria = (id: string) => {
    if (soCategoria) {
      onChange(categoria === id ? null : id, null);
      return;
    }
    setExpandida((atual) => (atual === id ? null : id));
  };

  const handleEscolherSubcategoria = (categoriaId: string, subcategoriaId: string | null) => {
    const jaSelecionada = categoria === categoriaId && subcategoria === subcategoriaId;
    onChange(jaSelecionada ? null : categoriaId, jaSelecionada ? null : subcategoriaId);
  };

  // ==RENDER==
  return (
    <View>
      <TextField
        label={rotuloBusca}
        value={busca}
        onChangeText={setBusca}
        placeholder="Ex.: prateleiras, bicicleta, livros"
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />

      {buscando ? (
        resultados.length > 0 ? (
          <View accessibilityRole="list">
            {resultados.map((item) => {
              const ativo = categoria === item.categoriaId && (soCategoria ? item.caminho === null : subcategoria === item.subcategoriaId);
              return (
                <Pressable
                  key={item.chave}
                  onPress={() => handleEscolherResultado(item.categoriaId, item.subcategoriaId)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: ativo }}
                  accessibilityLabel={item.caminho ? `${item.titulo}, em ${item.caminho}` : item.titulo}
                  style={({ pressed }) => [styles.linha, pressed && styles.pressionado]}
                >
                  <View style={styles.linhaTextos}>
                    <Text style={[styles.rotulo, ativo && styles.rotuloAtivo]}>{item.titulo}</Text>
                    {item.caminho ? <Text style={styles.caminho}>{soCategoria ? `em ${item.caminho}` : item.caminho}</Text> : null}
                  </View>
                  {ativo ? <Glifo simbolo="✓" tamanho={18} cor={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={styles.semResultado}>Nenhuma categoria encontrada para "{busca.trim()}".</Text>
        )
      ) : (
        <View accessibilityRole="list">
          {CATEGORIAS_ORDENADAS.map((item) => {
            const aberta = !soCategoria && expandida === item.id;
            const temSelecao = categoria === item.id;
            return (
              <View key={item.id}>
                <Pressable
                  onPress={() => handleAlternarCategoria(item.id)}
                  accessibilityRole="button"
                  accessibilityState={soCategoria ? { selected: temSelecao } : { expanded: aberta }}
                  style={({ pressed }) => [styles.linha, pressed && styles.pressionado]}
                >
                  <Text style={[styles.rotulo, styles.linhaTextos, temSelecao && styles.rotuloAtivo]}>{item.label}</Text>
                  {soCategoria ? (
                    temSelecao ? <Glifo simbolo="✓" tamanho={18} cor={colors.primary} /> : null
                  ) : (
                    <Text style={[styles.seta, aberta && styles.setaAberta]}>›</Text>
                  )}
                </Pressable>

                {aberta ? (
                  <View style={styles.subcategorias}>
                    {[{ id: null, label: `Tudo em ${item.label}` }, ...item.subcategorias].map((sub) => {
                      const ativo = temSelecao && subcategoria === sub.id;
                      return (
                        <Pressable
                          key={sub.id ?? 'todas'}
                          onPress={() => handleEscolherSubcategoria(item.id, sub.id)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: ativo }}
                          style={({ pressed }) => [styles.subLinha, pressed && styles.pressionado]}
                        >
                          <Text style={[styles.subRotulo, styles.linhaTextos, ativo && styles.rotuloAtivo]}>{sub.label}</Text>
                          {ativo ? <Glifo simbolo="✓" tamanho={16} cor={colors.primary} /> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  linhaTextos: { flex: 1 },
  pressionado: { opacity: 0.7 },
  rotulo: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text },
  rotuloAtivo: { fontFamily: fonts.bodyBold, color: colors.primary },
  caminho: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginTop: 1 },
  seta: { fontFamily: fonts.bodyBold, fontSize: 20, color: colors.textMuted, transform: [{ rotate: '90deg' }] },
  setaAberta: { transform: [{ rotate: '-90deg' }] },
  // Subcategorias recuadas com uma linha à esquerda: mostra que pertencem à categoria aberta.
  subcategorias: { marginLeft: 6, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: colors.divider, marginVertical: 4 },
  subLinha: { flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingVertical: 6 },
  subRotulo: { fontFamily: fonts.body, fontSize: 15, color: colors.text },
  semResultado: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, paddingVertical: 12 },
});
