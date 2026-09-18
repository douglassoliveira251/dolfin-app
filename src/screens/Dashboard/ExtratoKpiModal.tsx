import { useState } from "react";
import { EntityCircle } from "../../components/EntityCircle";
import { Icon } from "../../components/icons/Icon";
import { Modal } from "../../components/Modal";
import { catFilhas, catLabel } from "../../data/calculations/categorias";
import { lancamentosDoMes } from "../../data/calculations/lancamentos";
import { fmtDate, fmtMoney, fmtMonthLabel, sortByData } from "../../data/format";
import { useAppStore } from "../../data/store";
import { LancamentoModal } from "../Lancamentos/LancamentoModal";

export function ExtratoKpiModal({ tipo, categoriaId, onClose }: { tipo: "entrada" | "despesa"; categoriaId?: string | null; onClose: () => void }) {
  const state = useAppStore((s) => s.data);
  const currentMonth = useAppStore((s) => s.currentMonth);
  const [editId, setEditId] = useState<string | null>(null);

  const cat = categoriaId ? state.categorias.find((c) => c.id === categoriaId) : null;
  const idsRelevantes = cat ? (cat.categoriaPaiId ? [cat.id] : [cat.id, ...catFilhas(state.categorias, cat.id).map((c) => c.id)]) : null;
  const itens = sortByData(
    lancamentosDoMes(state, currentMonth).filter((l) => l.tipo === tipo && (idsRelevantes ? l.categoriasIds.some((id) => idsRelevantes.includes(id)) : l.efetivado)),
    true,
  );
  const total = itens.reduce((s, l) => s + l.valor, 0);

  return (
    <>
      <Modal
        title={
          cat ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <strong>{tipo === "entrada" ? "Entradas" : "Despesas"}:</strong>
              <span style={{ fontWeight: 400, display: "flex", alignItems: "center", gap: 6 }}>
                <EntityCircle cor={cat.cor} icone={cat.icone} />
                {cat.nome} - {fmtMonthLabel(currentMonth)}
              </span>
            </span>
          ) : (
            <span style={{ fontWeight: 600 }}>{tipo === "entrada" ? "Receitas" : "Despesas"}</span>
          )
        }
        onClose={onClose}
        closeOnBackdropClick
        wide
      >
        <div style={{ textAlign: "right", fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, marginBottom: 10 }}>Total: {fmtMoney(total)}</div>
        <div className="table-scroll" style={{ maxHeight: 400, overflowY: "auto" }}>
          <table>
            <thead>
              <tr>
                <th style={{ whiteSpace: "nowrap", minWidth: 130 }}>Data/Hora</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Conta/Cartão</th>
                <th style={{ textAlign: "right" }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {itens.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <Icon name="empty" size={38} />
                      <div>Nada efetivado neste mês ainda.</div>
                    </div>
                  </td>
                </tr>
              )}
              {itens.map((l) => {
                const catPai = l.categoriasIds[0] ? state.categorias.find((c) => c.id === l.categoriasIds[0]) : null;
                const subcat = l.categoriasIds[1] ? state.categorias.find((c) => c.id === l.categoriasIds[1]) : null;
                const conta = l.contaId ? state.contas.find((c) => c.id === l.contaId) : null;
                const cartao = l.cartaoId ? state.cartoes.find((c) => c.id === l.cartaoId) : null;
                return (
                  <tr key={l.id} className="lanc-row" style={{ cursor: "pointer" }} onClick={() => setEditId(l.id)}>
                    <td style={{ whiteSpace: "nowrap", minWidth: 130 }}>
                      {fmtDate(l.data)} <span>{l.hora}</span>
                    </td>
                    <td style={{ whiteSpace: "normal", minWidth: 140 }}>{l.nome || "—"}</td>
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
