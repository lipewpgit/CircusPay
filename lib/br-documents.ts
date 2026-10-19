export function normalizeDocument(value: string) {
  return value.replace(/\D/g, "");
}

function allEqual(value: string) {
  return /^(\d)\1+$/.test(value);
}

export function isValidCPF(value: string) {
  const cpf = normalizeDocument(value);
  if (cpf.length !== 11 || allEqual(cpf)) return false;

  const digit = (size: number) => {
    let sum = 0;
    for (let index = 0; index < size; index += 1) sum += Number(cpf[index]) * (size + 1 - index);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

export function isValidCNPJ(value: string) {
  const cnpj = normalizeDocument(value);
  if (cnpj.length !== 14 || allEqual(cnpj)) return false;

  const calculate = (base: string, weights: number[]) => {
    const sum = base.split("").reduce((total, number, index) => total + Number(number) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const first = calculate(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calculate(`${cnpj.slice(0, 12)}${first}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return first === Number(cnpj[12]) && second === Number(cnpj[13]);
}

export function isValidDocument(value: string, accountType?: "cpf" | "cnpj") {
  const document = normalizeDocument(value);
  if (accountType === "cpf") return isValidCPF(document);
  if (accountType === "cnpj") return isValidCNPJ(document);
  return document.length === 11 ? isValidCPF(document) : isValidCNPJ(document);
}

export function formatDocument(value: string) {
  const document = normalizeDocument(value);
  if (document.length === 11) return document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (document.length === 14) return document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return value;
}
