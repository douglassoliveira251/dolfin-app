import { useState } from "react";
import { EntityCircle } from "../../components/EntityCircle";
import { Icon } from "../../components/icons/Icon";
import { Modal } from "../../components/Modal";
import { catLabel } from "../../data/calculations/categorias";
import { fmtDate, fmtMoney, fmtMonthLabel } from "../../data/format";
import type { Lancamento } from "../../data/schema";
import { useAppStore } from "../../data/store";
import { LancamentoModal } from "../Lancamentos/LancamentoModal";

export function ExtratoKpiModalPrevisto({ tipo, itens, onClose }: { tipo: "entrada" | "despesa"; itens: Lancamento[]; onClose: () => void }) {
  const state = useAppStore((s) => s.data);
  const currentMonth = useAppStore((s) => s.currentMonth);
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <>
      <Modal title={`${tipo === "entrada" ? "Receitas" : "Despesas"} previstas — ${fmtMonthLabel(currentMonth)}`} onClose={onClose} closeOnBackdropClick wide>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Vencimento</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th style={{ textAlign: "right" }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {itens.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">
                      <Icon name="empty" size={38} />
                      <div>Nenhum lançamento previsto.</div>
                    </div>
                  </td>
                </tr>
              )}
              {itens.map((l) => {
                const catPai = l.categoriasIds[0] ? state.categorias.find((c) => c.id === l.categoriasIds[0]) : null;
                const subcat = l.categoriasIds[1] ? state.categorias.find((c) => c.id === l.categoriasIds[1]) : null;
                return (
                  <tr key={l.id} className="lanc-row" style={{ cursor: "pointer" }} onClick={() => setEditId(l.id)}>
                    <td>{fmtDate(l.data)}</td>
                    <td>{l.nome || "—"}</td>
                    <td>
                      {subcat ? (
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
                    <td style={{ textAlign: "right" }} className={tipo === "entrada" ? "pos" : "neg"}>
                      {fmtMoney(l.valor)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Modal>
      {editId && <LancamentoModal lancamentoId={editId} onClose={() => setEditId(null)} />}
    </>
  );
}
