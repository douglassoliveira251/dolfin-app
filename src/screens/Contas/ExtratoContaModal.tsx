import { useState } from "react";
import { EntityCircle } from "../../components/EntityCircle";
import { Icon } from "../../components/icons/Icon";
import { Modal } from "../../components/Modal";
import { signedValueForConta } from "../../data/calculations/contas";
import { isInMonthCompetencia } from "../../data/calculations/lancamentos";
import { fmtDate, fmtMoneyIn, fmtMonthLabel, sortByData } from "../../data/format";
import { persist } from "../../data/persistence";
import { useAppStore } from "../../data/store";
import { LancamentoModal } from "../Lancamentos/LancamentoModal";

const TIPO_LABEL: Record<string, string> = { entrada: "Entrada", despesa: "Despesa", transferencia: "Transferência" };

export function ExtratoContaModal({ contaId, onClose }: { contaId: string; onClose: () => void }) {
  const state = useAppStore((s) => s.data);
  const currentMonth = useAppStore((s) => s.currentMonth);
  const toggleEfetivadoLancamento = useAppStore((s) => s.toggleEfetivadoLancamento);
  const [mesExtrato, setMesExtrato] = useState(() => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
  const [editId, setEditId] = useState<string | null>(null);

  const conta = state.contas.find((c) => c.id === contaId);
  if (!conta) return null;

  const itens = sortByData(
    state.lancamentos.filter((l) => (l.contaId === contaId || l.contaDestinoId === contaId) && isInMonthCompetencia(l, mesExtrato)),
    state.configuracoes.ordenacaoDecrescente,
  );

  async function handleToggleEfetivar(id: string, cartaoId: string | null, e: React.MouseEvent) {
    e.stopPropagation();
    if (cartaoId) return;
    toggleEfetivadoLancamento(id);
    await persist();
  }

  return (
    <>
      <Modal
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <strong>Extrato:</strong>
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontWeight: 400 }}>
              <EntityCircle cor={conta.cor} icone={conta.icone} />
              {conta.nome}
            </span>
          </span>
        }
        onClose={onClose}
        closeOnBackdropClick
        wide
        footer={
          <>
            <div />
            <button type="button" className="btn ghost" onClick={onClose}>
              Fechar
            </button>
          </>
        }
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 14 }}>
          <button type="button" className="icon-btn" onClick={() => setMesExtrato(new Date(mesExtrato.getFullYear(), mesExtrato.getMonth() - 1, 1))}>
            <Icon name="chevronLeft" size={14} />
          </button>
          <strong style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{fmtMonthLabel(mesExtrato)}</strong>
          <button type="button" className="icon-btn" onClick={() => setMesExtrato(new Date(mesExtrato.getFullYear(), mesExtrato.getMonth() + 1, 1))}>
            <Icon name="detail" size={14} />
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Data/Hora</th>
                <th>Tipo</th>
                <th>Nome</th>
                <th style={{ textAlign: "right" }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {itens.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <Icon name="empty" size={38} />
                      <div>Nenhum lançamento nesta conta neste mês.</div>
                    </div>
                  </td>
                </tr>
              )}
              {itens.map((l) => {
                const valorConta = signedValueForConta(l, contaId);
                const outra = l.tipo === "transferencia" ? state.contas.find((c) => c.id === (l.contaId === contaId ? l.contaDestinoId : l.contaId)) : null;
                const cartaoLanc = l.cartaoId ? state.cartoes.find((c) => c.id === l.cartaoId) : null;
                return (
                  <tr key={l.id} className={`lanc-row${cartaoLanc ? (l.efetivado ? " cartao-pago" : " cartao-pendente") : ""}`} style={{ cursor: "pointer" }} onClick={() => setEditId(l.id)}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <span
                        className={`efetivar-dot${l.efetivado ? " on" : ""}${l.cartaoId ? " disabled" : ""}`}
                        title={l.cartaoId ? "Controlado pelo pagamento da fatura" : "Marcar como efetivado"}
                        onClick={(e) => handleToggleEfetivar(l.id, l.cartaoId, e)}
                      >
                        <Icon name="check" size={11} />
                      </span>
                    </td>
                    <td>
                      {fmtDate(l.data)} <span>{l.hora}</span>
                    </td>
                    <td>
                      <span className={`chip ${l.tipo}`}>{TIPO_LABEL[l.tipo] || l.tipo}</span>
                    </td>
                    <td>
                      {l.nome || "—"}
                      {cartaoLanc && (
                        <span className="mini-note" style={{ display: "inline" }}>
                          {" "}
                          ({cartaoLanc.nome})
                        </span>
                      )}
                      {outra && (
                        <span className="mini-note">
                          {" "}
                          ({l.contaId === contaId ? "para" : "de"} {outra.nome})
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }} className={valorConta < 0 ? "neg" : "pos"}>
                      {valorConta < 0 ? "-" : "+"}
                      {fmtMoneyIn(Math.abs(valorConta), conta.moeda)}
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
