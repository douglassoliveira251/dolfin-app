export function round2(v: number): number {
  const n = Number(v) || 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function ehNegativo(v: number): boolean {
  return round2(v) < 0;
}

export function fmtMoney(v: number, hidden = false): string {
  let n = round2(v);
  if (Object.is(n, -0)) n = 0;
  const formatted = n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return hidden ? formatted.replace(/[0-9]/g, "•") : formatted;
}

export function fmtMoneyIn(v: number, moeda: string, hidden = false): string {
  let n = round2(v);
  if (Object.is(n, -0)) n = 0;
  try {
    const formatted = n.toLocaleString("pt-BR", { style: "currency", currency: moeda || "BRL" });
    return hidden ? formatted.replace(/[0-9]/g, "•") : formatted;
  } catch {
    return fmtMoney(n, hidden);
  }
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export function monthKey(d: Date): string {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}
