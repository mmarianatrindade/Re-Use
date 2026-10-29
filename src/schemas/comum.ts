// Funções puras compartilhadas entre o app e a API (sem dependências de React Native ou Workers).

export const IDADE_MINIMA = 18;

// Versão vigente dos Termos de Uso e da Política de Privacidade; muda sempre que o texto mudar,
// e o aceite fica registrado com a versão aceita.
export const TERMOS_VERSAO = '2026-09-21';

export function extrairDigitos(valor: string) {
  return valor.replace(/\D/g, '');
}

// Validação dos dígitos verificadores do CPF (rejeita sequências repetidas como 111.111.111-11).
export function validarCpf(valor: string) {
  const cpf = extrairDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const calcularDigito = (base: string) => {
    const soma = base.split('').reduce((total, digito, indice) => total + Number(digito) * (base.length + 1 - indice), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const primeiro = calcularDigito(cpf.slice(0, 9));
  const segundo = calcularDigito(cpf.slice(0, 10));
  return primeiro === Number(cpf[9]) && segundo === Number(cpf[10]);
}

// Celular brasileiro com DDD: 11 dígitos, começando por 9 após o DDD.
export function validarCelular(valor: string) {
  const digitos = extrairDigitos(valor);
  return /^[1-9]{2}9\d{8}$/.test(digitos);
}

// Converte "DD/MM/AAAA" em data ISO (AAAA-MM-DD); retorna null se a data não existir.
export function converterDataBrParaIso(valor: string) {
  const correspondencia = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor.trim());
  if (!correspondencia) {
    return null;
  }

  const [, dia, mes, ano] = correspondencia;
  const data = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));
  const valida =
    data.getUTCFullYear() === Number(ano) && data.getUTCMonth() === Number(mes) - 1 && data.getUTCDate() === Number(dia);

  return valida ? `${ano}-${mes}-${dia}` : null;
}

export function calcularIdade(dataIso: string, hoje = new Date()) {
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  let idade = hoje.getFullYear() - ano;
  const aindaNaoFezAniversario = hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia);
  if (aindaNaoFezAniversario) {
    idade -= 1;
  }
  return idade;
}

export function validarCep(valor: string) {
  return /^\d{8}$/.test(extrairDigitos(valor));
}

export function formatarCep(valor: string) {
  const digitos = extrairDigitos(valor).slice(0, 8);
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
}
