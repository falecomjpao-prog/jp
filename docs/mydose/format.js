export function fmtMoneyBRL(n) {
  return "R$ " + (n ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtMoneyBRLCompact(n) {
  return "R$ " + Math.round(n ?? 0).toLocaleString("pt-BR");
}

export function fmtUsd(n) {
  return "$" + (n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtInt(n) {
  return Math.round(n ?? 0).toLocaleString("pt-BR");
}

export function fmtPct(n, digits = 1) {
  return (n ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits }) + "%";
}

export function fmtRoas(n) {
  return (n ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "x";
}

export function fmtDeltaPct(n) {
  const sign = n > 0 ? "+" : "";
  return sign + n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
}
