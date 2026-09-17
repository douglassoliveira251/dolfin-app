import { useState } from "react";
import { useConfirm } from "../../components/ConfirmDialog";
import { EntityCircle } from "../../components/EntityCircle";
import { Icon } from "../../components/icons/Icon";
import { showToast } from "../../components/Toast";
import { progressoMeta } from "../../data/calculations/metas";
import { fmtMoney, todayStr } from "../../data/format";
import { persist } from "../../data/persistence";
import { useAppStore } from "../../data/store";
import { MetaDetalheModal } from "./MetaDetalheModal";
import { MetaModal } from "./MetaModal";

export function Metas() {
  const metas = useAppStore((s) => s.data.metas);
  const deleteMeta = useAppStore((s) => s.deleteMeta);
  const { confirm, dialog: confirmDialog } = useConfirm();

  const [editModalId, setEditModalId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [detalheId, setDetalheId] = useState<string | null>(null);

  const metasOrdenadas = [...metas].sort(
    (a, b) => Number(a.concluida) - Number(b.concluida) || (a.dataAlvo || "9999").localeCompare(b.dataAlvo || "9999"),
  );

  async function handleExcluir(id: string) {
    const ok = await confirm("Excluir esta meta? Essa ação não pode ser desfeita.", { danger: true });
    if (!ok) return;
    deleteMeta(id);
    await persist();
    showToast("Meta excluída.");
  }

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Metas</h1>
          <div className="sub">Objetivos financeiros em andamento</div>
        </div>
        <button type="button" className="btn-create" onClick={() => setCreateOpen(true)}>
          <span className="badge-plus">
            <Icon name="plus" size={14} />
          </span>{" "}
          Nova meta
        </button>
      </div>

      {metasOrdenadas.length === 0 ? (
        <div className="empty-state">
          <Icon name="empty" size={38} />
          <div>Nenhuma meta criada ainda. Que tal começar uma?</div>
        </div>
      ) : (
        <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {metasOrdenadas.map((m) => {
            const { pct, pctReal, concluida } = progressoMeta(m);
            const hoje = todayStr();
            const diasRestantes = m.dataAlvo ? Math.round((new Date(m.dataAlvo).getTime() - new Date(hoje).getTime()) / 86400000) : null;
            return (
              <div key={m.id} className="card" style={{ opacity: concluida ? 0.75 : 1, cursor: "pointer" }} onClick={() => setDetalheId(m.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <EntityCircle cor={m.cor} icone={m.icone} size={34} iconSize={17} />
                  <div style={{ flex: 1 }}>
                    <strong>{m.nome}</strong>
                    <p className="mini-note" style={{ margin: "2px 0 0" }}>
                      {concluida
                        ? "🎉 Concluída"
                        : m.dataAlvo
                          ? diasRestantes !== null && diasRestantes >= 0
                            ? `${diasRestantes} dia(s) restantes`
                            : `${Math.abs(diasRestantes ?? 0)} dia(s) atrasada`
                          : "Sem prazo definido"}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 2 }} onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="icon-btn" title="Editar" onClick={() => setEditModalId(m.id)}>
                      <Icon name="edit" size={14} />
                    </button>
                    <button type="button" className="icon-btn danger" title="Excluir" onClick={() => handleExcluir(m.id)}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
                <div className="progress-mini" style={{ marginBottom: 6 }}>
                  <div style={{ width: `${pct}%`, background: concluida ? "var(--positive)" : m.cor }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="mini-note" style={{ margin: 0 }}>
                    {fmtMoney(m.valorAtual)} de {fmtMoney(m.valorAlvo)}
                  </span>
                  <span style={{ fontWeight: 700, fontFamily: "var(--font-display)" }}>{pctReal.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {createOpen && <MetaModal metaId={null} onClose={() => setCreateOpen(false)} />}
      {editModalId && <MetaModal metaId={editModalId} onClose={() => setEditModalId(null)} />}
      {detalheId && <MetaDetalheModal metaId={detalheId} onClose={() => setDetalheId(null)} />}
      {confirmDialog}
    </div>
  );
}
