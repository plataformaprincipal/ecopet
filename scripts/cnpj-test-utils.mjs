/** Gera CPF válido (11 dígitos) para testes HTTP — alinhado a validateCpfChecksum. */
export function generateValidCpf(seed = Date.now()) {
  const base = String(seed).replace(/\D/g, "").slice(-9).padStart(9, "0");
  const n = base.split("").map(Number);
  const d1 = n.reduce((s, v, i) => s + v * (10 - i), 0) % 11;
  const check1 = d1 < 2 ? 0 : 11 - d1;
  const d2 = [...n, check1].reduce((s, v, i) => s + v * (11 - i), 0) % 11;
  const check2 = d2 < 2 ? 0 : 11 - d2;
  return [...n, check1, check2].join("");
}

/** Gera CNPJ válido (14 dígitos) para testes HTTP — alinhado a validateCnpjChecksum. */
export function generateValidCnpj(seed = Date.now()) {
  const base = String(seed).replace(/\D/g, "").slice(-8).padStart(8, "0") + "0001";
  const twelve = base.slice(0, 12).padEnd(12, "0");

  const calcDigit = (digits, base) => {
    let sum = 0;
    let pos = base - 7;
    for (let i = base; i >= 1; i--) {
      sum += parseInt(digits[base - i], 10) * pos--;
      if (pos < 2) pos = 9;
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const d1 = calcDigit(twelve, 12);
  const withD1 = twelve + String(d1);
  const d2 = calcDigit(withD1, 13);
  return withD1 + String(d2);
}
