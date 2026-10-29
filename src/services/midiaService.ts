import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import type { UploadResposta } from '../types/api';
import { requisitar } from './api';

// Câmera e galeria do aparelho (expo-image-picker) e envio das fotos para a API (R2).

export type OrigemImagem = 'camera' | 'galeria';

export interface ImagemSelecionada {
  uri: string;
}

interface OpcoesSelecao {
  origem: OrigemImagem;
  // Câmera frontal e recorte quadrado para a foto do rosto.
  rosto?: boolean;
  // Quantidade máxima na galeria (seleção múltipla).
  limite?: number;
}

export class PermissaoNegadaError extends Error {}

// Lado maior da foto enviada: suficiente para tela cheia e mantém o upload leve em rede móvel.
const LADO_MAXIMO = 1600;

async function garantirPermissao(origem: OrigemImagem) {
  const permissao =
    origem === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissao.granted) {
    throw new PermissaoNegadaError(
      origem === 'camera'
        ? 'Permita o acesso à câmera nas configurações do aparelho para tirar a foto.'
        : 'Permita o acesso às fotos nas configurações do aparelho para escolher imagens.',
    );
  }
}

async function otimizarImagem(asset: ImagePicker.ImagePickerAsset) {
  const contexto = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > LADO_MAXIMO) {
    contexto.resize(asset.width >= asset.height ? { width: LADO_MAXIMO } : { height: LADO_MAXIMO });
  }
  const imagem = await contexto.renderAsync();
  const resultado = await imagem.saveAsync({ compress: 0.75, format: SaveFormat.JPEG });
  return resultado.uri;
}

// Retorna as imagens escolhidas (vazio se a pessoa cancelar).
export async function selecionarImagens({ origem, rosto = false, limite = 1 }: OpcoesSelecao): Promise<ImagemSelecionada[]> {
  // No navegador não há permissão a pedir para escolher arquivos; a câmera abre pelo seletor do sistema.
  if (Platform.OS !== 'web') {
    await garantirPermissao(origem);
  }

  const resultado =
    origem === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          allowsEditing: rosto,
          aspect: rosto ? [1, 1] : undefined,
          cameraType: rosto ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          // Recorte e seleção múltipla não funcionam juntos no seletor nativo.
          allowsEditing: rosto,
          aspect: rosto ? [1, 1] : undefined,
          allowsMultipleSelection: !rosto && limite > 1,
          selectionLimit: rosto ? 1 : limite,
          orderedSelection: true,
        });

  if (resultado.canceled) {
    return [];
  }

  const imagens = await Promise.all(resultado.assets.slice(0, limite).map(otimizarImagem));
  return imagens.map((uri) => ({ uri }));
}

export async function enviarImagem(uri: string, tipo: 'perfil' | 'anuncio') {
  const arquivo = await fetch(uri);
  const dados = await arquivo.blob();
  return requisitar<UploadResposta>(`/uploads?tipo=${tipo}`, {
    metodo: 'POST',
    arquivo: { dados, tipo: dados.type || 'image/jpeg' },
  });
}
