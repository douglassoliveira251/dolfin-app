import { monthKey } from "../format";
import type { AppState, Cartao } from "../schema";
import { isInMonthCompetencia } from "./lancamentos";

/** Chave (YYYY-MM) da fatura ainda aberta (não fechou) na data de hoje. */
export function competenciaAberta(cartao: Cartao): string {
  const hoje = new Date();
  const base = hoje.getDate() >= cartao.diaFechamento ? new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1) : hoje;
  return monthKey(base);
}

function vencimentoDaFatura(cartao: Cartao, ano: number, mes: number): Date {
  return cartao.diaVencimento < cartao.diaFechamento
    ? new Date(ano, mes + 1, cartao.diaVencimento)
    : new Date(ano, mes, cartao.diaVencimento);
}

/** Data de vencimento da fatura já fechada e com pendências, ou null se não há nada a pagar. */
export function faturaPrecisaPagar(state: AppState, cartao: Cartao): Date | null {
  const hoje = new Date();
  if (hoje.getDate() < cartao.diaFechamento) return null;
  const compFechada = monthKey(hoje);
  const itens = state.lancamentos.filter(
    (l) => l.cartaoId === cartao.id && (l.competenciaFatura || l.data.slice(0, 7)) === compFechada,
  );
  if (!itens.length || !itens.some((l) => !l.efetivado)) return null;
  return vencimentoDaFatura(cartao, hoje.getFullYear(), hoje.getMonth());
}

/** Vencimento da fatura referente ao mês de competência informado. */
export function vencimentoCompetencia(cartao: Cartao, monthDate: Date): Date {
  return vencimentoDaFatura(cartao, monthDate.getFullYear(), monthDate.getMonth());
}

export function totalFaturaMes(state: AppState, cartaoId: string, monthDate: Date): number {
  const itens = state.lancamentos.filter((l) => l.cartaoId === cartaoId && isInMonthCompetencia(l, monthDate));
  return itens.reduce((sum, l) => sum + (l.tipo === "despesa" ? l.valor : -l.valor), 0);
}
