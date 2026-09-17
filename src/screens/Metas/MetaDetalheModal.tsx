import { useState } from "react";
import { EntityCircle } from "../../components/EntityCircle";
import { Icon } from "../../components/icons/Icon";
import { Modal } from "../../components/Modal";
import { MoneyInput } from "../../components/MoneyInput";
import { showToast } from "../../components/Toast";
import { progressoMeta } from "../../data/calculations/metas";
import { fmtDate, fmtMoney, sortByData } from "../../data/format";
import { persist } from "../../data/persistence";
import type { TipoMovimentoMeta } from "../../data/schema";
import { useAppStore } from "../../data/store";

interface MetaDetalheModalProps {
  metaId: string;
  onClose: () => void;
}

export function MetaDetalheModal({ metaId, onClose }: MetaDetalheModalProps) {
  const meta = useAppStore((s) => s.data.metas.find((m) => m.id === metaId));
  const ordenacaoDecrescente = useAppStore((s) => s.data.configuracoes.ordenacaoDecrescente);
  const setMetaConcluida = useAppStore((s) => s.setMetaConcluida);
  const addMetaMovimento = useAppStore((s) => s.addMetaMovimento);
  const deleteMetaMovimento = useAppStore((s) => s.deleteMetaMovimento);

  const [tipoMov, setTipoMov] = useState<TipoMovimentoMeta>("entrada");
  const [valorMov, setValorMov] = useState(0);
  const [dataMov, setDataMov] = useState(() => new Date().toISOString().slice(0, 10));

  if (!meta) return null;

  const { pct, pctReal, concluida } = progressoMeta(meta);
  const movimentos = sortByData(meta.movimentos, ordenacaoDecrescente);

  async function handleToggleConcluida() {
    if (!meta) return;
    setMetaConcluida(meta.id, !meta.concluida);
    await persist();
  }

  async function handleAddMov() {
    if (!valorMov) {
      showToast("Informe um valor maior que zero.");
      return;
    }
    addMetaMovimento(metaId, { data: dataMov || new Date().toISOString().slice(0, 10), valor: valorMov, tipo: tipoMov });
    await persist();
    setValorMov(0);
    setDataMov(new Date().toISOString().slice(0, 10));
    showToast("Progresso atualizado.");
  }

  async function handleDeleteMov(movId: string) {
    deleteMetaMovimento(metaId, movId);
    await persist();
    showToast("Lançamento removido.");
  }

  return (
    <Modal
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <EntityCircle cor={meta.cor} icone={meta.icone} />
          {meta.nome}
          {concluida ? " 🎉" : ""}
        </span>
      }
      onClose={onClose}
      footer={
        <>
          <div />
          <button type="button" className="btn ghost" onClick={onClose}>
            Fechar
          </button>
        </>
      }
    >
      {meta.descricao && (
        <p className="mini-note" style={{ margin: "-4px 0 14px" }}>
          {meta.descricao}
        </p>
      )}
      <div className="progress-mini" style={{ marginBottom: 8, height: 10 }}>
        <div style={{ width: `${pct}%`, background: concluida ? "var(--positive)" : meta.cor }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
            {fmtMoney(meta.valorAtual)}
          </span>
          <span className="mini-note" style={{ margin: 0 }}>
            {" "}
            de {fmtMoney(meta.valorAlvo)}
          </span>
        </span>
        <span style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 18 }}>{pctReal.toFixed(0)}%</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontSize: 13, whiteSpace: "nowrap" }}>Meta alcançada</h4>
        <div className={`switch${concluida ? " on" : ""}`} onClick={handleToggleConcluida}>
          <div className="knob" />
        </div>
      </div>

      <div className="field-row" style={{ gridTemplateColumns: "2.4fr 0.9fr auto", alignItems: "flex-end", gap: 12, marginBottom: 16 }}>
        <label className="field" style={{ marginBottom: 0 }}>
          <span>Valor</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <MoneyInput value={valorMov} onChange={setValorMov} />
            </div>
            <div className="mov-tipo-toggle">
              <button
                type="button"
                className={`mov-tipo-opt entrada${tipoMov === "entrada" ? " active" : ""}`}
                title="Entrada"
                onClick={() => setTipoMov("entrada")}
              >
                <Icon name="arrowUp" size={16} /> Entrada
              </button>
              <button
                type="button"
                className={`mov-tipo-opt saida${tipoMov === "saida" ? " active" : ""}`}
                title="Saída"
                onClick={() => setTipoMov("saida")}
              >
                <Icon name="arrowDown" size={16} /> Saída
              </button>
            </div>
          </div>
        </label>
        <label className="field" style={{ marginBottom: 0 }}>
          Data
          <input type="date" value={dataMov} onChange={(e) => setDataMov(e.target.value)} />
        </label>
        <button type="button" className="btn primary small" style={{ justifyContent: "center", whiteSpace: "nowrap" }} onClick={handleAddMov}>
          Adicionar
        </button>
      </div>

      <h4 style={{ margin: "0 0 8px", fontSize: 12.5, textTransform: "none", letterSpacing: "normal", color: "var(--gray-700)", fontWeight: 600 }}>
        Lançamentos
      </h4>
      <div className="table-scroll" style={{ maxHeight: 220, overflowY: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th style={{ textAlign: "right" }}>Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {movimentos.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state">
                    <Icon name="empty" size={38} />
                    <div>Nenhum lançamento nesta meta ainda.</div>
                  </div>
                </td>
              </tr>
            )}
            {movimentos.map((mv) => (
              <tr key={mv.id}>
                <td>{fmtDate(mv.data)}</td>
                <td>
                  <span className={`chip ${mv.tipo === "entrada" ? "entrada" : "despesa"}`}>{mv.tipo === "entrada" ? "Entrada" : "Saída"}</span>
                </td>
                <td style={{ textAlign: "right" }} className={mv.tipo === "entrada" ? "pos" : "neg"}>
                  {mv.tipo === "entrada" ? "+" : "-"}
                  {fmtMoney(mv.valor)}
                </td>
                <td>
                  <button type="button" className="icon-btn danger" title="Excluir" onClick={() => handleDeleteMov(mv.id)}>
                    <Icon name="trash" size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
