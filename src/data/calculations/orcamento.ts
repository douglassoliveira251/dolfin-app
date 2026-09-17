import { monthKey } from "../format";
import type { AppState, Orcamento } from "../schema";
import { catFilhas } from "./categorias";
import { isInMonth, lancamentosDoMes, partesCategoriaDoLancamento } from "./lancamentos";

const MONTH_NAMES_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function valorPlanejadoEfetivo(o: Pick<Orcamento, "historicoValores" | "valorPlanejado">, monthDate: Date): number {
  const mesKey = monthKey(monthDate);
  if (o.historicoValores && o.historicoValores.length) {
    const aplicaveis = o.historicoValores.filter((h) => h.desde <= mesKey).sort((a, b) => a.desde.localeCompare(b.desde));
    if (aplicaveis.length) return aplicaveis[aplicaveis.length - 1].valor;
  }
  return o.valorPlanejado;
}

export function realizadoOrcamento(state: AppState, categoriaId: string | null, monthDate: Date, apenasComConta = false): number {
  const cat = categoriaId ? state.categorias.find((c) => c.id === categoriaId) : null;
  if (!cat) return 0;
  const idsRelevantes = cat.categoriaPaiId ? [cat.id] : [cat.id, ...catFilhas(state.categorias, cat.id).map((c) => c.id)];
  if (cat.tipo === "investimento") {
    if (cat.nome === "Aportes" || cat.nome === "Aportes (orçamento)") {
      return state.investimentos.aportes
        .filter((a) => a.tipo === "aporte" && isInMonth(a.data, monthDate) && (!apenasComConta || a.contaId))
        .reduce((s, a) => s + a.valor, 0);
    }
    return state.investimentos.aportes
      .filter((a) => a.tipo === "aporte" && isInMonth(a.data, monthDate) && a.categoriaId && idsRelevantes.includes(a.categoriaId) && (!apenasComConta || a.contaId))
      .reduce((s, a) => s + a.valor, 0);
  }
  return lancamentosDoMes(state, monthDate)
    .filter((l) => l.tipo === cat.tipo)
    .reduce(
      (s, l) =>
        s +
        partesCategoriaDoLancamento(l)
          .filter((parte) => idsRelevantes.includes(parte.categoriaId as string) || idsRelevantes.includes(parte.subcategoriaId as string))
          .reduce((s2, parte) => s2 + parte.valor, 0),
      0,
    );
}

export interface MesConsumo {
  label: string;
  valor: number;
  mesKey: string;
}

export function mesesConsumo(state: AppState, categoriaId: string, monthDate: Date, n = 6): MesConsumo[] {
  const meses: MesConsumo[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(monthDate.getFullYear(), monthDate.getMonth() - i, 1);
    meses.push({ label: MONTH_NAMES_PT[d.getMonth()].slice(0, 3), valor: realizadoOrcamento(state, categoriaId, d), mesKey: monthKey(d) });
  }
  return meses;
}

export function mediaConsumo(valores: number[]): number {
  const comDados = valores.filter((v) => v > 0);
  const base = comDados.length > 0 ? comDados : valores;
  return base.length ? base.reduce((s, v) => s + v, 0) / base.length : 0;
}

export function metasPorMes(state: AppState, categoriaId: string, monthDate: Date, meses: MesConsumo[]): (number | null)[] {
  return meses.map((_, i) => {
    const d = new Date(monthDate.getFullYear(), monthDate.getMonth() - (meses.length - 1 - i), 1);
    const orcsDaCategoria = state.orcamentos.filter((o) => o.categoriaId === categoriaId);
    if (!orcsDaCategoria.length) return null;
    const total = orcsDaCategoria.reduce((s, o) => s + valorPlanejadoEfetivo(o, d), 0);
    return total > 0 ? total : null;
  });
}
