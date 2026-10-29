import { extrairDigitos } from '../schemas/comum';

// Máscaras aplicadas enquanto a pessoa digita. Os valores continuam validados pelos schemas.

export function mascararCpf(valor: string) {
  const d = extrairDigitos(valor).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function mascararTelefone(valor: string) {
  const d = extrairDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function mascararData(valor: string) {
  const d = extrairDigitos(valor).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export function mascararCep(valor: string) {
  const d = extrairDigitos(valor).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

// Preço digitado da direita para a esquerda, como em apps de banco: "12345" vira "123,45".
export function mascararPreco(valor: string) {
  const d = extrairDigitos(valor).replace(/^0+/, '').slice(0, 10);
  if (!d) return '';
  const centavos = Number(d);
  return (centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
