export interface ContextoContaLocal {
  usuarioId: string | null;
  geracao: number;
}

let atual: ContextoContaLocal = { usuarioId: null, geracao: 0 };

export function capturarContaLocal(): ContextoContaLocal {
  return { ...atual };
}

export function ativarContaLocal(usuarioId: string) {
  if (atual.usuarioId !== usuarioId) atual = { usuarioId, geracao: atual.geracao + 1 };
  return capturarContaLocal();
}

export function encerrarContaLocal() {
  atual = { usuarioId: null, geracao: atual.geracao + 1 };
}

export function contaLocalValida(contexto: ContextoContaLocal) {
  return contexto.geracao === atual.geracao && contexto.usuarioId === atual.usuarioId;
}
