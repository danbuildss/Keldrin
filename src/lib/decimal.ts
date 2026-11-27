import { WAD } from "../config.ts";

/** Format an integer scaled by 10^decimals as an exact decimal string (no floats). */
export function formatUnits(value: bigint, decimals: number): string {
  const neg = value < 0n;
  const abs = neg ? -value : value;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = (abs % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${neg ? "-" : ""}${whole}${frac ? `.${frac}` : ""}`;
}

/** after/before as an exact decimal truncated to `digits` places (both WAD integers). */
export function ratio(after: bigint, before: bigint, digits = 18): string {
  if (before === 0n) throw new RangeError("division by zero multiplier");
  const scale = 10n ** BigInt(digits);
  return formatUnits((after * scale) / before, digits);
}

export const wadToDecimal = (w: bigint) => formatUnits(w, 18);

/** Parse an exact decimal string into a WAD integer (truncating beyond 18 places). */
export function decimalToWad(s: string): bigint {
  if (!/^\d+(\.\d+)?$/.test(s)) throw new RangeError(`not a plain decimal: ${s}`);
  const [w, f = ""] = s.split(".");
  return BigInt(w) * WAD + BigInt((f + "0".repeat(18)).slice(0, 18));
}

/**
 * Does an API double agree with an exact WAD value to within the double's precision?
 * Doubles carry ~15-17 significant digits, so we compare at relative 1e-12.
 */
export function doubleMatchesWad(d: number, wad: bigint): boolean {
  if (!Number.isFinite(d) || d <= 0) return false;
  const exact = Number(wad) / 1e18;
  return Math.abs(exact - d) <= Math.abs(exact) * 1e-12;
}
