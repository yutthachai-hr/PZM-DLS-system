const thb = new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const thb0 = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 });
const int = new Intl.NumberFormat("th-TH");
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export const money = (n: number) => thb.format(n);
export const money0 = (n: number) => thb0.format(n);
export const count = (n: number) => int.format(n);
export const compactNum = (n: number) => compact.format(n);
export const signed = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "") + thb.format(Math.abs(n));
export const pct = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;
