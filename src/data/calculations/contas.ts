import { monthKey, round2, todayStr, ultimoDiaMes } from "../format";
import type { AppState, Lancamento } from "../schema";

export function signedValueForConta(l: Lancamento, contaId: string): number {
  if (l.tipo === "transferencia") {
    if (l.contaId === contaId) return -l.valor;
    if (l.contaDestinoId === contaId) return l.valor;
    return 0;
  }
  if (l.contaId !== contaId) return 0;
  return l.tipo === "entrada" ? l.valor : -l.valor;
}

export function saldoContaAte(
  state: AppState,
  contaId: string,
  dateStrInclusive: string | null,
  onlyEfetivados: boolean,
): number {
  const conta = state.contas.find((c) => c.id === contaId);
  if (!conta) return 0;
  let total = conta.saldoInicial;
  state.lancamentos.forEach((l) => {
    if (onlyEfetivados && !l.efetivado) return;
    const dataEfetiva = l.efetivado && l.dataEfetivacao ? l.dataEfetivacao.slice(0, 10) : l.data;
    if (dateStrInclusive && dataEfetiva > dateStrInclusive) return;
    total += signedValueForConta(l, contaId);
  });
  state.investimentos.aportes.forEach((a) => {
    if (a.contaId !== contaId) return;
    if (onlyEfetivados && !a.efetivado) return;
    if (dateStrInclusive && a.data > dateStrInclusive) return;
    total += a.tipo === "resgate" ? a.valor : -a.valor;
  });
  return round2(total);
}

function mesImpactoConta(state: AppState, l: Lancamento): string | null {
  if (!l.cartaoId) return l.data ? l.data.slice(0, 7) : null;
  const cartao = state.cartoes.find((c) => c.id === l.cartaoId);
  if (!cartao) return l.data ? l.data.slice(0, 7) : null;
  const comp = l.competenciaFatura || l.data.slice(0, 7);
  const [y, m] = comp.split("-").map(Number);
  const mesVenc = cartao.diaVencimento < cartao.diaFechamento ? new Date(y, m, 1) : new Date(y, m - 1, 1);
  return monthKey(mesVenc);
}

export function saldoPrevistoConta(state: AppState, contaId: string, monthDate: Date): number {
  const fimMes = ultimoDiaMes(monthDate);
  const mesKeyAlvo = monthKey(monthDate);
  const hoje = todayStr();
  const atual = saldoContaAte(state, contaId, hoje < fimMes ? hoje : fimMes, true);
  let previstosNoMes = 0;
  state.lancamentos.forEach((l) => {
    if (l.efetivado) return;
    const impacto = mesImpactoConta(state, l);
    if (!impacto || impacto > mesKeyAlvo) return;
    previstosNoMes += signedValueForConta(l, contaId);
  });
  state.investimentos.aportes.forEach((a) => {
    if (a.contaId !== contaId || a.efetivado) return;
    if (!a.data || a.data.slice(0, 7) > mesKeyAlvo) return;
    previstosNoMes += a.tipo === "resgate" ? a.valor : -a.valor;
  });
  return round2(atual + previstosNoMes);
}
