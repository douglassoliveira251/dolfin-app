import { monthKey } from "../format";
import type { Lancamento } from "../schema";

export function mesCompetencia(l: Lancamento): string | null {
  if (l.efetivado && l.dataEfetivacao) return l.dataEfetivacao.slice(0, 7);
  if (l.cartaoId && l.competenciaFatura) return l.competenciaFatura;
  return l.data ? l.data.slice(0, 7) : null;
}

export function isInMonthCompetencia(l: Lancamento, monthDate: Date): boolean {
  return mesCompetencia(l) === monthKey(monthDate);
}
