export const CURRENCY = 'XAF';
export const LOCALE = 'fr-CM';

export function formatXAF(amount: number | null | undefined) {
  const n = typeof amount === 'number' ? amount : Number(amount) || 0;
  return n.toLocaleString(LOCALE, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 });
}

export function formatXAFDecimals(amount: number | null | undefined) {
  const n = typeof amount === 'number' ? amount : Number(amount) || 0;
  return n.toLocaleString(LOCALE, { style: 'currency', currency: CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
