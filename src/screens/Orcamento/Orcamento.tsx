import { useState } from "react";
import { useConfirm } from "../../components/ConfirmDialog";
import { EntityCircle } from "../../components/EntityCircle";
import { Icon } from "../../components/icons/Icon";
import { useScopeChoice } from "../../components/ScopeChoiceModal";
import { showToast } from "../../components/Toast";
import { catLabel } from "../../data/calculations/categorias";
import { realizadoOrcamento, valorPlanejadoEfetivo } from "../../data/calculations/orcamento";
import { fmtMoney, fmtMonthLabel, monthKey } from "../../data/format";
import { persist } from "../../data/persistence";
import type { Orcamento, TipoCategoria } from "../../data/schema";
import { useAppStore } from "../../data/store";
import { OrcamentoModal } from "./OrcamentoModal";

const TABS: { tipo: TipoCategoria; label: string; icon: "kpiArrowDown" | "kpiArrowUp" | "kpiTrend" }[] = [
  { tipo: "entrada", label: "Receitas", icon: "kpiArrowDown" },
  { tipo: "despesa", label: "Despesas", icon: "kpiArrowUp" },
  { tipo: "investimento", label: "Investimentos", icon: "kpiTrend" },
];

export function Orcamento() {
  const state = useAppStore((s) => s.data);
  const currentMonth = useAppStore((s) => s.currentMonth);
  const deleteOrcamento = useAppStore((s) => s.deleteOrcamento);
  const saveOrcamento = useAppStore((s) => s.saveOrcamento);

  const [orcTabTipo, setOrcTabTipo] = useState<TipoCategoria>("entrada");
  const [modalState, setModalState] = useState<{ id: string | null; tipoOverride?: TipoCategoria } | null>(null);
  const { confirm, dialog: confirmDialog } = useConfirm();
  const { askScope, dialog: scopeDialog } = useScopeChoice();

  const mesKey = monthKey(currentMonth);
  const orcamentosDoMes = state.orcamentos
    .filter((o) => {
      const cat = o.categoriaId ? state.categorias.find((c) => c.id === o.categoriaId) : null;
      if (!cat || cat.tipo !== orcTabTipo) return false;
      const dentroDoPeriodo =
        o.mesReferencia === mesKey || (!o.mesReferencia && (!o.validoApartirDe || mesKey >= monthKey(new Date(o.validoApartirDe + "T00:00:00"))));
      if (!dentroDoPeriodo) return false;
      return valorPlanejadoEfetivo(o, currentMonth) > 0;
    })
    .sort((a, b) => {
      const catA = a.categoriaId ? state.categorias.find((c) => c.id === a.categoriaId) : null;
      const catB = b.categoriaId ? state.categorias.find((c) => c.id === b.categoriaId) : null;
      return (catA?.nome ?? "").localeCompare(catB?.nome ?? "", "pt-BR");
    });

  async function handleExcluirComEscopo(o: Orcamento): Promise<boolean> {
    const escolha = await askScope(
      "Excluir orçamento",
      [
        { value: "mes", label: `Somente o mês selecionado (${fmtMonthLabel(currentMonth)})` },
        { value: "diante", label: "Este e todos os meses seguintes" },
        { value: "tudo", label: "Todos os meses (remover por completo)" },
      ],
      "Excluir este orçamento:",
    );
    if (!escolha) return false;
    const ok = await confirm("Confirma a exclusão? Essa ação não pode ser desfeita.", { danger: true });
    if (!ok) return false;
    const mesKeyAtual = monthKey(currentMonth);
    if (escolha === "tudo") {
      deleteOrcamento(o.id);
    } else if (escolha === "mes") {
      const valorAntes = valorPlanejadoEfetivo(o, currentMonth);
      const proxMesKey = monthKey(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
      saveOrcamento({ ...o, historicoValores: [...o.historicoValores, { desde: mesKeyAtual, valor: 0 }, { desde: proxMesKey, valor: valorAntes }] });
    } else {
      saveOrcamento({ ...o, historicoValores: [...o.historicoValores, { desde: mesKeyAtual, valor: 0 }] });
    }
    await persist();
    showToast("Orçamento excluído.");
    return true;
  }

  async function handleDeleteRow(o: Orcamento, e: React.MouseEvent) {
    e.stopPropagation();
    await handleExcluirComEscopo(o);
  }

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Orçamento</h1>
          <div className="sub">Planejamento por categoria</div>
        </div>
      </div>

      <div className="tabs-card" style={{ justifyContent: "space-between", alignItems: "center", background: "none", border: "none", padding: 0 }}>
        <div style={{ display: "flex", gap: 6, background: "var(--surface-2)", borderRadius: 12, padding: 4 }}>
          {TABS.map((t) => {
            const cor = t.tipo === "entrada" ? "var(--positive)" : t.tipo === "despesa" ? "var(--negative)" : "var(--type-investimento)";
            const ativo = orcTabTipo === t.tipo;
            return (
              <button
                key={t.tipo}
                type="button"
                style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", border: "none", borderRadius: 9,
                  fontWeight: 600, fontSize: 13, cursor: "pointer", transition: ".15s",
                  background: ativo ? cor : "transparent", color: ativo ? "#fff" : "var(--ink-soft)",
                }}
                onClick={() => setOrcTabTipo(t.tipo)}
              >
                <Icon name={t.icon} size={15} /> {t.label}
              </button>
            );
          })}
        </div>
        <button type="button" className="btn-create" style={{ marginRight: 2 }} onClick={() => setModalState({ id: null, tipoOverride: orcTabTipo })}>
          <span className="badge-plus">
            <Icon name="plus" size={14} />
          </span>{" "}
          Orçamento
        </button>
      </div>

      <div className="table-wrap">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Planejado</th>
                <th>Realizado</th>
                <th style={{ width: 220 }}>Progresso</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orcamentosDoMes.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <Icon name="empty" size={38} />
                      <div>Nenhum orçamento definido para este mês.</div>
                    </div>
                  </td>
                </tr>
              )}
              {orcamentosDoMes.map((o) => {
                const cat = o.categoriaId ? state.categorias.find((c) => c.id === o.categoriaId) : null;
                const realizado = realizadoOrcamento(state, o.categoriaId, currentMonth);
                const valorPlanejadoMes = valorPlanejadoEfetivo(o, currentMonth);
                const pct = valorPlanejadoMes > 0 ? Math.min(150, (realizado / valorPlanejadoMes) * 100) : 0;
                const over = realizado > valorPlanejadoMes;
                const destacarNegativo = over && cat && cat.tipo !== "entrada";
                const corBarra = cat && cat.tipo === "entrada" ? "var(--type-entrada)" : cat && cat.tipo === "investimento" ? "var(--type-investimento)" : "var(--type-despesa)";
                return (
                  <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => setModalState({ id: o.id })}>
                    <td>
                      {cat ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                          <EntityCircle cor={cat.cor} icone={cat.icone} />
                          {catLabel(state.categorias, o.categoriaId)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{fmtMoney(valorPlanejadoMes)}</td>
                    <td className={destacarNegativo ? "neg" : ""}>{fmtMoney(realizado)}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="progress-mini" style={{ flex: 1 }}>
                          <div style={{ width: `${Math.min(100, pct)}%`, background: corBarra }} />
                        </div>
                        <span className="mini-note" style={{ whiteSpace: "nowrap" }}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="icon-btn danger" title="Excluir" onClick={(e) => handleDeleteRow(o, e)}>
                        <Icon name="trash" size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalState && (
        <OrcamentoModal
          orcamentoId={modalState.id}
          tipoOverride={modalState.tipoOverride}
          onClose={() => setModalState(null)}
          onDelete={handleExcluirComEscopo}
        />
      )}
      {confirmDialog}
      {scopeDialog}
    </div>
  );
}
