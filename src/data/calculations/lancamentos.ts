import { monthKey } from "../format";
import type { AppState, Lancamento } from "../schema";

export function mesCompetencia(l: Lancamento): string | null {
  if (l.efetivado && l.dataEfetivacao) return l.dataEfetivacao.slice(0, 7);
  if (l.cartaoId && l.competenciaFatura) return l.competenciaFatura;
  return l.data ? l.data.slice(0, 7) : null;
}

export function isInMonthCompetencia(l: Lancamento, monthDate: Date): boolean {
  return mesCompetencia(l) === monthKey(monthDate);
}

export function isInMonth(dateStr: string | null | undefined, monthDate: Date): boolean {
  if (!dateStr) return false;
  return dateStr.slice(0, 7) === monthKey(monthDate);
}

export function lancamentosDoMes(state: AppState, monthDate: Date): Lancamento[] {
  return state.lancamentos.filter((l) => isInMonthCompetencia(l, monthDate));
}

export interface ParteCategoria {
  categoriaId: string | null;
  subcategoriaId: string | null;
  valor: number;
}

export function partesCategoriaDoLancamento(l: Lancamento): ParteCategoria[] {
  if (Array.isArray(l.categoriasSplits) && l.categoriasSplits.length > 1) {
    return l.categoriasSplits.map((s) => ({ categoriaId: s.categoriaId, subcategoriaId: s.subcategoriaId, valor: Number(s.valor) || 0 }));
  }
  return [{ categoriaId: l.categoriasIds[0] || null, subcategoriaId: l.categoriasIds[1] || null, valor: l.valor }];
}
