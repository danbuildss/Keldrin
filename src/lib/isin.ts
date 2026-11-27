/** ISIN check digit validation (ISO 6166): letters → numbers, Luhn over the digit string. */
export function isValidIsin(isin: string): boolean {
  if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin)) return false;
  const digits = isin
    .slice(0, 11)
    .split("")
    .map((c) => (/[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c))
    .join("");
  let sum = 0;
  let dbl = true; // rightmost digit of the payload (left of the check digit) is doubled
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (dbl) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    dbl = !dbl;
  }
  return (10 - (sum % 10)) % 10 === Number(isin[11]);
}

/** For US/CA ISINs the national identifier is the 9-character CUSIP (chars 3..11). */
export function cusipFromIsin(isin: string): string | null {
  return /^(US|CA)/.test(isin) && isValidIsin(isin) ? isin.slice(2, 11) : null;
}
