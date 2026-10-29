import { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { PermissaoNegadaError, selecionarImagens, type OrigemImagem } from '../services/midiaService';
import { showMessage } from '../utils/showMessage';
import PrimaryButton from './PrimaryButton';

interface FotoRostoPickerProps {
  uri: string | null;
  onChange: (uri: string) => void;
  erro?: string;
}

const ORIENTACOES = ['Rosto inteiro, de frente', 'Sem óculos escuros, boné ou máscara', 'Lugar bem iluminado'];

// Foto do rosto: identifica a pessoa na entrega de trocas e doações. Abre a câmera frontal com recorte quadrado.
export default function FotoRostoPicker({ uri, onChange, erro }: FotoRostoPickerProps) {
  const [processando, setProcessando] = useState(false);

  const handleCapturar = async (origem: OrigemImagem) => {
    setProcessando(true);
    try {
      const [imagem] = await selecionarImagens({ origem, rosto: true });
      if (imagem) {
        onChange(imagem.uri);
      }
    } catch (falha) {
      showMessage(
        falha instanceof PermissaoNegadaError ? 'Permissão necessária' : 'Não foi possível abrir',
        falha instanceof Error ? falha.message : 'Tente novamente.',
      );
    } finally {
      setProcessando(false);
    }
  };

  return (
    <View>
      <View style={styles.linha}>
        <View style={[styles.moldura, erro && !uri ? styles.molduraErro : null]}>
          {processando ? (
            <ActivityIndicator color={colors.primary} />
          ) : uri ? (
            <Image source={{ uri }} style={styles.foto} accessibilityLabel="Sua foto de rosto" />
          ) : (
            <Text style={styles.molduraTexto}>Sua foto</Text>
          )}
        </View>

        <View style={styles.orientacoes}>
          {ORIENTACOES.map((texto) => (
            <Text key={texto} style={styles.orientacao}>
              ✓ {texto}
            </Text>
          ))}
        </View>
      </View>

      {erro && !uri ? <Text style={styles.erro}>{erro}</Text> : null}

      <PrimaryButton
        label={uri ? 'Tirar outra selfie' : 'Tirar selfie'}
        onPress={() => handleCapturar('camera')}
        desabilitado={processando}
        style={styles.botao}
      />
      <PrimaryButton
        label="Escolher da galeria"
        variante="secundario"
        onPress={() => handleCapturar('galeria')}
        desabilitado={processando}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 16 },
  moldura: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.teal,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  molduraErro: { borderColor: colors.danger },
  molduraTexto: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textMuted },
  foto: { width: '100%', height: '100%' },
  orientacoes: { flex: 1, gap: 8 },
  orientacao: { fontFamily: fonts.body, fontSize: 14, lineHeight: 19, color: colors.text },
  erro: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.danger, marginBottom: 12 },
  botao: { marginBottom: 10 },
});
