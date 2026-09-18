import { diaAnteriorA, primeiroDiaMes } from "../format";
import type { AppState, AtualizacaoAtivo } from "../schema";
import { isInMonth } from "./lancamentos";

export function valorAtualAtivo(state: AppState, ativoId: string, ateData?: string | null): number {
  const ativo = state.investimentos.ativos.find((a) => a.id === ativoId);
  let upds = state.investimentos.atualizacoes.filter((a) => a.ativoId === ativoId);
  if (ateData) upds = upds.filter((a) => a.data <= ateData);
  upds = [...upds].sort((a, b) => a.data.localeCompare(b.data) || (a.criadoEm || "").localeCompare(b.criadoEm || ""));
  const ultima = upds.length ? upds[upds.length - 1] : null;
  const base = ultima ? ultima.valorAtual : ativo?.saldoInicial || 0;
  const dataBase = ultima ? ultima.data : null;
  const aportesDepois = state.investimentos.aportes
    .filter((a) => {
      if (a.ativoId !== ativoId || !a.efetivado) return false;
      if (dataBase) {
        if (a.data < dataBase) return false;
        if (a.data === dataBase && (a.criadoEm || "") <= (ultima?.criadoEm || "")) return false;
      }
      if (ateData && a.data > ateData) return false;
      return true;
    })
    .reduce((s, a) => s + (a.tipo === "resgate" ? -a.valor : a.valor), 0);
  return base + aportesDepois;
}

export function baseAntesAtualizacao(state: AppState, ativoId: string, u: AtualizacaoAtivo): number {
  const baseAntes = valorAtualAtivo(state, ativoId, diaAnteriorA(u.data));
  const aportesMesmoDia = state.investimentos.aportes
    .filter((a) => a.ativoId === ativoId && a.efetivado && a.data === u.data && (a.criadoEm || "") <= (u.criadoEm || ""))
    .reduce((s, a) => s + (a.tipo === "resgate" ? -a.valor : a.valor), 0);
  return baseAntes + aportesMesmoDia;
}

export function rendimentoAcumuladoTotal(state: AppState, ativoId: string): number {
  const upds = [...state.investimentos.atualizacoes.filter((a) => a.ativoId === ativoId)].sort((a, b) => a.data.localeCompare(b.data));
  let total = 0;
  upds.forEach((u) => {
    total += u.valorAtual - baseAntesAtualizacao(state, ativoId, u);
  });
  return total;
}

export function rentabilidadeAtivo(state: AppState, ativoId: string): { total: number; anual: number } {
  const upds = [...state.investimentos.atualizacoes.filter((a) => a.ativoId === ativoId)].sort((a, b) => a.data.localeCompare(b.data));
  if (upds.length < 2) return { total: 0, anual: 0 };
  const baseInicial = valorAtualAtivo(state, ativoId, diaAnteriorA(upds[0].data));
  if (baseInicial <= 0) return { total: 0, anual: 0 };
  const rendAcumulado = rendimentoAcumuladoTotal(state, ativoId);
  const totalPct = (rendAcumulado / baseInicial) * 100;
  const dias = Math.max(1, (new Date(upds[upds.length - 1].data + "T00:00:00").getTime() - new Date(upds[0].data + "T00:00:00").getTime()) / 86400000);
  const anos = dias / 365;
  const anualPct = anos >= 1 ? (Math.pow(1 + totalPct / 100, 1 / anos) - 1) * 100 : totalPct;
  return { total: totalPct, anual: anualPct };
}

export function calcPatrimonioInvestido(state: AppState, ateData?: string | null): number {
  return state.investimentos.ativos
    .filter((a) => a.ativo && (!a.dataCriacao || !ateData || a.dataCriacao <= ateData))
    .reduce((s, a) => s + valorAtualAtivo(state, a.id, ateData), 0);
}

export function aportadoNoMes(state: AppState, ativoId: string, monthDate: Date): number {
  return state.investimentos.aportes
    .filter((a) => a.ativoId === ativoId && a.efetivado && !a.transferenciaGrupoId && isInMonth(a.data, monthDate))
    .reduce((s, a) => s + (a.tipo === "resgate" ? -a.valor : a.valor), 0);
}

export function rendimentoNoMes(state: AppState, ativoId: string, monthDate: Date): number {
  const upds = [...state.investimentos.atualizacoes.filter((a) => a.ativoId === ativoId)].sort((a, b) => a.data.localeCompare(b.data));
  let total = 0;
  upds.forEach((u) => {
    if (!isInMonth(u.data, monthDate)) return;
    total += u.valorAtual - baseAntesAtualizacao(state, ativoId, u);
  });
  return total;
}

export function rentabilidadeJanela(state: AppState, ativoId: string, meses: number, currentMonth: Date): number {
  const dataInicioJanela = diaAnteriorA(primeiroDiaMes(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - meses + 1, 1)));
  const valorInicio = valorAtualAtivo(state, ativoId, dataInicioJanela);
  if (!valorInicio) return 0;
  let rendimentoAcumulado = 0;
  for (let i = 0; i < meses; i++) {
    const mesIter = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - i, 1);
    rendimentoAcumulado += rendimentoNoMes(state, ativoId, mesIter);
  }
  return (rendimentoAcumulado / valorInicio) * 100;
}

export function rentabilidadeProjetadaAnual(state: AppState, ativoId: string, currentMonth: Date): number {
  const taxasMensais: number[] = [];
  for (let i = 0; i < 3; i++) {
    const mesIter = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - i, 1);
    const inicioMesIter = diaAnteriorA(primeiroDiaMes(mesIter));
    const baseMes = valorAtualAtivo(state, ativoId, inicioMesIter);
    if (baseMes > 0) taxasMensais.push(rendimentoNoMes(state, ativoId, mesIter) / baseMes);
  }
  if (!taxasMensais.length) return 0;
  const mediaMensal = taxasMensais.reduce((s, v) => s + v, 0) / taxasMensais.length;
  return (Math.pow(1 + mediaMensal, 12) - 1) * 100;
}

export function rentabilidadeMesTotal(state: AppState, rendimentoTotal: number, currentMonth: Date): number {
  const fimMesAnterior = diaAnteriorA(primeiroDiaMes(currentMonth));
  let baseTotal = 0;
  state.investimentos.ativos.filter((a) => a.ativo).forEach((a) => (baseTotal += valorAtualAtivo(state, a.id, fimMesAnterior)));
  if (baseTotal <= 0) return 0;
  return (rendimentoTotal / baseTotal) * 100;
}
