import { useRef, useState } from "react";
import { EntityCircle } from "../../components/EntityCircle";
import { Icon } from "../../components/icons/Icon";
import { CategoryIcon } from "../../components/icons/CategoryIcon";
import { resolveIconKey } from "../../components/icons/categoryRegistry";
import type { IconName } from "../../components/icons/registry";
import { KpiCard } from "../../components/KpiCard";
import { Sparkline } from "../../components/Sparkline";
import { catLabel } from "../../data/calculations/categorias";
import { faturaPrecisaPagar } from "../../data/calculations/cartoes";
import { saldoContaAte, saldoPrevistoConta } from "../../data/calculations/contas";
import { dashboardSaldos } from "../../data/calculations/dashboard";
import { calcPatrimonioInvestido, rendimentoNoMes, rentabilidadeMesTotal } from "../../data/calculations/investimentos";
import { isInMonth, isInMonthCompetencia, lancamentosDoMes, partesCategoriaDoLancamento } from "../../data/calculations/lancamentos";
import { realizadoOrcamento, valorPlanejadoEfetivo } from "../../data/calculations/orcamento";
import { contrastIconColor } from "../../data/colors";
import { diaAnteriorA, ehNegativo, fmtDate, fmtMoney, fmtMoneyIn, monthKey, primeiroDiaMes, ultimoDiaMes } from "../../data/format";
import type { Lancamento, TipoCategoria } from "../../data/schema";
import { useAppStore } from "../../data/store";
import { ExtratoContaModal } from "../Contas/ExtratoContaModal";
import { ExtratoFaturaModal } from "../Cartoes/ExtratoFaturaModal";
import { LancamentoModal } from "../Lancamentos/LancamentoModal";
import { DetalheSaldoPrevistoModal } from "./DetalheSaldoPrevistoModal";
import { ExtratoKpiModal } from "./ExtratoKpiModal";

const MES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function contasVisiveis(state: ReturnType<typeof useAppStore.getState>["data"], currentMonth: Date) {
  let contas = state.contas.filter((c) => c.ativo && !c.oculta && !c.arquivada);
  if (state.configuracoes.mostrarApenasContasComSaldo) {
    const fimMesRef = ultimoDiaMes(currentMonth);
    const hoje = new Date().toISOString().slice(0, 10);
    contas = contas.filter((c) => {
      const atual = saldoContaAte(state, c.id, hoje < fimMesRef ? hoje : fimMesRef, true);
      const previsto = saldoPrevistoConta(state, c.id, currentMonth);
      return atual !== 0 || previsto !== 0;
    });
  }
  return contas;
}

export function Dashboard() {
  const state = useAppStore((s) => s.data);
  const currentMonth = useAppStore((s) => s.currentMonth);
  const setScreenId = useAppStore((s) => s.setScreenId);

  const [donutCategoriaAtiva, setDonutCategoriaAtiva] = useState<string | null>(null);
  const [donutSelecionado, setDonutSelecionado] = useState<number | null>(null);
  const [dashOrcTab, setDashOrcTab] = useState<TipoCategoria>("despesa");
  const [dashTransacoesTab, setDashTransacoesTab] = useState<"todas" | "entrada" | "saida">("todas");
  const [saudeInfoOpen, setSaudeInfoOpen] = useState(false);
  const [orcPopoverOpen, setOrcPopoverOpen] = useState(false);
  const [lancPopoverOpen, setLancPopoverOpen] = useState(false);
  const [extratoKpi, setExtratoKpi] = useState<{ tipo: "entrada" | "despesa"; categoriaId?: string | null } | null>(null);
  const [detalhePrevistoOpen, setDetalhePrevistoOpen] = useState(false);
  const [extratoContaId, setExtratoContaId] = useState<string | null>(null);
  const [extratoCartaoInfo, setExtratoCartaoInfo] = useState<{ id: string; mes: string } | null>(null);
  const [editLancamentoId, setEditLancamentoId] = useState<string | null>(null);

  const perfilNome = state.perfil.nome ? state.perfil.nome.split(" ")[0] : "";

  const { saldoInicial, saldoAtual, saldoPrevisto } = dashboardSaldos(state, currentMonth);
  const lancMes = lancamentosDoMes(state, currentMonth);
  const receitas = lancMes.filter((l) => l.tipo === "entrada" && l.efetivado).reduce((s, l) => s + l.valor, 0);
  const despesas = lancMes.filter((l) => l.tipo === "despesa" && l.efetivado).reduce((s, l) => s + l.valor, 0);
  const receitasPrevisto = lancMes.filter((l) => l.tipo === "entrada" && !l.efetivado).reduce((s, l) => s + l.valor, 0);
  const despesasPrevisto = lancMes.filter((l) => l.tipo === "despesa" && !l.efetivado).reduce((s, l) => s + l.valor, 0);
  const aportesMesVal = state.investimentos.aportes.filter((a) => a.tipo === "aporte" && a.efetivado && isInMonth(a.data, currentMonth)).reduce((s, a) => s + a.valor, 0);
  const resgatesMesVal = state.investimentos.aportes.filter((a) => a.tipo === "resgate" && a.efetivado && isInMonth(a.data, currentMonth)).reduce((s, a) => s + a.valor, 0);
  const investidoMes = aportesMesVal - resgatesMesVal;
  const patrimonioInvestido = calcPatrimonioInvestido(state, ultimoDiaMes(currentMonth));
  const rendimentoMesTodos = state.investimentos.ativos.filter((a) => a.ativo).reduce((s, a) => s + rendimentoNoMes(state, a.id, currentMonth), 0);
  const rentMedia = rentabilidadeMesTotal(state, rendimentoMesTodos, currentMonth);

  const resultadoHistorico: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const mesIter = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - i, 1);
    const lm = lancamentosDoMes(state, mesIter);
    const r = lm.filter((l) => l.tipo === "entrada" && l.efetivado).reduce((s, l) => s + l.valor, 0);
    const d = lm.filter((l) => l.tipo === "despesa" && l.efetivado).reduce((s, l) => s + l.valor, 0);
    resultadoHistorico.push(r - d);
  }
  const resultadoMes = receitas - despesas;
  const pctReceita = receitas > 0 ? (resultadoMes / receitas) * 100 : 0;

  const patrimonioMesAnterior = calcPatrimonioInvestido(state, diaAnteriorA(primeiroDiaMes(currentMonth)));
  const variacaoPatrimonioPct = patrimonioMesAnterior !== 0 ? ((patrimonioInvestido - patrimonioMesAnterior) / Math.abs(patrimonioMesAnterior)) * 100 : patrimonioInvestido !== 0 ? 100 : 0;

  // top categorias de despesa no mês
  const catAtivaObj = donutCategoriaAtiva ? state.categorias.find((c) => c.id === donutCategoriaAtiva) : null;
  if (donutCategoriaAtiva && !catAtivaObj) setDonutCategoriaAtiva(null);
  const catTotais: Record<string, number> = {};
  lancMes
    .filter((l) => l.tipo === "despesa")
    .forEach((l) => {
      partesCategoriaDoLancamento(l).forEach((parte) => {
        if (donutCategoriaAtiva) {
          if (parte.categoriaId !== donutCategoriaAtiva) return;
          const cid = parte.subcategoriaId || "__sem__";
          const catCheck = parte.subcategoriaId ? state.categorias.find((c) => c.id === parte.subcategoriaId) : null;
          if (catCheck && catCheck.ocultarGraficos) return;
          catTotais[cid] = (catTotais[cid] || 0) + parte.valor;
        } else {
          const cid = parte.categoriaId || "__sem__";
          const catCheck = parte.categoriaId ? state.categorias.find((c) => c.id === parte.categoriaId) : null;
          if (catCheck && catCheck.ocultarGraficos) return;
          catTotais[cid] = (catTotais[cid] || 0) + parte.valor;
        }
      });
    });
  const catTotaisOrdenados = Object.entries(catTotais).sort((a, b) => b[1] - a[1]);
  const topCats = catTotaisOrdenados.slice(0, 4);
  const outrosTotal = catTotaisOrdenados.slice(4).reduce((s, [, v]) => s + v, 0);
  const donutFatias: [string, number][] = outrosTotal > 0 ? [...topCats, ["__outros__", outrosTotal]] : topCats;
  const totalDespesasDonut = donutFatias.reduce((s, [, v]) => s + v, 0);

  const metasAbertas = [...state.metas].filter((m) => !m.concluida).sort((a, b) => (a.dataAlvo || "9999").localeCompare(b.dataAlvo || "9999")).slice(0, 5);

  const mesAnterior = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  const catTotaisAtualComparativo: Record<string, number> = {};
  lancMes
    .filter((l) => l.tipo === "despesa")
    .forEach((l) => {
      partesCategoriaDoLancamento(l).forEach((parte) => {
        const cid = parte.categoriaId || "__sem__";
        catTotaisAtualComparativo[cid] = (catTotaisAtualComparativo[cid] || 0) + parte.valor;
      });
    });
  const catTotaisAnterior: Record<string, number> = {};
  lancamentosDoMes(state, mesAnterior)
    .filter((l) => l.tipo === "despesa")
    .forEach((l) => {
      partesCategoriaDoLancamento(l).forEach((parte) => {
        const cid = parte.categoriaId || "__sem__";
        catTotaisAnterior[cid] = (catTotaisAnterior[cid] || 0) + parte.valor;
      });
    });
  const catIdsComparativo = new Set([...Object.keys(catTotaisAtualComparativo), ...Object.keys(catTotaisAnterior)]);
  const comparativoLinhasTodas = [...catIdsComparativo]
    .map((cid) => {
      const cat = cid !== "__sem__" ? state.categorias.find((c) => c.id === cid) : null;
      const atual = catTotaisAtualComparativo[cid] || 0;
      const anterior = catTotaisAnterior[cid] || 0;
      const delta = atual - anterior;
      const pct = anterior > 0 ? (delta / anterior) * 100 : atual > 0 ? 100 : 0;
      return { cat, nome: cat ? cat.nome : "Sem categoria", atual, anterior, delta, pct };
    })
    .filter((l) => (l.atual > 0 || l.anterior > 0) && !(l.cat && l.cat.nome.trim().toLowerCase() === "outros") && !(l.cat && l.cat.ocultarGraficos))
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
  const comparativoLinhas = comparativoLinhasTodas.slice(0, 9);

  // saúde financeira
  const taxaPoupanca = receitas > 0 ? ((receitas - despesas) / receitas) * 100 : 0;
  const pontosPoupanca = Math.max(0, Math.min(100, (taxaPoupanca / 30) * 100));
  const mesKeySaude = monthKey(currentMonth);
  const orcsSaude = state.orcamentos.filter((o) => {
    const cat = o.categoriaId ? state.categorias.find((c) => c.id === o.categoriaId) : null;
    if (!cat || cat.tipo !== "despesa") return false;
    return o.mesReferencia === mesKeySaude || (!o.mesReferencia && (!o.validoApartirDe || mesKeySaude >= monthKey(new Date(o.validoApartirDe + "T00:00:00"))));
  });
  let pontosOrcamento = 100;
  if (orcsSaude.length) {
    let somaExcesso = 0;
    let qtdComExcesso = 0;
    orcsSaude.forEach((o) => {
      const planejado = valorPlanejadoEfetivo(o, currentMonth);
      if (planejado <= 0) return;
      const realizado = realizadoOrcamento(state, o.categoriaId, currentMonth);
      const pct = (realizado / planejado) * 100;
      if (pct > 100) {
        somaExcesso += pct - 100;
        qtdComExcesso++;
      }
    });
    pontosOrcamento = qtdComExcesso ? Math.max(0, 100 - somaExcesso / orcsSaude.length) : 100;
  }
  const tiposAtivos = new Set(state.investimentos.ativos.filter((a) => a.ativo).map((a) => a.categoriaId));
  const pontosDiversificacao = Math.min(100, tiposAtivos.size * 33.34);
  const scoreSaude = Math.round((pontosPoupanca + pontosOrcamento + pontosDiversificacao) / 3);
  const statusSaude =
    scoreSaude >= 70
      ? { grad1: "#0B4642", grad2: "#00D9A8", bg: "#DFF7F0", text: "#0B6B54", label: "Saudável", desc: pontosPoupanca >= 70 && pontosOrcamento >= 70 ? "Boa margem + baixa pressão de gastos" : "Situação estável, siga assim" }
      : scoreSaude >= 40
        ? { grad1: "#8A5A12", grad2: "#E8B84B", bg: "#FAEEDA", text: "#7A4E0F", label: "Atenção", desc: "Margem apertada, fique de olho nos gastos" }
        : { grad1: "#7A2E1F", grad2: "#E2725B", bg: "#FCEBEB", text: "#8C2E1E", label: "Crítica", desc: "Pressão alta nos gastos, revise o orçamento" };
  const circunf = 2 * Math.PI * 84;
  const arcoAtivo = (scoreSaude / 100) * Math.PI * 84;

  const donutSelecionadoObj = donutSelecionado !== null && donutFatias[donutSelecionado] ? donutFatias[donutSelecionado] : null;

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>
            {perfilNome ? (
              <>
                <strong>Bem-vindo,</strong> <span style={{ color: "var(--gray-400)", fontWeight: 400 }}>{perfilNome}</span>
              </>
            ) : (
              "Bem-vindo"
            )}
          </h1>
          <div className="sub">Seu controle financeiro, do seu jeito</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "stretch", marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="kpi-grid cols3" style={{ marginBottom: 0 }}>
            <KpiCard icon="kpiPulse" iconBgLight="#DFF0E4" iconColorLight="var(--positive)" iconBgDark="#16A34A" label="Saldo atual" value={fmtMoney(saldoAtual)} valueTone={ehNegativo(saldoAtual) ? "neg" : "pos"} sub={<>Saldo inicial: <span style={{ color: "var(--ink)", fontWeight: 500 }}>{fmtMoney(saldoInicial)}</span></>} />
            <KpiCard
              icon="kpiWallet"
              iconBgLight="#F5E0DC"
              iconColorLight="var(--negative)"
              iconBgDark="#DC2626"
              label={<>Saldo previsto <Icon name="info" size={11} /></>}
              value={fmtMoney(saldoPrevisto)}
              valueTone={ehNegativo(saldoPrevisto) ? "neg" : "neutral"}
              onClick={() => setDetalhePrevistoOpen(true)}
              sub={(() => {
                const diffPrevisto = saldoPrevisto - saldoAtual;
                if (Math.abs(diffPrevisto) < 0.005) return "Sem lançamentos pendentes";
                return `${diffPrevisto >= 0 ? "▲" : "▼"} ${fmtMoney(Math.abs(diffPrevisto))} ainda ${diffPrevisto >= 0 ? "a receber" : "a pagar"}`;
              })()}
            />
            <KpiCard
              icon="kpiCoin"
              iconBgLight="#EDE3F5"
              iconColorLight="var(--type-investimento)"
              iconBgDark="#7C3AED"
              label="Resultado do mês"
              value={fmtMoney(resultadoMes)}
              valueTone={ehNegativo(resultadoMes) ? "neg" : "pos"}
              sub={
                <span style={{ color: pctReceita >= 0 ? "var(--positive)" : "var(--negative)", fontWeight: 600 }}>
                  {pctReceita >= 0 ? "▲" : "▼"} {Math.abs(pctReceita).toFixed(1)}% <span className="mini-note" style={{ fontWeight: 400 }}>da receita</span>
                </span>
              }
            >
              <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: state.configuracoes.sidebarColapsada ? 150 : 105 }}>
                <Sparkline valores={resultadoHistorico} cor={ehNegativo(resultadoMes) ? "#AD4B34" : "#2E7D5B"} />
              </div>
            </KpiCard>
          </div>
          <div className="kpi-grid cols4" style={{ marginBottom: 0 }}>
            <KpiCard icon="kpiArrowDown" iconBgLight="#DFF0E4" iconColorLight="var(--positive)" iconBgDark="#16A34A" label="Receitas" value={fmtMoney(receitas)} valueTone="pos" onClick={() => setExtratoKpi({ tipo: "entrada" })} sub={<>Previsto: <span style={{ color: "var(--positive)", fontWeight: 500 }}>{fmtMoney(receitas + receitasPrevisto)}</span></>} />
            <KpiCard icon="kpiArrowUp" iconBgLight="#F5E0DC" iconColorLight="var(--negative)" iconBgDark="#DC2626" label="Despesas" value={fmtMoney(despesas)} valueTone="neg" onClick={() => setExtratoKpi({ tipo: "despesa" })} sub={<>Previsto: <span style={{ color: "var(--negative)", fontWeight: 500 }}>{fmtMoney(despesas + despesasPrevisto)}</span></>} />
            <KpiCard icon="kpiClock" iconBgLight="#DFF0E4" iconColorLight="var(--positive)" iconBgDark="#16A34A" label="Investido no mês" value={fmtMoney(investidoMes)} valueTone={investidoMes < 0 ? "neg" : "neutral"} sub={<><span style={{ color: rentMedia < 0 ? "var(--negative)" : "var(--ink)", fontWeight: 600 }}>{rentMedia.toFixed(1)}%</span> de rentabilidade no mês</>} />
            <KpiCard
              icon="kpiTrend"
              iconBgLight="#DCE7F1"
              iconColorLight="var(--type-investimento)"
              iconBgDark="#2563EB"
              label="Patrimônio investido"
              value={fmtMoney(patrimonioInvestido)}
              sub={
                <span style={{ color: variacaoPatrimonioPct >= 0 ? "var(--positive)" : "var(--negative)", fontWeight: 600 }}>
                  {variacaoPatrimonioPct >= 0 ? "▲" : "▼"} {Math.abs(variacaoPatrimonioPct).toFixed(1)}% <span className="mini-note" style={{ fontWeight: 400 }}>vs mês anterior</span>
                </span>
              }
            />
          </div>
        </div>

        <div className="kpi-card" style={{ width: 280, height: 220, flex: "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "14px 18px", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)" }}>
            <div className="lbl" style={{ margin: 0 }}>
              Saúde financeira
            </div>
            <button
              type="button"
              title="Como calculamos"
              onClick={(e) => {
                e.stopPropagation();
                setSaudeInfoOpen((v) => !v);
              }}
              style={{ width: 16, height: 16, borderRadius: "50%", border: "1px solid var(--gray-400)", background: "none", color: "var(--gray-400)", fontSize: 10, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
            >
              ?
            </button>
          </div>
          {saudeInfoOpen && (
            <div style={{ position: "absolute", top: 38, left: 18, right: 18, zIndex: 10, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.15)", padding: 12, textAlign: "left", fontSize: 11.5 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Como chegamos nesse número</div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span className="mini-note" style={{ margin: 0 }}>Poupança do mês</span>
                <strong>{pontosPoupanca.toFixed(0)}/100</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span className="mini-note" style={{ margin: 0 }}>Aderência ao orçamento</span>
                <strong>{pontosOrcamento.toFixed(0)}/100</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span className="mini-note" style={{ margin: 0 }}>Diversificação</span>
                <strong>{pontosDiversificacao.toFixed(0)}/100</strong>
              </div>
              <div className="mini-note" style={{ marginTop: 6 }}>Média simples das três métricas.</div>
            </div>
          )}
          <svg viewBox="0 0 184 102" width={214} height={119} style={{ marginTop: 25 }}>
            <defs>
              <linearGradient id="gradSaude" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor={statusSaude.grad1} />
                <stop offset="100%" stopColor={statusSaude.grad2} />
              </linearGradient>
            </defs>
            <path d="M8 92 A84 84 0 0 1 176 92" fill="none" stroke="var(--line)" strokeWidth={15} />
            <path d="M8 92 A84 84 0 0 1 176 92" fill="none" stroke="url(#gradSaude)" strokeWidth={15} strokeLinecap="round" strokeDasharray={`${arcoAtivo.toFixed(1)} ${circunf.toFixed(1)}`} />
          </svg>
          <div style={{ marginTop: -74, display: "flex", alignItems: "baseline", gap: 3 }}>
            <span style={{ fontSize: 34, fontWeight: 700, color: "var(--ink)", lineHeight: 1 }}>{scoreSaude}</span>
            <span style={{ fontSize: 14, fontWeight: 400, color: "var(--gray-400)" }}>/100</span>
          </div>
          <div style={{ marginTop: 13, background: statusSaude.bg, color: statusSaude.text, fontSize: 12, fontWeight: 600, padding: "4px 14px", borderRadius: 14 }}>{statusSaude.label}</div>
          <div className="mini-note" style={{ marginTop: 16, textAlign: "center", lineHeight: 1.3 }}>
            {statusSaude.desc}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 20, alignItems: "stretch" }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: 34 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1, overflow: "hidden" }}>
              <span style={{ width: 24, height: 24, color: "var(--kpi-icon-accent)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <Icon name="categorias" size={24} />
              </span>
              <div style={{ minWidth: 0, overflow: "hidden" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Top categorias de despesa</h3>
                <p className="mini-note" style={{ margin: "4px 0 0", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Maiores gastos do mês
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
              {catAtivaObj && (
                <button type="button" className="btn ghost small" style={{ flex: "none" }} onClick={() => setDonutCategoriaAtiva(null)}>
                  <Icon name="chevronLeft" size={12} /> Voltar
                </button>
              )}
              {(donutSelecionadoObj || catAtivaObj) &&
                (() => {
                  let nome: string;
                  let cat = null;
                  if (donutSelecionadoObj) {
                    const [cid] = donutSelecionadoObj;
                    cat = cid !== "__sem__" && cid !== "__outros__" ? state.categorias.find((c) => c.id === cid) : null;
                    const nomeBase = cat ? cat.nome : cid === "__outros__" ? "Demais categorias" : "Sem categoria";
                    nome = catAtivaObj ? `${catAtivaObj.nome} - ${nomeBase}` : nomeBase;
                  } else {
                    nome = catAtivaObj!.nome;
                    cat = catAtivaObj;
                  }
                  return (
                    <span style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                      {cat && <EntityCircle cor={cat.cor} icone={cat.icone} />}
                      <span style={{ fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>{nome}</span>
                      {donutSelecionadoObj && cat && (
                        <button type="button" className="btn ghost small" title="Ver detalhes" style={{ flex: "none", padding: "6px 8px" }} onClick={() => setExtratoKpi({ tipo: "despesa", categoriaId: cat!.id })}>
                          <Icon name="arrowUpRight" size={15} />
                        </button>
                      )}
                    </span>
                  );
                })()}
            </div>
          </div>
          {donutFatias.length ? (
            <DonutTopCategorias
              donutFatias={donutFatias}
              totalDespesasDonut={totalDespesasDonut}
              donutSelecionado={donutSelecionado}
              onSelectSlice={(i) => setDonutSelecionado((prev) => (prev === i ? null : i))}
              onClickNome={(catId) => {
                const temFilhas = state.categorias.some((c) => c.categoriaPaiId === catId);
                if (!donutCategoriaAtiva && temFilhas) {
                  setDonutCategoriaAtiva(catId);
                  setDonutSelecionado(null);
                } else {
                  setExtratoKpi({ tipo: "despesa", categoriaId: catId });
                }
              }}
              categorias={state.categorias}
            />
          ) : (
            <div className="empty-state">
              <Icon name="empty" size={38} />
              <div>Nenhuma despesa lançada neste mês.</div>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 24, height: 24, color: "var(--kpi-icon-accent)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <Icon name="target" size={24} />
              </span>
              <div>
                <h3 style={{ margin: 0, lineHeight: 1.15 }}>Metas</h3>
                <p className="mini-note" style={{ margin: "4px 0 0", lineHeight: 1.2 }}>
                  Progresso dos seus objetivos financeiros
                </p>
              </div>
            </div>
            <button type="button" className="btn ghost small" title="Ver todas" style={{ flex: "none", padding: "6px 8px" }} onClick={() => setScreenId("metas")}>
              <Icon name="arrowUpRight" size={15} />
            </button>
          </div>
          <div style={{ marginTop: 18 }}>
            {metasAbertas.length ? (
              metasAbertas.map((m) => {
                const pct = m.valorAlvo > 0 ? Math.min(100, (m.valorAtual / m.valorAlvo) * 100) : 0;
                return (
                  <div key={m.id} style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setScreenId("metas")}>
                    <EntityCircle cor={m.cor} icone={m.icone} size={38} iconSize={17} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ flex: 1, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.nome}</span>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                          {fmtMoney(m.valorAtual)} <span className="mini-note" style={{ fontWeight: 400 }}>de {fmtMoney(m.valorAlvo)}</span>
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 8, background: "var(--surface-2)", borderRadius: 8, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 8, background: `linear-gradient(90deg, color-mix(in srgb, ${m.cor} 65%, white), ${m.cor})` }} />
                        </div>
                        <span className="mini-note" style={{ margin: 0, flex: "none" }}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <Icon name="empty" size={38} />
                <div>Nenhuma meta em aberto ainda.</div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 24, height: 24, color: "var(--kpi-icon-accent)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <Icon name="bank" size={24} />
              </span>
              <div>
                <h3 style={{ margin: 0, lineHeight: 1.15 }}>Contas</h3>
                <p className="mini-note" style={{ margin: "4px 0 0", lineHeight: 1.2 }}>
                  Saldo por conta
                </p>
              </div>
            </div>
            <button type="button" className="btn ghost small" title="Ver todas" style={{ flex: "none", padding: "6px 8px" }} onClick={() => setScreenId("contas")}>
              <Icon name="arrowUpRight" size={15} />
            </button>
          </div>
          {(() => {
            const contas = contasVisiveis(state, currentMonth);
            if (!contas.length)
              return (
                <div className="empty-state">
                  <Icon name="empty" size={38} />
                  <div>Nenhuma conta cadastrada ainda.</div>
                </div>
              );
            const fimMes = ultimoDiaMes(currentMonth);
            const hoje = new Date().toISOString().slice(0, 10);
            return contas.map((c) => {
              const atual = saldoContaAte(state, c.id, hoje < fimMes ? hoje : fimMes, true);
              const previsto = saldoPrevistoConta(state, c.id, currentMonth);
              return (
                <div key={c.id} className="dash-row" style={{ padding: "8px 4px" }} onClick={() => setExtratoContaId(c.id)}>
                  <div className="dash-row-main">
                    <span className="dash-icon-circle" style={{ background: c.cor, color: contrastIconColor(c.cor) }}>
                      {(() => {
                        const key = resolveIconKey(c.icone);
                        return key && <CategoryIcon name={key} size={17} />;
                      })()}
                    </span>
                    <span className="dash-row-name" style={{ fontWeight: 500, color: "var(--ink-soft)" }}>
                      {c.nome}
                    </span>
                  </div>
                  <div className="dash-row-vals">
                    <div className={`dash-row-atual${ehNegativo(atual) ? " neg" : ""}`} style={{ fontSize: 19 }}>
                      {fmtMoneyIn(atual, c.moeda)}
                    </div>
                    <div className="dash-row-previsto">
                      Saldo previsto <span style={{ fontWeight: 600, color: ehNegativo(previsto) ? "var(--negative)" : "var(--ink-soft)" }}>{fmtMoneyIn(previsto, c.moeda)}</span>
                    </div>
                  </div>
                  <span className="tt-icon" style={{ color: "var(--gray-400)", width: 16, height: 16, flex: "none" }}>
                    <Icon name="detail" size={16} />
                  </span>
                </div>
              );
            });
          })()}
        </div>
      </div>

      <div className="grid2" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 24, height: 24, color: "var(--kpi-icon-accent)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <Icon name="barChart" size={24} />
              </span>
              <div>
                <h3 style={{ margin: 0, lineHeight: 1.15 }}>Orçamento do mês</h3>
                <p className="mini-note" style={{ margin: "4px 0 0", lineHeight: 1.2 }}>
                  Planejado x realizado por categoria
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
              <OrcTabTrigger open={orcPopoverOpen} setOpen={setOrcPopoverOpen} value={dashOrcTab} onChange={setDashOrcTab} />
              <button type="button" className="btn ghost small" title="Ver todas" style={{ flex: "none", padding: "6px 8px" }} onClick={() => setScreenId("orcamento")}>
                <Icon name="arrowUpRight" size={15} />
              </button>
            </div>
          </div>
          <OrcamentoDoMes state={state} currentMonth={currentMonth} dashOrcTab={dashOrcTab} />
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 24, height: 24, color: "var(--kpi-icon-accent)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <Icon name="cartoes" size={24} />
              </span>
              <div>
                <h3 style={{ margin: 0, lineHeight: 1.15 }}>Cartões de Crédito</h3>
                <p className="mini-note" style={{ margin: "4px 0 0", lineHeight: 1.2 }}>
                  Fatura atual por cartão
                </p>
              </div>
            </div>
            <button type="button" className="btn ghost small" title="Ver todas" style={{ flex: "none", padding: "6px 8px" }} onClick={() => setScreenId("cartoes")}>
              <Icon name="arrowUpRight" size={15} />
            </button>
          </div>
          <CartoesMiniCards state={state} currentMonth={currentMonth} onClickCartao={(cartaoId, mes) => setExtratoCartaoInfo({ id: cartaoId, mes })} />
        </div>
      </div>

      <div className="grid2" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 24, height: 24, color: "var(--kpi-icon-accent)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <Icon name="lanc" size={24} />
              </span>
              <div>
                <h3 style={{ margin: 0, lineHeight: 1.15 }}>Últimos lançamentos</h3>
                <p className="mini-note" style={{ margin: "4px 0 0", lineHeight: 1.2 }}>
                  Movimentações mais recentes
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
              <LancTabTrigger open={lancPopoverOpen} setOpen={setLancPopoverOpen} value={dashTransacoesTab} onChange={setDashTransacoesTab} />
              <button type="button" className="btn ghost small" title="Ver todas" style={{ color: "var(--sidebar-accent)", padding: "6px 8px", flex: "none" }} onClick={() => setScreenId("lancamentos")}>
                <Icon name="arrowUpRight" size={15} />
              </button>
            </div>
          </div>
          <UltimosLancamentos state={state} tab={dashTransacoesTab} onClickLancamento={setEditLancamentoId} />
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 24, height: 24, color: "var(--kpi-icon-accent)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <Icon name="kpiTrend" size={24} />
              </span>
              <div>
                <h3 style={{ margin: 0, lineHeight: 1.15 }}>Variação de Categorias</h3>
                <p className="mini-note" style={{ margin: "4px 0 0", lineHeight: 1.2 }}>
                  Maiores altas e quedas de gasto por categoria
                </p>
              </div>
            </div>
            <div style={{ flex: "none", display: "flex", flexDirection: "row", gap: 14, fontSize: 11, fontWeight: 600, color: "var(--ink-soft)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--chart-dark-bar)", display: "inline-block" }} />
                Mês atual
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--type-investimento)", display: "inline-block" }} />
                Mês anterior
              </span>
            </div>
          </div>
          {comparativoLinhas.length ? (
            <ComparativoCategoriasChart linhas={comparativoLinhas} />
          ) : (
            <div className="empty-state">
              <Icon name="empty" size={38} />
              <div>Sem dados suficientes para comparar ainda.</div>
            </div>
          )}
        </div>
      </div>

      {extratoKpi && <ExtratoKpiModal tipo={extratoKpi.tipo} categoriaId={extratoKpi.categoriaId} onClose={() => setExtratoKpi(null)} />}
      {detalhePrevistoOpen && <DetalheSaldoPrevistoModal onClose={() => setDetalhePrevistoOpen(false)} />}
      {extratoContaId && <ExtratoContaModal contaId={extratoContaId} onClose={() => setExtratoContaId(null)} />}
      {extratoCartaoInfo && <ExtratoFaturaModal cartaoId={extratoCartaoInfo.id} mesInicial={extratoCartaoInfo.mes} onClose={() => setExtratoCartaoInfo(null)} />}
      {editLancamentoId && <LancamentoModal lancamentoId={editLancamentoId} onClose={() => setEditLancamentoId(null)} />}
    </div>
  );
}

function DonutTopCategorias({
  donutFatias,
  totalDespesasDonut,
  donutSelecionado,
  onSelectSlice,
  onClickNome,
  categorias,
}: {
  donutFatias: [string, number][];
  totalDespesasDonut: number;
  donutSelecionado: number | null;
  onSelectSlice: (i: number) => void;
  onClickNome: (catId: string) => void;
  categorias: { id: string; nome: string; cor: string }[];
}) {
  const size = 220;
  const r = 78;
  const sw = 28;
  const C = 2 * Math.PI * r;
  let acc = 0;
  const selecionado = donutSelecionado !== null && donutFatias[donutSelecionado] ? donutFatias[donutSelecionado] : null;
  const valorCentro = selecionado ? selecionado[1] : totalDespesasDonut;
  const pctCentro = selecionado ? (totalDespesasDonut > 0 ? (selecionado[1] / totalDespesasDonut) * 100 : 0) : 100;

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 14 }}>
      <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {donutFatias.map(([cid, val], i) => {
            const pct = totalDespesasDonut > 0 ? val / totalDespesasDonut : 0;
            const dash = `${(pct * C).toFixed(2)} ${(C - pct * C).toFixed(2)}`;
            const dashoffset = -(acc * C).toFixed(2);
            acc += pct;
            const cat = cid !== "__sem__" && cid !== "__outros__" ? categorias.find((c) => c.id === cid) : null;
            const color = cat ? cat.cor : "#9C978A";
            const ativo = donutSelecionado === i;
            return (
              <circle
                key={cid}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={ativo ? sw + 5 : sw}
                strokeDasharray={dash}
                strokeDashoffset={dashoffset}
                style={{ cursor: "pointer", transition: ".15s", opacity: donutSelecionado !== null && !ativo ? 0.45 : 1 }}
                onClick={() => onSelectSlice(i)}
              />
            );
          })}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", textAlign: "center", padding: "0 10px" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, lineHeight: 1.15 }}>{fmtMoney(valorCentro)}</div>
          <div className="mini-note" style={{ margin: "2px 0 0" }}>
            {selecionado ? `${pctCentro.toFixed(0)}%` : "Total de despesas"}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 140, display: "flex", flexDirection: "column", gap: 6 }}>
        {donutFatias.map(([cid, val], i) => {
          const cat = cid !== "__sem__" && cid !== "__outros__" ? categorias.find((c) => c.id === cid) : null;
          const nome = cat ? cat.nome : cid === "__outros__" ? "Demais categorias" : "Sem categoria";
          const color = cat ? cat.cor : "#9C978A";
          const pct = totalDespesasDonut > 0 ? (val / totalDespesasDonut) * 100 : 0;
          return (
            <div key={cid} className="bar-row" style={{ cursor: "pointer", marginBottom: 0, gap: 6, opacity: donutSelecionado !== null && donutSelecionado !== i ? 0.5 : 1 }} onClick={() => onSelectSlice(i)}>
              <span className="csel-dot" style={{ background: color, flex: "none" }} />
              <span
                style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12.5, paddingLeft: 4, ...(cat ? { cursor: "pointer", textDecoration: "underline", textDecorationColor: "transparent" } : {}) }}
                onClick={(e) => {
                  if (!cat) return;
                  e.stopPropagation();
                  onClickNome(cat.id);
                }}
              >
                {nome}
              </span>
              <span className="mini-note" style={{ width: "auto", marginLeft: 2 }}>
                {pct.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrcTabTrigger({
  open,
  setOpen,
  value,
  onChange,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  value: TipoCategoria;
  onChange: (v: TipoCategoria) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const opts: { value: TipoCategoria; label: string; icon: IconName; cor: string }[] = [
    { value: "despesa", label: "Despesas", icon: "kpiArrowUp", cor: "#EF4444" },
    { value: "entrada", label: "Receitas", icon: "kpiArrowDown", cor: "#16A34A" },
    { value: "investimento", label: "Investimentos", icon: "kpiTrend", cor: "#2563EB" },
  ];
  const atual = opts.find((o) => o.value === value)!;
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block", flex: "none" }}>
      <button
        type="button"
        style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <span className="tt-icon" style={{ width: 14, height: 14, color: atual.cor }}>
          <Icon name={atual.icon} size={14} />
        </span>
        {atual.label}
        <Icon name="chevronDown" size={10} />
      </button>
      {open && (
        <div className="color-popover open" style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 20, minWidth: 170 }} onClick={(e) => e.stopPropagation()}>
          {opts.map((o) => (
            <button
              key={o.value}
              type="button"
              className="fab-menu-item"
              style={{ display: "flex", alignItems: "center", gap: 8, background: value === o.value ? "var(--surface-2)" : "none" }}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              <span className="tt-icon" style={{ width: 15, height: 15, color: o.cor }}>
                <Icon name={o.icon} size={15} />
              </span>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LancTabTrigger({
  open,
  setOpen,
  value,
  onChange,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  value: "todas" | "entrada" | "saida";
  onChange: (v: "todas" | "entrada" | "saida") => void;
}) {
  const opts: { value: "todas" | "entrada" | "saida"; label: string; icon: IconName; cor: string }[] = [
    { value: "todas", label: "Todas", icon: "dashboard", cor: "var(--ink-soft)" },
    { value: "entrada", label: "Receitas", icon: "kpiArrowDown", cor: "#16A34A" },
    { value: "saida", label: "Despesas", icon: "kpiArrowUp", cor: "#EF4444" },
  ];
  const atual = opts.find((o) => o.value === value)!;
  return (
    <div style={{ position: "relative", display: "inline-block", flex: "none" }}>
      <button
        type="button"
        style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <span className="tt-icon" style={{ width: 14, height: 14, color: atual.cor }}>
          <Icon name={atual.icon} size={14} />
        </span>
        {atual.label}
        <Icon name="chevronDown" size={10} />
      </button>
      {open && (
        <div className="color-popover open" style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 20, minWidth: 150 }} onClick={(e) => e.stopPropagation()}>
          {opts.map((o) => (
            <button
              key={o.value}
              type="button"
              className="fab-menu-item"
              style={{ display: "flex", alignItems: "center", gap: 8, background: value === o.value ? "var(--surface-2)" : "none" }}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              <span className="tt-icon" style={{ width: 15, height: 15, color: o.cor }}>
                <Icon name={o.icon} size={15} />
              </span>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OrcamentoDoMes({ state, currentMonth, dashOrcTab }: { state: ReturnType<typeof useAppStore.getState>["data"]; currentMonth: Date; dashOrcTab: TipoCategoria }) {
  const mesKey = monthKey(currentMonth);
  const orcs = state.orcamentos.filter((o) => {
    const cat = o.categoriaId ? state.categorias.find((c) => c.id === o.categoriaId) : null;
    if (!cat || cat.tipo !== dashOrcTab) return false;
    const dentroPeriodo = o.mesReferencia === mesKey || (!o.mesReferencia && (!o.validoApartirDe || mesKey >= monthKey(new Date(o.validoApartirDe + "T00:00:00"))));
    if (!dentroPeriodo) return false;
    return valorPlanejadoEfetivo(o, currentMonth) > 0;
  });
  const totalPlanejado = orcs.reduce((s, o) => s + valorPlanejadoEfetivo(o, currentMonth), 0);
  const totalRealizado = orcs.reduce((s, o) => s + realizadoOrcamento(state, o.categoriaId, currentMonth), 0);
  const pctUsado = totalPlanejado > 0 ? (totalRealizado / totalPlanejado) * 100 : 0;
  const pctUsadoClamp = Math.min(100, pctUsado);
  const disponivel = totalPlanejado - totalRealizado;
  const pctRestante = Math.max(0, 100 - pctUsado);
  const circunfDonut = 2 * Math.PI * 66;
  const corDonut = dashOrcTab === "entrada" ? "var(--positive)" : dashOrcTab === "investimento" ? "var(--type-investimento)" : "var(--negative)";
  const labelGasto = dashOrcTab === "entrada" ? "Recebido no mês" : dashOrcTab === "investimento" ? "Investido no mês" : "Gasto no mês";
  const labelDisp = dashOrcTab === "entrada" ? "A receber" : dashOrcTab === "investimento" ? "A investir" : "Disponível";

  const totalOver = totalRealizado > totalPlanejado && dashOrcTab !== "entrada";
  const corProgressoTotal = dashOrcTab === "entrada" ? "var(--type-entrada)" : dashOrcTab === "investimento" ? "var(--type-investimento)" : "var(--type-despesa)";
  const orcsSorted = [...orcs].sort((a, b) => {
    const catA = a.categoriaId ? state.categorias.find((c) => c.id === a.categoriaId) : null;
    const catB = b.categoriaId ? state.categorias.find((c) => c.id === b.categoriaId) : null;
    return (catA ? catA.nome : "").localeCompare(catB ? catB.nome : "", "pt-BR");
  });

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      <div style={{ flex: "none", width: 195, marginTop: 24 }}>
        <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto" }}>
          <svg viewBox="0 0 160 160" width={160} height={160}>
            <circle cx={80} cy={80} r={66} fill="none" stroke="var(--line)" strokeWidth={14} />
            <circle cx={80} cy={80} r={66} fill="none" stroke={corDonut} strokeWidth={14} strokeLinecap="round" strokeDasharray={`${((pctUsadoClamp / 100) * circunfDonut).toFixed(1)} ${circunfDonut.toFixed(1)}`} transform="rotate(-90 80 80)" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: "var(--ink)", lineHeight: 1 }}>{pctUsado.toFixed(0)}%</div>
            <div style={{ fontSize: 11, color: "var(--gray-400)", textAlign: "center", lineHeight: 1.25, marginTop: 4 }}>
              do orçamento
              <br />
              utilizado
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 26 }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 10.5, color: "var(--gray-400)", marginBottom: 2 }}>{labelGasto}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: corDonut, whiteSpace: "nowrap" }}>{fmtMoney(totalRealizado)}</div>
            <div style={{ fontSize: 10, color: "var(--gray-400)", marginTop: 2, whiteSpace: "nowrap" }}>de {fmtMoney(totalPlanejado)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10.5, color: "var(--gray-400)", marginBottom: 2 }}>{labelDisp}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)", whiteSpace: "nowrap" }}>{fmtMoney(disponivel)}</div>
            <div style={{ fontSize: 10, color: "var(--gray-400)", marginTop: 2, whiteSpace: "nowrap" }}>{pctRestante.toFixed(0)}% restante</div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {!orcsSorted.length ? (
          <div className="empty-state">
            <Icon name="empty" size={38} />
            <div>Nenhum orçamento de {dashOrcTab === "entrada" ? "entrada" : dashOrcTab === "investimento" ? "investimento" : "despesa"} definido para este mês.</div>
          </div>
        ) : (
          <>
            {orcsSorted.map((o) => {
              const cat = o.categoriaId ? state.categorias.find((c) => c.id === o.categoriaId) : null;
              const realizado = realizadoOrcamento(state, o.categoriaId, currentMonth);
              const valorPlanejadoMes = valorPlanejadoEfetivo(o, currentMonth);
              const pctReal = valorPlanejadoMes > 0 ? (realizado / valorPlanejadoMes) * 100 : 0;
              const pct = Math.min(100, pctReal);
              const over = realizado > valorPlanejadoMes;
              const destacarNegativo = over && dashOrcTab !== "entrada";
              const corBarraCat = dashOrcTab === "entrada" ? "var(--type-entrada)" : dashOrcTab === "investimento" ? "var(--type-investimento)" : "var(--type-despesa)";
              return (
                <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, fontSize: 12.5 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, flex: "none", width: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {cat && <EntityCircle cor={cat.cor} icone={cat.icone} />}
                    {cat ? cat.nome : "—"}
                  </span>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ flex: 1, height: 8, background: "var(--surface-2)", borderRadius: 8, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 8, background: `linear-gradient(90deg, color-mix(in srgb, ${corBarraCat} 65%, white), ${corBarraCat})` }} />
                    </div>
                    <span className="mini-note" style={{ flex: "none", width: 34, textAlign: "right", fontSize: 11 }}>
                      {pctReal.toFixed(0)}%
                    </span>
                  </div>
                  <span style={{ flex: "none", width: 150, textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <strong className={destacarNegativo ? "neg" : ""} style={{ fontWeight: 700 }}>
                      {fmtMoney(realizado)}
                    </strong>{" "}
                    <span className="mini-note" style={{ fontWeight: 400 }}>/ {fmtMoney(valorPlanejadoMes)}</span>
                  </span>
                </div>
              );
            })}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, paddingTop: 10, borderTop: "1px solid var(--line)", fontSize: 12.5, fontWeight: 700 }}>
              <span style={{ flex: "none" }}>Total {dashOrcTab === "entrada" ? "entradas" : dashOrcTab === "investimento" ? "investimentos" : "despesas"}</span>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                <div className="progress-mini" style={{ flex: 1 }}>
                  <div style={{ width: `${Math.min(100, pctUsado)}%`, background: corProgressoTotal }} />
                </div>
                <span style={{ flex: "none", fontSize: 14, fontWeight: 400 }}>{pctUsado.toFixed(0)}%</span>
              </div>
              <span className={totalOver ? "neg" : ""} style={{ flex: "none", whiteSpace: "nowrap" }}>
                {fmtMoney(totalRealizado)} / {fmtMoney(totalPlanejado)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CartoesMiniCards({
  state,
  currentMonth,
  onClickCartao,
}: {
  state: ReturnType<typeof useAppStore.getState>["data"];
  currentMonth: Date;
  onClickCartao: (cartaoId: string, mesKey: string) => void;
}) {
  const cartoesVisiveis = state.cartoes.filter((c) => c.mostrarNoDashboard !== false);
  if (!cartoesVisiveis.length) {
    return (
      <div className="empty-state">
        <Icon name="empty" size={38} />
        <div>Nenhum cartão cadastrado.</div>
      </div>
    );
  }
  return (
    <>
      {cartoesVisiveis.map((c) => {
        let mesRefFatura = currentMonth;
        let itensAtual = state.lancamentos.filter((l) => l.cartaoId === c.id && isInMonthCompetencia(l, mesRefFatura));
        let jaPaga = itensAtual.length > 0 && itensAtual.every((l) => l.efetivado);
        let tentativas = 0;
        while (tentativas < 3 && (itensAtual.length === 0 || jaPaga)) {
          const proxTeste = new Date(mesRefFatura.getFullYear(), mesRefFatura.getMonth() + 1, 1);
          const itensProxTeste = state.lancamentos.filter((l) => l.cartaoId === c.id && isInMonthCompetencia(l, proxTeste));
          if (!itensProxTeste.length) break;
          mesRefFatura = proxTeste;
          itensAtual = itensProxTeste;
          jaPaga = itensAtual.every((l) => l.efetivado);
          tentativas++;
        }
        const totalAtual = itensAtual.reduce((s, l) => s + (l.tipo === "despesa" ? l.valor : -l.valor), 0);
        const proxMes = new Date(mesRefFatura.getFullYear(), mesRefFatura.getMonth() + 1, 1);
        const itensProx = state.lancamentos.filter((l) => l.cartaoId === c.id && isInMonthCompetencia(l, proxMes));
        const totalProx = itensProx.reduce((s, l) => s + (l.tipo === "despesa" ? l.valor : -l.valor), 0);
        const vencAlerta = faturaPrecisaPagar(state, c);
        const mesVencAtual = c.diaVencimento < c.diaFechamento ? new Date(mesRefFatura.getFullYear(), mesRefFatura.getMonth() + 1, c.diaVencimento) : new Date(mesRefFatura.getFullYear(), mesRefFatura.getMonth(), c.diaVencimento);
        const mesFoiAjustado = monthKey(mesRefFatura) !== monthKey(currentMonth);
        const mesAbrevRef = `${MES_ABREV[mesRefFatura.getMonth()]}/${String(mesRefFatura.getFullYear()).slice(2)}`;
        const corTexto = contrastIconColor(c.cor);
        return (
          <div
            key={c.id}
            className="dash-cartao-mini"
            style={{ background: c.cor, color: corTexto, borderRadius: 12, padding: "16px 18px", marginBottom: 10, cursor: "pointer" }}
            onClick={() => onClickCartao(c.id, monthKey(mesRefFatura))}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <strong style={{ fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nome}</strong>
              </div>
              {vencAlerta && (
                <span className="badge-status previsto" style={{ flex: "none", whiteSpace: "nowrap" }}>
                  Fechada
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontSize: 13, lineHeight: 1.7, opacity: 0.92 }}>
                <div>Vence em {fmtDate(mesVencAtual.toISOString().slice(0, 10))}</div>
                <div>Próxima fatura: {fmtMoney(totalProx)}</div>
              </div>
              <div style={{ textAlign: "right", flex: "none" }}>
                {mesFoiAjustado && <div style={{ fontSize: 11, opacity: 0.8 }}>{mesAbrevRef}</div>}
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 22, lineHeight: 1.15 }}>{fmtMoney(totalAtual)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

function UltimosLancamentos({
  state,
  tab,
  onClickLancamento,
}: {
  state: ReturnType<typeof useAppStore.getState>["data"];
  tab: "todas" | "entrada" | "saida";
  onClickLancamento: (id: string) => void;
}) {
  const todosLancsRaw = state.lancamentos.filter((l) => l.tipo === "entrada" || l.tipo === "despesa");
  const jaVistoGrupo = new Set<string>();
  const todosLancs: (Lancamento & { _valorExibicao: number; _isParceladoAgrupado?: boolean })[] = [];
  const ordenadosPorParcela = [...todosLancsRaw].sort((a, b) => (a.recorrencia.ativa ? a.recorrencia.parcelaAtual || 0 : 0) - (b.recorrencia.ativa ? b.recorrencia.parcelaAtual || 0 : 0));
  for (const l of ordenadosPorParcela) {
    const isParcelado = l.recorrencia.ativa && l.recorrencia.tipo === "parcelado" && l.recorrencia.grupoId;
    if (isParcelado && l.recorrencia.ativa) {
      const grupoId = l.recorrencia.grupoId;
      if (jaVistoGrupo.has(grupoId)) continue;
      jaVistoGrupo.add(grupoId);
      const parcelas = todosLancsRaw.filter((x) => x.recorrencia.ativa && x.recorrencia.grupoId === grupoId);
      const primeira = parcelas.reduce((min, x) => ((x.recorrencia.ativa ? x.recorrencia.parcelaAtual || 0 : 0) < (min.recorrencia.ativa ? min.recorrencia.parcelaAtual || 0 : 0) ? x : min), parcelas[0]);
      const valorTotalGrupo = parcelas.reduce((s, x) => s + x.valor, 0);
      todosLancs.push({ ...primeira, _valorExibicao: valorTotalGrupo, _isParceladoAgrupado: true });
    } else {
      todosLancs.push({ ...l, _valorExibicao: l.valor });
    }
  }
  todosLancs.sort((a, b) => (b.criadoEm || "").localeCompare(a.criadoEm || "") || b.data.localeCompare(a.data) || (b.hora || "").localeCompare(a.hora || ""));
  const filtrados = tab === "todas" ? todosLancs : tab === "entrada" ? todosLancs.filter((l) => l.tipo === "entrada") : todosLancs.filter((l) => l.tipo === "despesa");
  const ultimasN = filtrados.slice(0, 5);

  if (!ultimasN.length) {
    return (
      <div className="empty-state">
        <Icon name="empty" size={38} />
        <div>Nenhum lançamento encontrado.</div>
      </div>
    );
  }

  return (
    <>
      {ultimasN.map((l) => {
        const cat = l.categoriasIds[0] ? state.categorias.find((c) => c.id === l.categoriasIds[0]) : null;
        const subcat = l.categoriasIds[1] ? state.categorias.find((c) => c.id === l.categoriasIds[1]) : null;
        const isMultiCat = Array.isArray(l.categoriasSplits) && l.categoriasSplits.length > 1;
        const nomeExibido = l._isParceladoAgrupado ? (l.nome || "").replace(/\s*\(\d+\/\d+\)\s*$/, "") : l.nome;
        return (
          <div key={l.id} className="dash-row" style={{ padding: "6px 4px" }} onClick={() => onClickLancamento(l.id)}>
            <div className="dash-row-main">
              {isMultiCat ? (
                <span className="cat-circle" style={{ background: "#4A473E", color: "#fff" }}>
                  <Icon name="splitCat" size={16} />
                </span>
              ) : subcat ? (
                <EntityCircle cor={subcat.cor} icone={subcat.icone} />
              ) : cat ? (
                <EntityCircle cor={cat.cor} icone={cat.icone} />
              ) : (
                <span className="cat-circle" style={{ background: "var(--gray-100)", color: "var(--gray-400)" }}>
                  <Icon name="detail" size={16} />
                </span>
              )}
              <div style={{ minWidth: 0 }}>
                <div className="dash-row-name" style={{ fontSize: 12.5 }}>
                  {nomeExibido}
                  {l._isParceladoAgrupado && (
                    <span className="mini-note" style={{ margin: 0, fontWeight: 400 }}>
                      {" "}
                      (total parcelado)
                    </span>
                  )}
                </div>
                <div className="mini-note" style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {isMultiCat ? "Multicategoria" : subcat && cat ? catLabel(state.categorias, subcat.id) : cat ? cat.nome : "Sem categoria"}
                </div>
              </div>
            </div>
            <div className="dash-row-vals">
              <div className={`val ${l.tipo === "despesa" ? "neg" : "pos"}`} style={{ fontSize: 14, marginTop: 0 }}>
                {l.tipo === "despesa" ? "- " : ""}
                {fmtMoney(l._valorExibicao)}
              </div>
              <div className="dash-row-previsto">{fmtDate((l.criadoEm || l.data).slice(0, 10))}</div>
            </div>
            <span className="tt-icon" style={{ color: "var(--gray-400)", width: 16, height: 16, flex: "none" }}>
              <Icon name="detail" size={16} />
            </span>
          </div>
        );
      })}
    </>
  );
}

function ComparativoCategoriasChart({ linhas }: { linhas: { cat: { id: string } | null | undefined; nome: string; atual: number; anterior: number; delta: number; pct: number }[] }) {
  const maxValor = Math.max(1, ...linhas.flatMap((l) => [l.atual, l.anterior]));
  const alturaMax = 130;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 24 }}>
      {linhas.map((l, i) => {
        const subiu = l.delta > 0;
        const hAtual = Math.max(2, (l.atual / maxValor) * alturaMax);
        const hAnterior = Math.max(2, (l.anterior / maxValor) * alturaMax);
        return (
          <div key={l.cat?.id ?? i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: alturaMax }}>
              <div title={fmtMoney(l.atual)} style={{ width: 16, height: hAtual.toFixed(1) + "px", background: "var(--chart-dark-bar)", borderRadius: "3px 3px 0 0" }} />
              <div title={fmtMoney(l.anterior)} style={{ width: 16, height: hAnterior.toFixed(1) + "px", background: "var(--type-investimento)", borderRadius: "3px 3px 0 0" }} />
            </div>
            <span className={subiu ? "neg" : "pos"} style={{ fontSize: 14, fontWeight: 700, marginTop: 16, whiteSpace: "nowrap" }}>
              {subiu ? "▲" : l.delta < 0 ? "▼" : "—"}
              {Math.abs(l.pct).toFixed(0)}%
            </span>
            <span style={{ fontSize: 10.5, marginTop: 6, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{l.nome}</span>
          </div>
        );
      })}
    </div>
  );
}
