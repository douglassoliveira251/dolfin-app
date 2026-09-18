import { monthKey, round2, todayStr } from "../format";
import type { AppState } from "../schema";
import { saldoContaAte, saldoPrevistoConta } from "./contas";
import { primeiroDiaMes, ultimoDiaMes, diaAnteriorA } from "../format";
import { realizadoOrcamento, valorPlanejadoEfetivo } from "./orcamento";

export function saldoTotalAte(state: AppState, dateStrInclusive: string | null, onlyEfetivados: boolean): number {
  return round2(state.contas.filter((c) => c.ativo).reduce((sum, c) => sum + saldoContaAte(state, c.id, dateStrInclusive, onlyEfetivados), 0));
}

export function despesasVencidasNaoPagas(state: AppState, dateStrInclusive: string): number {
  let total = 0;
  state.lancamentos.forEach((l) => {
    if (l.tipo !== "despesa" || l.efetivado) return;
    if (l.cartaoId) {
      const cartao = state.cartoes.find((c) => c.id === l.cartaoId);
      if (!cartao) return;
      const comp = l.competenciaFatura || l.data.slice(0, 7);
      const [y, m] = comp.split("-").map(Number);
      const mesVenc = cartao.diaVencimento < cartao.diaFechamento ? new Date(y, m, 1) : new Date(y, m - 1, 1);
      const vencStr = new Date(mesVenc.getFullYear(), mesVenc.getMonth(), cartao.diaVencimento).toISOString().slice(0, 10);
      if (vencStr <= dateStrInclusive) total += l.valor;
    } else {
      if (l.data <= dateStrInclusive) total += l.valor;
    }
  });
  return total;
}

export interface DashboardSaldos {
  saldoInicial: number;
  saldoAtual: number;
  saldoPrevisto: number;
}

export function dashboardSaldos(state: AppState, monthDate: Date): DashboardSaldos {
  const inicioMes = primeiroDiaMes(monthDate);
  const fimMes = ultimoDiaMes(monthDate);
  const diaAnterior = diaAnteriorA(inicioMes);
  const saldoInicial = saldoTotalAte(state, diaAnterior, true) - despesasVencidasNaoPagas(state, diaAnterior);
  const hoje = todayStr();
  const saldoAtual = saldoTotalAte(state, hoje < fimMes ? hoje : fimMes, true);
  let saldoPrevisto = state.contas.filter((c) => c.ativo).reduce((sum, c) => sum + saldoPrevistoConta(state, c.id, monthDate), 0);
  if (state.configuracoes.orcamentoAfetaPrevisto) {
    const mesKey = monthKey(monthDate);
    const orcamentosDoMes = state.orcamentos.filter(
      (o) => o.mesReferencia === mesKey || (!o.mesReferencia && (!o.validoApartirDe || mesKey >= monthKey(new Date(o.validoApartirDe + "T00:00:00")))),
    );
    orcamentosDoMes.forEach((o) => {
      const cat = o.categoriaId ? state.categorias.find((c) => c.id === o.categoriaId) : null;
      if (!cat) return;
      const realizado = realizadoOrcamento(state, o.categoriaId, monthDate);
      const restante = valorPlanejadoEfetivo(o, monthDate) - realizado;
      if (restante <= 0) return;
      if (cat.tipo === "entrada") saldoPrevisto += restante;
      else saldoPrevisto -= restante;
    });
  }
  return { saldoInicial, saldoAtual, saldoPrevisto };
}
