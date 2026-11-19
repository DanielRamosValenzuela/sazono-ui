export function isValidRut(raw: string): boolean {
  const match = /^(\d{7,8})-?([\dK])$/.exec(raw.replace(/[.\s]/g, "").toUpperCase());

  if (!match || Number(match[1]) < 1_000_000) {
    return false;
  }

  let sum = 0;
  let factor = 2;

  for (let i = match[1].length - 1; i >= 0; i--) {
    sum += Number(match[1][i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }

  const remainder = 11 - (sum % 11);
  const check =
    remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder);

  return check === match[2];
}
