import type { DadosCardAnuncio } from '../components/CardAnuncio';
import { chavesLocais, lerLocal, salvarLocal } from './armazenamento';

// Anúncios salvos ficam no aparelho (AsyncStorage): funcionam sem conta e sem conexão.
// Guardamos só o necessário para mostrar o cartão; o detalhe sempre vem atualizado da API.
export interface AnuncioSalvo extends DadosCardAnuncio {
  salvoEm: string;
}

export async function listarSalvos() {
  return (await lerLocal<AnuncioSalvo[]>(chavesLocais.salvos)) ?? [];
}

export async function estaSalvo(anuncioId: string) {
  return (await listarSalvos()).some((item) => item.id === anuncioId);
}

// Salva ou remove; devolve o novo estado (true = salvo).
export async function alternarSalvo(anuncio: DadosCardAnuncio) {
  const salvos = await listarSalvos();
  const existe = salvos.some((item) => item.id === anuncio.id);
  const atualizados = existe
    ? salvos.filter((item) => item.id !== anuncio.id)
    : [{ ...anuncio, salvoEm: new Date().toISOString() }, ...salvos];
  await salvarLocal(chavesLocais.salvos, atualizados);
  return !existe;
}

export async function removerSalvo(anuncioId: string) {
  const salvos = await listarSalvos();
  await salvarLocal(
    chavesLocais.salvos,
    salvos.filter((item) => item.id !== anuncioId),
  );
}
