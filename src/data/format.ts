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

export function fmtMoneyShort(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1000) return (v < 0 ? "-" : "") + "R$ " + (abs / 1000).toFixed(abs % 1000 === 0 ? 0 : 1).replace(".", ",") + "k";
  return "R$ " + v.toFixed(0);
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export function monthKey(d: Date): string {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

const MONTH_NAMES_PT_FULL = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function fmtMonthLabel(d: Date): string {
  const nome = MONTH_NAMES_PT_FULL[d.getMonth()];
  return nome.charAt(0).toUpperCase() + nome.slice(1) + " de " + d.getFullYear();
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowTimeStr(): string {
  const d = new Date();
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

export function nowLocalIso(): string {
  return todayStr() + "T" + nowTimeStr();
}

export function ultimoDiaMes(monthDate: Date): string {
  const d = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  return d.toISOString().slice(0, 10);
}

export function primeiroDiaMes(monthDate: Date): string {
  return monthKey(monthDate) + "-01";
}

export function diaAnteriorA(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function sortByData<T extends { data: string; hora?: string }>(itens: T[], ordenacaoDecrescente: boolean): T[] {
  const dir = ordenacaoDecrescente === false ? 1 : -1;
  return [...itens].sort((a, b) => {
    const cmp = a.data.localeCompare(b.data);
    if (cmp !== 0) return dir * cmp;
    const ha = a.hora || "";
    const hb = b.hora || "";
    return dir * ha.localeCompare(hb);
  });
}
