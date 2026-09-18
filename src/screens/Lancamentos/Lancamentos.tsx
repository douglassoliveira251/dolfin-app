import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useConfirm } from "../../components/ConfirmDialog";
import { EntityCircle } from "../../components/EntityCircle";
import { Icon } from "../../components/icons/Icon";
import type { IconName } from "../../components/icons/registry";
import { KpiCard } from "../../components/KpiCard";
import { useScopeChoice } from "../../components/ScopeChoiceModal";
import { showToast } from "../../components/Toast";
import { catLabel } from "../../data/calculations/categorias";
import { isInMonth, lancamentosDoMes } from "../../data/calculations/lancamentos";
import { fmtDate, fmtMoney, nowTimeStr, sortByData, todayStr } from "../../data/format";
import { persist } from "../../data/persistence";
import type { Lancamento, TipoLancamento } from "../../data/schema";
import { uid } from "../../data/schema";
import { useAppStore } from "../../data/store";
import { LancamentoModal } from "./LancamentoModal";

type FiltroTipo = "todos" | TipoLancamento;

const TIPO_TABS: { tipo: FiltroTipo; label: string; icon: IconName; cor: string }[] = [
  { tipo: "todos", label: "Todos", icon: "dashboard", cor: "var(--ink-soft)" },
  { tipo: "entrada", label: "Receitas", icon: "kpiArrowDown", cor: "var(--positive)" },
  { tipo: "despesa", label: "Despesas", icon: "kpiArrowUp", cor: "var(--negative)" },
  { tipo: "transferencia", label: "Transferências", icon: "swap", cor: "var(--type-transferencia)" },
  { tipo: "investimento", label: "Investimentos", icon: "kpiTrend", cor: "var(--type-investimento)" },
];

const NOVO_OPCOES: { tipo: TipoLancamento; label: string; icon: IconName }[] = [
  { tipo: "entrada", label: "Receita", icon: "kpiArrowDown" },
  { tipo: "despesa", label: "Despesa", icon: "kpiArrowUp" },
  { tipo: "transferencia", label: "Transferência", icon: "swap" },
  { tipo: "investimento", label: "Investimento", icon: "kpiTrend" },
];

const PAGE_SIZES = [10, 25, 50];

export function Lancamentos() {
  const state = useAppStore((s) => s.data);
  const currentMonth = useAppStore((s) => s.currentMonth);
  const deleteLancamento = useAppStore((s) => s.deleteLancamento);
  const deleteLancamentosSerie = useAppStore((s) => s.deleteLancamentosSerie);
  const toggleEfetivadoLancamento = useAppStore((s) => s.toggleEfetivadoLancamento);
  const saveLancamento = useAppStore((s) => s.saveLancamento);
  const updateConfiguracoes = useAppStore((s) => s.updateConfiguracoes);
  const { confirm, dialog: confirmDialog } = useConfirm();
  const { askScope, dialog: scopeDialog } = useScopeChoice();

  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [filtroContaId, setFiltroContaId] = useState("");
  const [filtroCategoriaId, setFiltroCategoriaId] = useState("");
  const [ocultarEfetivados, setOcultarEfetivados] = useState(false);
  const [busca, setBusca] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(state.configuracoes.lancPageSizePadrao || 10);
  const [novoPopoverOpen, setNovoPopoverOpen] = useState(false);
  const [modalState, setModalState] = useState<{ id: string | null; tipo?: TipoLancamento } | null>(null);

  const novoTriggerRef = useRef<HTMLButtonElement>(null);

  const isTransf = filtroTipo === "transferencia";

  const lancsDoMesTodos = lancamentosDoMes(state, currentMonth);
  const kpiReceitas = lancsDoMesTodos.filter((l) => l.tipo === "entrada");
  const kpiDespesas = lancsDoMesTodos.filter((l) => l.tipo === "despesa");
  const kpiTransferencias = lancsDoMesTodos.filter((l) => l.tipo === "transferencia");
  const kpiReceitasEfetivado = kpiReceitas.filter((l) => l.efetivado).reduce((s, l) => s + l.valor, 0);
  const kpiReceitasPrevisto = kpiReceitas.filter((l) => !l.efetivado).reduce((s, l) => s + l.valor, 0);
  const kpiDespesasEfetivado = kpiDespesas.filter((l) => l.efetivado).reduce((s, l) => s + l.valor, 0);
  const kpiDespesasPrevisto = kpiDespesas.filter((l) => !l.efetivado).reduce((s, l) => s + l.valor, 0);
  const kpiTransferenciasTotal = kpiTransferencias.reduce((s, l) => s + l.valor, 0);
  const kpiInvestidoTotal = state.investimentos.aportes
    .filter((a) => a.efetivado && isInMonth(a.data, currentMonth))
    .reduce((s, a) => s + (a.tipo === "resgate" ? -a.valor : a.valor), 0);

  let itens = lancsDoMesTodos.filter((l) => filtroTipo === "todos" || l.tipo === filtroTipo);
  if (filtroContaId) itens = itens.filter((l) => l.contaId === filtroContaId || l.contaDestinoId === filtroContaId);
  if (filtroCategoriaId) itens = itens.filter((l) => l.categoriasIds.includes(filtroCategoriaId));
  if (ocultarEfetivados) itens = itens.filter((l) => !l.efetivado);
  if (busca.trim()) itens = itens.filter((l) => (l.nome || "").toLowerCase().includes(busca.trim().toLowerCase()));
  itens = sortByData(itens, state.configuracoes.ordenacaoDecrescente);

  const totalCount = itens.length;
  const totalPaginas = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageClamped = Math.min(page, totalPaginas);
  const inicioPag = (pageClamped - 1) * pageSize;
  const itensPagina = itens.slice(inicioPag, inicioPag + pageSize);

  function handleToggleKpi(tipo: FiltroTipo) {
    setFiltroTipo((prev) => (prev === tipo ? "todos" : tipo));
    setFiltroCategoriaId("");
    setPage(1);
  }

  function handleFiltroTipo(tipo: FiltroTipo) {
    setFiltroTipo(tipo);
    setFiltroCategoriaId("");
    setPage(1);
  }

  async function handleToggleEfetivar(l: Lancamento, e: React.MouseEvent) {
    e.stopPropagation();
    if (l.cartaoId) return;
    toggleEfetivadoLancamento(l.id);
    await persist();
  }

  async function handleDuplicar(l: Lancamento, e: React.MouseEvent) {
    e.stopPropagation();
    const copia: Lancamento = { ...l, id: uid("lanc"), data: todayStr(), hora: nowTimeStr(), nome: (l.nome || "") + " (cópia)", recorrencia: { ativa: false } };
    saveLancamento(copia);
    await persist();
    showToast("Lançamento duplicado.");
  }

  async function handleDelete(l: Lancamento, e: React.MouseEvent) {
    e.stopPropagation();
    if (!l.recorrencia.ativa) {
      const ok = await confirm("Deseja excluir este lançamento? Essa ação não pode ser desfeita.", { danger: true });
      if (!ok) return;
      deleteLancamento(l.id);
      await persist(true);
      showToast("Lançamento excluído.");
      return;
    }
    const escolha = await askScope(
      "Excluir lançamento recorrente",
      [
        { value: "uma", label: "Somente esta ocorrência" },
        { value: "futuras", label: "Esta e as futuras" },
        { value: "todas", label: "Todas as ocorrências da série" },
      ],
      "Este lançamento faz parte de uma série. O que deseja excluir?",
    );
    if (!escolha) return;
    const ok = await confirm("Confirma a exclusão? Essa ação não pode ser desfeita.", { danger: true });
    if (!ok) return;
    const grupoId = l.recorrencia.grupoId;
    if (escolha === "uma") deleteLancamento(l.id);
    else if (escolha === "futuras") {
      deleteLancamentosSerie(grupoId, l.data);
      deleteLancamento(l.id);
    } else deleteLancamentosSerie(grupoId);
    await persist(true);
    showToast("Lançamento excluído.");
  }

  async function handlePageSizeChange(v: number) {
    setPageSize(v);
    setPage(1);
    updateConfiguracoes({ lancPageSizePadrao: v });
    await persist();
  }

  return (
    <div className="view">
      <div className="view-header" style={{ marginBottom: 2 }}>
        <div>
          <h1>Lançamentos</h1>
          <div className="sub">Suas entradas, despesas e transferências</div>
        </div>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="btn-create"
            ref={novoTriggerRef}
            onClick={(e) => {
              e.stopPropagation();
              setNovoPopoverOpen((v) => !v);
            }}
          >
            <span className="badge-plus">
              <Icon name="plus" size={14} />
            </span>{" "}
            Lançamento
          </button>
          {novoPopoverOpen && (
            <TriggerPopover onClose={() => setNovoPopoverOpen(false)} triggerRef={novoTriggerRef} width={190} align="right">
              {NOVO_OPCOES.map((o) => (
                <button
                  key={o.tipo}
                  type="button"
                  className="fab-menu-item"
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                  onClick={() => {
                    setNovoPopoverOpen(false);
                    setModalState({ id: null, tipo: o.tipo });
                  }}
                >
                  <Icon name={o.icon} size={15} /> {o.label}
                </button>
              ))}
            </TriggerPopover>
          )}
        </div>
      </div>

      <div className="kpi-grid cols4" style={{ marginBottom: 16 }}>
        <KpiCard
          icon="kpiArrowDown"
          iconBgLight="#DFF0E4"
          iconColorLight="var(--positive)"
          iconBgDark="#16A34A"
          label="Receitas"
          value={fmtMoney(kpiReceitasEfetivado)}
          valueTone="pos"
          sub={
            <>
              Previsto: <span style={{ color: "var(--positive)", fontWeight: 500 }}>{fmtMoney(kpiReceitasEfetivado + kpiReceitasPrevisto)}</span>
            </>
          }
          onClick={() => handleToggleKpi("entrada")}
        />
        <KpiCard
          icon="kpiArrowUp"
          iconBgLight="#F5E0DC"
          iconColorLight="var(--negative)"
          iconBgDark="#DC2626"
          label="Despesas"
          value={fmtMoney(kpiDespesasEfetivado)}
          valueTone="neg"
          sub={
            <>
              Previsto: <span style={{ color: "var(--negative)", fontWeight: 500 }}>{fmtMoney(kpiDespesasEfetivado + kpiDespesasPrevisto)}</span>
            </>
          }
          onClick={() => handleToggleKpi("despesa")}
        />
        <KpiCard
          icon="swap"
          iconBgLight="#FAEEDA"
          iconColorLight="var(--type-transferencia)"
          iconBgDark="#CA8A04"
          label="Transferências"
          value={fmtMoney(kpiTransferenciasTotal)}
          sub={`${kpiTransferencias.length} movimentaç${kpiTransferencias.length !== 1 ? "ões" : "ão"}`}
          onClick={() => handleToggleKpi("transferencia")}
        />
        <KpiCard
          icon="kpiTrend"
          iconBgLight="#DCE7F1"
          iconColorLight="var(--type-investimento)"
          iconBgDark="#2563EB"
          label="Investimentos"
          value={fmtMoney(kpiInvestidoTotal)}
          valueTone={kpiInvestidoTotal < 0 ? "neg" : "neutral"}
          sub="Aportes líquidos no mês"
          onClick={() => handleToggleKpi("investimento")}
        />
      </div>

      <div className="table-wrap">
        <div className="table-toolbar" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div className="search-box" style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, maxWidth: 320, height: 38, boxSizing: "border-box", padding: "0 10px", background: "var(--surface-2)" }}>
            <span className="tt-icon" style={{ color: "var(--gray-400)", flex: "none", width: 13, height: 13 }}>
              <Icon name="search" size={13} />
            </span>
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPage(1);
              }}
              style={{ border: "none", background: "transparent", padding: 0, width: "100%", outline: "none", fontSize: 12.5 }}
            />
            {busca && (
              <button
                type="button"
                className="tt-icon"
                style={{ color: "var(--gray-400)", flex: "none", width: 13, height: 13, cursor: "pointer", background: "none", border: "none", padding: 0 }}
                onClick={() => {
                  setBusca("");
                  setPage(1);
                }}
              >
                <Icon name="close" size={13} />
              </button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="mini-note" style={{ margin: 0 }}>
              Filtrar por:
            </span>
            <TipoFiltroButton value={filtroTipo} onChange={handleFiltroTipo} />
            <ContaFiltroButton contaId={filtroContaId} onChange={(v) => { setFiltroContaId(v); setPage(1); }} />
            {!isTransf && (
              <CategoriaFiltroButton tipo={filtroTipo === "todos" ? null : filtroTipo} categoriaId={filtroCategoriaId} onChange={(v) => { setFiltroCategoriaId(v); setPage(1); }} />
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="mini-note" style={{ margin: 0 }}>
                Ocultar efetivados
              </span>
              <div
                className={`switch${ocultarEfetivados ? " on" : ""}`}
                onClick={() => {
                  setOcultarEfetivados((v) => !v);
                  setPage(1);
                }}
              >
                <span className="knob" />
              </div>
            </div>
          </div>
        </div>

        <div className="table-scroll">
          <table className="tbl-compact-lanc">
            <thead>
              <tr>
                <th></th>
                <th>Data/Hora</th>
                <th>Nome</th>
                {!isTransf && <th>Categoria</th>}
                <th>Conta/Cartão</th>
                <th style={{ textAlign: "right" }}>Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {itensPagina.length === 0 && (
                <tr>
                  <td colSpan={isTransf ? 6 : 7}>
                    <div className="empty-state">
                      <Icon name="empty" size={38} />
                      <div>Nenhum lançamento neste mês. Clique em "Lançamento" para começar.</div>
                    </div>
                  </td>
                </tr>
              )}
              {itensPagina.map((l) => {
                const conta = l.contaId ? state.contas.find((c) => c.id === l.contaId) : null;
                const destino = l.contaDestinoId ? state.contas.find((c) => c.id === l.contaDestinoId) : null;
                const cartao = l.cartaoId ? state.cartoes.find((c) => c.id === l.cartaoId) : null;
                const sinal = l.tipo === "despesa" || l.tipo === "investimento" ? "-" : l.tipo === "entrada" ? "+" : "";
                const corClasse = l.tipo === "entrada" ? "pos" : l.tipo === "despesa" || l.tipo === "investimento" ? "neg" : "";
                const multiSplit = Array.isArray(l.categoriasSplits) && l.categoriasSplits.length > 1;
                const catPai = l.categoriasIds[0] ? state.categorias.find((c) => c.id === l.categoriasIds[0]) : null;
                const subcat = l.categoriasIds[1] ? state.categorias.find((c) => c.id === l.categoriasIds[1]) : null;
                return (
                  <tr
                    key={l.id}
                    className={`lanc-row${cartao ? (l.efetivado ? " cartao-pago" : " cartao-pendente") : ""}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setModalState({ id: l.id })}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <span
                        className={`efetivar-dot${l.efetivado ? " on" : ""}${l.cartaoId ? " disabled" : ""}`}
                        title={l.cartaoId ? "Controlado pelo pagamento da fatura" : "Marcar como efetivado"}
                        onClick={(e) => handleToggleEfetivar(l, e)}
                      >
                        <Icon name="check" size={11} />
                      </span>
                    </td>
                    <td>
                      {fmtDate(l.data)} <span>{l.hora}</span>
                    </td>
                    <td>
                      {l.nome || "—"}
                      {l.recorrencia.ativa && (
                        <span className="tt-icon" style={{ color: "var(--gray-400)", width: 15, height: 15, display: "inline-flex", marginLeft: 4, verticalAlign: "middle" }}>
                          <Icon name="repeat" size={14} />
                        </span>
                      )}
                      {multiSplit && (
                        <span className="tt-icon" style={{ color: "#4A473E", width: 15, height: 15, display: "inline-flex", marginLeft: 4, verticalAlign: "middle" }} title="Lançamento com múltiplas categorias">
                          <Icon name="splitCat" size={14} />
                        </span>
                      )}
                      {cartao && (
                        <span className="mini-note" style={{ display: "inline" }}>
                          {" "}
                          ({cartao.nome})
                        </span>
                      )}
                      {l.descricao && <div className="mini-note">{l.descricao}</div>}
                    </td>
                    {!isTransf && (
                      <td>
                        {multiSplit ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <span className="cat-circle" style={{ background: "#4A473E", color: "#fff" }}>
                              <Icon name="splitCat" size={13} />
                            </span>
                            Multicategoria
                          </span>
                        ) : subcat ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <EntityCircle cor={subcat.cor} icone={subcat.icone} />
                            {catLabel(state.categorias, subcat.id)}
                          </span>
                        ) : catPai ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <EntityCircle cor={catPai.cor} icone={catPai.icone} />
                            {catPai.nome}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    )}
                    <td>
                      {l.tipo === "transferencia" ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                          {conta && <EntityCircle cor={conta.cor} icone={conta.icone} />}
                          <span>{conta ? conta.nome : "?"}</span>
                          <span className="tt-icon" style={{ display: "inline-flex", color: "var(--gray-400)" }}>
                            <Icon name="swap" size={13} />
                          </span>
                          {destino && <EntityCircle cor={destino.cor} icone={destino.icone} />}
                          <span>{destino ? destino.nome : "?"}</span>
                        </span>
                      ) : cartao ? (
                        <>
                          <div className="mini-note" style={{ marginBottom: 2 }}>
                            Cartão de Crédito
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <EntityCircle cor={cartao.cor} icone={cartao.icone} />
                            {cartao.nome}
                          </div>
                        </>
                      ) : conta ? (
                        <>
                          <div className="mini-note" style={{ marginBottom: 2, textTransform: "capitalize" }}>
                            {{ corrente: "Conta Corrente", poupanca: "Poupança", carteira: "Carteira", investimento: "Investimento" }[conta.tipo] || conta.tipo}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <EntityCircle cor={conta.cor} icone={conta.icone} />
                            {conta.nome}
                          </div>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ textAlign: "right" }} className={`${corClasse} valor-destaque`}>
                      {sinal}
                      {fmtMoney(l.valor)}
                    </td>
                    <td onClick={(e) => e.stopPropagation()} style={{ whiteSpace: "nowrap" }}>
                      <button type="button" className="icon-btn" title="Duplicar" onClick={(e) => handleDuplicar(l, e)}>
                        <Icon name="duplicate" size={14} />
                      </button>
                      <button type="button" className="icon-btn danger" title="Excluir" onClick={(e) => handleDelete(l, e)}>
                        <Icon name="trash" size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="table-toolbar" style={{ justifyContent: "space-between", borderTop: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="mini-note" style={{ margin: 0 }}>
              Itens por página:
            </span>
            <select value={pageSize} style={{ width: "auto", padding: "4px 8px" }} onChange={(e) => handlePageSizeChange(Number(e.target.value))}>
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button type="button" className="icon-btn" disabled={pageClamped <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <Icon name="chevronLeft" size={14} />
            </button>
            <span className="mini-note" style={{ margin: 0 }}>
              Página {pageClamped} de {totalPaginas}
            </span>
            <button type="button" className="icon-btn" disabled={pageClamped >= totalPaginas} onClick={() => setPage((p) => p + 1)}>
              <Icon name="detail" size={14} />
            </button>
          </div>
        </div>
      </div>

      {modalState && <LancamentoModal lancamentoId={modalState.id} presetTipo={modalState.tipo} onClose={() => setModalState(null)} />}
      {confirmDialog}
      {scopeDialog}
    </div>
  );
}

function TriggerPopover({
  children,
  onClose,
  triggerRef,
  width = 220,
  align = "left",
}: {
  children: React.ReactNode;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  width?: number;
  align?: "left" | "right";
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) {
      const left = align === "right" ? Math.min(r.right - width, window.innerWidth - width - 8) : Math.min(r.left, window.innerWidth - width - 8);
      setPos({ top: r.bottom + 6, left: Math.max(8, left) });
    }
    document.addEventListener("click", onClose);
    return () => document.removeEventListener("click", onClose);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!pos) return null;

  return createPortal(
    <div
      className="color-popover open"
      style={{ position: "fixed", top: pos.top, left: pos.left, width, zIndex: 20, maxHeight: 300, overflow: "auto" } as CSSProperties}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  );
}

function TipoFiltroButton({ value, onChange }: { value: FiltroTipo; onChange: (v: FiltroTipo) => void }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const atual = TIPO_TABS.find((t) => t.tipo === value) ?? TIPO_TABS[0];
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        className="btn ghost small"
        ref={triggerRef}
        style={{ display: "flex", alignItems: "center", gap: 6 }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <span className="tt-icon" style={{ color: atual.cor }}>
          <Icon name={atual.icon} size={14} />
        </span>
        Tipo{value !== "todos" ? ": " + atual.label : ""}
      </button>
      {open && (
        <TriggerPopover onClose={() => setOpen(false)} triggerRef={triggerRef} width={190}>
          {TIPO_TABS.map((t) => (
            <button
              key={t.tipo}
              type="button"
              className="fab-menu-item"
              style={{ display: "flex", alignItems: "center", gap: 8, background: value === t.tipo ? "var(--surface-2)" : "none" }}
              onClick={() => {
                setOpen(false);
                onChange(t.tipo);
              }}
            >
              <span className="tt-icon" style={{ color: t.cor }}>
                <Icon name={t.icon} size={15} />
              </span>
              {t.label}
            </button>
          ))}
        </TriggerPopover>
      )}
    </div>
  );
}

function ContaFiltroButton({ contaId, onChange }: { contaId: string; onChange: (v: string) => void }) {
  const contas = useAppStore((s) => s.data.contas);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const atual = contaId ? contas.find((c) => c.id === contaId) : null;
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        className="btn ghost small"
        ref={triggerRef}
        style={{ display: "flex", alignItems: "center", gap: 6 }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <Icon name="contas" size={14} /> Contas{atual ? ": " + atual.nome : ""}
      </button>
      {open && (
        <TriggerPopover onClose={() => setOpen(false)} triggerRef={triggerRef} width={220}>
          <button type="button" className="fab-menu-item" onClick={() => { setOpen(false); onChange(""); }}>
            Todas as contas
          </button>
          {contas
            .filter((c) => !c.arquivada)
            .map((c) => (
              <button
                key={c.id}
                type="button"
                className="fab-menu-item"
                style={{ display: "flex", alignItems: "center", gap: 8 }}
                onClick={() => {
                  setOpen(false);
                  onChange(c.id);
                }}
              >
                <EntityCircle cor={c.cor} icone={c.icone} /> {c.nome}
              </button>
            ))}
        </TriggerPopover>
      )}
    </div>
  );
}

function CategoriaFiltroButton({ tipo, categoriaId, onChange }: { tipo: TipoLancamento | null; categoriaId: string; onChange: (v: string) => void }) {
  const categorias = useAppStore((s) => s.data.categorias);
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const atual = categoriaId ? categorias.find((c) => c.id === categoriaId) : null;
  const cats = categorias.filter((c) => (tipo ? c.tipo === tipo : true) && !c.categoriaPaiId && c.nome.toLowerCase().includes(busca.toLowerCase()));
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        className="btn ghost small"
        ref={triggerRef}
        style={{ display: "flex", alignItems: "center", gap: 6 }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <Icon name="categorias" size={14} /> Categorias{atual ? ": " + atual.nome : ""}
      </button>
      {open && (
        <TriggerPopover onClose={() => setOpen(false)} triggerRef={triggerRef} width={240}>
          <input type="text" placeholder="Buscar categoria..." value={busca} onChange={(e) => setBusca(e.target.value)} style={{ marginBottom: 8 }} onClick={(e) => e.stopPropagation()} />
          <div style={{ maxHeight: 240, overflow: "auto" }}>
            <button type="button" className="fab-menu-item" onClick={() => { setOpen(false); onChange(""); }}>
              Todas as categorias
            </button>
            {cats.map((c) => (
              <button
                key={c.id}
                type="button"
                className="fab-menu-item"
                style={{ display: "flex", alignItems: "center", gap: 8 }}
                onClick={() => {
                  setOpen(false);
                  onChange(c.id);
                }}
              >
                <EntityCircle cor={c.cor} icone={c.icone} /> {c.nome}
              </button>
            ))}
          </div>
        </TriggerPopover>
      )}
    </div>
  );
}
