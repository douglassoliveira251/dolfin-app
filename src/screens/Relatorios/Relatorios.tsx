import { useEffect, useRef, useState } from "react";
import { EntityCircle } from "../../components/EntityCircle";
import { Icon } from "../../components/icons/Icon";
import type { IconName } from "../../components/icons/registry";
import { catFilhas } from "../../data/calculations/categorias";
import { fmtDate, fmtMoney, todayStr } from "../../data/format";
import type { Lancamento } from "../../data/schema";
import { useAppStore } from "../../data/store";

interface RelatorioFiltro {
  dataInicio: string | null;
  dataFim: string | null;
  tipos: string[];
  categoriasIds: string[];
  tagsIds: string[];
  nome: string;
  status: string[];
  contasIds: string[];
  cartoesIds: string[];
}

function filtroVazio(): RelatorioFiltro {
  return { dataInicio: null, dataFim: null, tipos: [], categoriasIds: [], tagsIds: [], nome: "", status: [], contasIds: [], cartoesIds: [] };
}

const TIPO_OPTS = [
  { id: "entrada", nome: "Entrada" },
  { id: "despesa", nome: "Despesa" },
  { id: "transferencia", nome: "Transferência" },
];
const STATUS_OPTS = [
  { id: "efetivado", nome: "Efetivado" },
  { id: "pendente", nome: "Não efetivado" },
];

const PAGE_SIZES = [10, 25, 50];

interface LinhaTexto {
  data: string;
  nome: string;
  tipo: string;
  categoria: string;
  conta: string;
  status: string;
  valor: number;
}

export function Relatorios() {
  const state = useAppStore((s) => s.data);
  const [filtro, setFiltro] = useState<RelatorioFiltro>(filtroVazio());
  const [resultados, setResultados] = useState<Lancamento[] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const categoriasFlat = state.categorias
    .filter((c) => !c.categoriaPaiId)
    .flatMap((pai) => [
      { id: pai.id, nome: pai.nome },
      ...catFilhas(state.categorias, pai.id, true).map((sub) => ({ id: sub.id, nome: `${pai.nome} › ${sub.nome}` })),
    ]);
  const contasOpts = state.contas.map((c) => ({ id: c.id, nome: c.nome }));
  const cartoesOpts = state.cartoes.map((c) => ({ id: c.id, nome: c.nome }));
  const tagsOpts = state.tags.map((t) => ({ id: t.id, nome: t.nome }));

  function aplicarFiltro(): Lancamento[] {
    const f = filtro;
    return state.lancamentos
      .filter((l) => {
        const dataComp = l.efetivado ? l.dataEfetivacao || l.data : l.data;
        if (f.dataInicio && dataComp < f.dataInicio) return false;
        if (f.dataFim && dataComp > f.dataFim) return false;
        if (f.tipos.length && !f.tipos.includes(l.tipo)) return false;
        if (f.status.length) {
          const st = l.efetivado ? "efetivado" : "pendente";
          if (!f.status.includes(st)) return false;
        }
        if (f.nome.trim() && !(l.nome || "").toLowerCase().includes(f.nome.trim().toLowerCase())) return false;
        if (f.categoriasIds.length) {
          const catsDoLanc =
            Array.isArray(l.categoriasSplits) && l.categoriasSplits.length
              ? l.categoriasSplits.flatMap((s) => [s.categoriaId, s.subcategoriaId].filter((x): x is string => !!x))
              : l.categoriasIds || [];
          if (!catsDoLanc.some((cid) => f.categoriasIds.includes(cid))) return false;
        }
        if (f.tagsIds.length) {
          if (!(l.tagsIds || []).some((tid) => f.tagsIds.includes(tid))) return false;
        }
        if (f.contasIds.length) {
          if (!f.contasIds.includes(l.contaId || "") && !f.contasIds.includes(l.contaDestinoId || "")) return false;
        }
        if (f.cartoesIds.length) {
          if (!f.cartoesIds.includes(l.cartaoId || "")) return false;
        }
        return true;
      })
      .sort((a, b) => (b.data || "").localeCompare(a.data || "") || (b.hora || "").localeCompare(a.hora || ""));
  }

  function handleGerar() {
    setResultados(aplicarFiltro());
    setPage(1);
  }

  function handleLimpar() {
    setFiltro(filtroVazio());
    setResultados(null);
  }

  function linhaTexto(l: Lancamento): LinhaTexto {
    const catPai = l.categoriasIds[0] ? state.categorias.find((c) => c.id === l.categoriasIds[0]) : null;
    const subcat = l.categoriasIds[1] ? state.categorias.find((c) => c.id === l.categoriasIds[1]) : null;
    const isMultiCat = Array.isArray(l.categoriasSplits) && l.categoriasSplits.length > 1;
    const catTxt = isMultiCat ? "Multicategoria" : subcat ? `${catPai ? catPai.nome : ""} › ${subcat.nome}` : catPai ? catPai.nome : "—";
    const conta = l.contaId ? state.contas.find((c) => c.id === l.contaId) : null;
    const cartao = l.cartaoId ? state.cartoes.find((c) => c.id === l.cartaoId) : null;
    const contaTxt = cartao ? cartao.nome : conta ? conta.nome : "—";
    return {
      data: fmtDate(l.data),
      nome: l.nome || "—",
      tipo: l.tipo === "entrada" ? "Entrada" : l.tipo === "despesa" ? "Despesa" : l.tipo === "investimento" ? "Investimento" : "Transferência",
      categoria: catTxt,
      conta: contaTxt,
      status: l.efetivado ? "Efetivado" : "Pendente",
      valor: l.tipo === "despesa" || l.tipo === "investimento" ? -l.valor : l.valor,
    };
  }

  function handleExportarCsv() {
    if (!resultados) return;
    const linhas = resultados.map(linhaTexto);
    const header = ["Data", "Nome", "Tipo", "Categoria", "Conta/Cartão", "Status", "Valor"];
    const csvRows = [header.join(";")];
    linhas.forEach((l) => {
      csvRows.push(
        [l.data, `"${(l.nome || "").replace(/"/g, '""')}"`, l.tipo, `"${l.categoria.replace(/"/g, '""')}"`, `"${l.conta.replace(/"/g, '""')}"`, l.status, l.valor.toFixed(2).replace(".", ",")].join(";"),
      );
    });
    const total = linhas.reduce((s, l) => s + l.valor, 0);
    csvRows.push(["", "", "", "", "", "Total", total.toFixed(2).replace(".", ",")].join(";"));
    const blob = new Blob(["﻿" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_${todayStr()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleExportarPdf() {
    if (!resultados) return;
    const linhas = resultados.map(linhaTexto);
    const total = linhas.reduce((s, l) => s + l.valor, 0);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Relatório Dolfin</title>
    <style>
      body{font-family:Arial,sans-serif;padding:24px;color:#222;}
      h1{font-size:18px;margin-bottom:4px;}
      p.sub{color:#666;font-size:12px;margin-top:0;margin-bottom:16px;}
      table{width:100%;border-collapse:collapse;font-size:11px;}
      th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;}
      th{background:#f2f2f2;}
      td.valor,th.valor{text-align:right;}
      tfoot td{font-weight:700;border-top:2px solid #999;}
    </style></head><body>
    <h1>Relatório de Lançamentos — Dolfin</h1>
    <p class="sub">Gerado em ${fmtDate(todayStr())} · ${linhas.length} lançamento(s)</p>
    <table>
      <thead><tr><th>Data</th><th>Nome</th><th>Tipo</th><th>Categoria</th><th>Conta/Cartão</th><th>Status</th><th class="valor">Valor</th></tr></thead>
      <tbody>
        ${linhas.map((l) => `<tr><td>${l.data}</td><td>${l.nome}</td><td>${l.tipo}</td><td>${l.categoria}</td><td>${l.conta}</td><td>${l.status}</td><td class="valor">${fmtMoney(l.valor)}</td></tr>`).join("")}
      </tbody>
      <tfoot><tr><td colspan="6">Total</td><td class="valor">${fmtMoney(total)}</td></tr></tfoot>
    </table>
  </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  const totalPaginas = resultados ? Math.max(1, Math.ceil(resultados.length / pageSize)) : 1;
  const pageClamped = Math.min(page, totalPaginas);
  const pagina = resultados ? resultados.slice((pageClamped - 1) * pageSize, (pageClamped - 1) * pageSize + pageSize) : [];
  const total = resultados ? resultados.reduce((s, l) => s + (l.tipo === "despesa" || l.tipo === "investimento" ? -l.valor : l.valor), 0) : 0;

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Relatório</h1>
          <div className="sub">Consultas avançadas e exportação</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--gray-400)", fontWeight: 500, whiteSpace: "nowrap" }}>Nome:</span>
          <input
            type="text"
            value={filtro.nome}
            onChange={(e) => setFiltro((f) => ({ ...f, nome: e.target.value }))}
            placeholder="Buscar por nome..."
            style={{ width: 150, padding: "7px 10px", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12.5 }}
          />
          <span style={{ fontSize: 12, color: "var(--gray-400)", fontWeight: 500, whiteSpace: "nowrap", marginLeft: 4 }}>Filtros:</span>

          <PeriodoPill
            dataInicio={filtro.dataInicio}
            dataFim={filtro.dataFim}
            onChange={(dataInicio, dataFim) => setFiltro((f) => ({ ...f, dataInicio, dataFim }))}
          />
          <FiltroPill label="Tipo" icon="swap" items={TIPO_OPTS} selectedIds={filtro.tipos} onChange={(v) => setFiltro((f) => ({ ...f, tipos: v }))} />
          <FiltroPill label="Status" icon="check" items={STATUS_OPTS} selectedIds={filtro.status} onChange={(v) => setFiltro((f) => ({ ...f, status: v }))} />
          <FiltroPill label="Categorias" icon="categorias" items={categoriasFlat} selectedIds={filtro.categoriasIds} onChange={(v) => setFiltro((f) => ({ ...f, categoriasIds: v }))} />
          <FiltroPill label="Tags" icon="tags" items={tagsOpts} selectedIds={filtro.tagsIds} onChange={(v) => setFiltro((f) => ({ ...f, tagsIds: v }))} />
          <FiltroPill label="Contas" icon="bank" items={contasOpts} selectedIds={filtro.contasIds} onChange={(v) => setFiltro((f) => ({ ...f, contasIds: v }))} />
          <FiltroPill label="Cartões" icon="cartoes" items={cartoesOpts} selectedIds={filtro.cartoesIds} onChange={(v) => setFiltro((f) => ({ ...f, cartoesIds: v }))} />

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <button type="button" className="btn ghost small" onClick={handleLimpar}>
              Limpar
            </button>
            <button type="button" className="btn-create" onClick={handleGerar}>
              <span className="badge-plus">
                <Icon name="report" size={14} />
              </span>{" "}
              Gerar
            </button>
          </div>
        </div>
      </div>

      {resultados && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Resultado ({resultados.length})</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn ghost small" onClick={handleExportarCsv}>
                <Icon name="detail" size={14} /> Exportar CSV
              </button>
              <button type="button" className="btn ghost small" onClick={handleExportarPdf}>
                <Icon name="report" size={14} /> Exportar PDF
              </button>
            </div>
          </div>
          <div className="table-wrap">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Categoria</th>
                    <th>Conta/Cartão</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {pagina.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-state">
                          <Icon name="empty" size={38} />
                          <div>Nenhum lançamento encontrado com esses filtros.</div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {pagina.map((l) => {
                    const catPai = l.categoriasIds[0] ? state.categorias.find((c) => c.id === l.categoriasIds[0]) : null;
                    const subcat = l.categoriasIds[1] ? state.categorias.find((c) => c.id === l.categoriasIds[1]) : null;
                    const isMultiCat = Array.isArray(l.categoriasSplits) && l.categoriasSplits.length > 1;
                    const conta = l.contaId ? state.contas.find((c) => c.id === l.contaId) : null;
                    const cartao = l.cartaoId ? state.cartoes.find((c) => c.id === l.cartaoId) : null;
                    return (
                      <tr key={l.id}>
                        <td style={{ whiteSpace: "nowrap" }}>{fmtDate(l.data)}</td>
                        <td>{l.nome || "—"}</td>
                        <td>{l.tipo === "entrada" ? "Entrada" : l.tipo === "despesa" ? "Despesa" : l.tipo === "investimento" ? "Investimento" : "Transferência"}</td>
                        <td>{isMultiCat ? "Multicategoria" : subcat ? `${catPai ? catPai.nome : ""} › ${subcat.nome}` : catPai ? catPai.nome : "—"}</td>
                        <td>
                          {cartao ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <EntityCircle cor={cartao.cor} icone={cartao.icone} /> {cartao.nome}
                            </span>
                          ) : conta ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <EntityCircle cor={conta.cor} icone={conta.icone} /> {conta.nome}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          {l.efetivado ? <span className="badge-status efetivado">Efetivado</span> : <span className="badge-status previsto">Pendente</span>}
                        </td>
                        <td style={{ textAlign: "right" }} className={l.tipo === "despesa" || l.tipo === "investimento" ? "neg" : l.tipo === "entrada" ? "pos" : ""}>
                          {l.tipo === "despesa" || l.tipo === "investimento" ? "- " : ""}
                          {fmtMoney(l.valor)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {pagina.length > 0 && (
                  <tfoot>
                    <tr style={{ fontWeight: 700, borderTop: "2px solid var(--line)" }}>
                      <td colSpan={6}>Total</td>
                      <td style={{ textAlign: "right" }} className={total < 0 ? "neg" : "pos"}>
                        {fmtMoney(total)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <div className="table-toolbar" style={{ justifyContent: "space-between", borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="mini-note" style={{ margin: 0 }}>
                  Itens por página:
                </span>
                <select value={pageSize} style={{ width: "auto", padding: "4px 8px" }} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
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
        </div>
      )}
    </div>
  );
}

function PeriodoPill({ dataInicio, dataFim, onChange }: { dataInicio: string | null; dataFim: string | null; onChange: (dataInicio: string | null, dataFim: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = (dataInicio ? 1 : 0) + (dataFim ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        className={`rel-pill${count ? " active" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <Icon name="calendar" size={13} /> Período
        {count > 0 && <span className="rel-pill-badge">{count}</span>}
        <Icon name="chevronDown" size={11} />
      </button>
      {open && (
        <div className="rel-popover" onClick={(e) => e.stopPropagation()} style={{ minWidth: 180 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label className="field" style={{ marginBottom: 0 }}>
              <span style={{ fontSize: 11.5 }}>Data início</span>
              <input type="date" value={dataInicio || ""} onChange={(e) => onChange(e.target.value || null, dataFim)} />
            </label>
            <label className="field" style={{ marginBottom: 0 }}>
              <span style={{ fontSize: 11.5 }}>Data fim</span>
              <input type="date" value={dataFim || ""} onChange={(e) => onChange(dataInicio, e.target.value || null)} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

function FiltroPill({
  label,
  icon,
  items,
  selectedIds,
  onChange,
}: {
  label: string;
  icon: IconName;
  items: { id: string; nome: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selecionados = items.filter((it) => selectedIds.includes(it.id));

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        className={`rel-pill${selectedIds.length ? " active" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <Icon name={icon} size={13} /> {label}
        {selectedIds.length > 0 && <span className="rel-pill-badge">{selectedIds.length}</span>}
        <Icon name="chevronDown" size={11} />
      </button>
      {open && (
        <div className="rel-popover" onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 220 }}>
            {selecionados.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {selecionados.map((it) => (
                  <span key={it.id} className="rel-chip">
                    {it.nome}
                    <span
                      className="tt-icon"
                      style={{ width: 9, height: 9, cursor: "pointer", opacity: 0.6 }}
                      onClick={() => toggle(it.id)}
                    >
                      <Icon name="close" size={9} />
                    </span>
                  </span>
                ))}
              </div>
            )}
            <input
              type="text"
              placeholder="Buscar..."
              autoComplete="off"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "1px solid var(--line)", borderRadius: 6, fontSize: 12 }}
            />
            <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
              {items.length === 0 && (
                <span className="mini-note" style={{ margin: 0 }}>
                  Nenhum cadastrado.
                </span>
              )}
              {items
                .filter((it) => it.nome.toLowerCase().includes(busca.toLowerCase()))
                .map((it) => (
                  <label key={it.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 400, cursor: "pointer", padding: "4px 2px" }}>
                    <input type="checkbox" checked={selectedIds.includes(it.id)} onChange={() => toggle(it.id)} style={{ width: "auto" }} />
                    <span>{it.nome}</span>
                  </label>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
