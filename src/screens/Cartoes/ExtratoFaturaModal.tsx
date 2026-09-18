import { useState } from "react";
import { EntityCircle } from "../../components/EntityCircle";
import { useConfirm } from "../../components/ConfirmDialog";
import { Icon } from "../../components/icons/Icon";
import { Modal } from "../../components/Modal";
import { showToast } from "../../components/Toast";
import { catLabel } from "../../data/calculations/categorias";
import { isInMonth } from "../../data/calculations/lancamentos";
import { fmtDate, fmtMoney, fmtMonthLabel, monthKey, sortByData, todayStr } from "../../data/format";
import { persist } from "../../data/persistence";
import { useAppStore } from "../../data/store";
import { LancamentoModal } from "../Lancamentos/LancamentoModal";
import { PagarFaturaModal } from "./PagarFaturaModal";

export function ExtratoFaturaModal({ cartaoId, mesInicial, onClose }: { cartaoId: string; mesInicial?: string | null; onClose: () => void }) {
  const state = useAppStore((s) => s.data);
  const reabrirFatura = useAppStore((s) => s.reabrirFatura);
  const [mesFatura, setMesFatura] = useState(() => (mesInicial ? new Date(mesInicial + "-01T00:00:00") : new Date()));
  const [editId, setEditId] = useState<string | null>(null);
  const [pagarOpen, setPagarOpen] = useState(false);
  const { confirm, dialog: confirmDialog } = useConfirm();

  const cartao = state.cartoes.find((c) => c.id === cartaoId);
  if (!cartao) return null;

  const mesKeyAtual = monthKey(mesFatura);
  const itens = sortByData(
    state.lancamentos.filter((l) => l.cartaoId === cartao.id && (l.competenciaFatura ? l.competenciaFatura === mesKeyAtual : isInMonth(l.data, mesFatura))),
    true,
  );
  const total = itens.reduce((s, l) => s + (l.tipo === "despesa" ? l.valor : -l.valor), 0);
  const vencimento = new Date(mesFatura.getFullYear(), mesFatura.getMonth(), cartao.diaVencimento);
  const fechamento = new Date(mesFatura.getFullYear(), mesFatura.getMonth(), cartao.diaFechamento);
  const status = itens.length && itens.every((l) => l.efetivado) ? "Paga" : todayStr() < monthKey(mesFatura) + "-" + String(cartao.diaFechamento).padStart(2, "0") ? "Aberta" : "Fechada";
  const statusClass = status === "Paga" ? "efetivado" : status === "Aberta" ? "aberta-azul" : "previsto";

  async function handleReabrir() {
    const ok = await confirm("Reabrir esta fatura e desfazer o pagamento (total ou parcial)? Todas as despesas voltarão para o status Previsto.", { danger: true });
    if (!ok) return;
    reabrirFatura(itens.map((l) => l.id));
    await persist(true);
    showToast("Fatura reaberta e pagamento desfeito.");
  }

  return (
    <>
      <Modal
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 8, lineHeight: 1 }}>
            <strong>Fatura:</strong>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontWeight: 400, lineHeight: 1 }}>
              <EntityCircle cor={cartao.cor} icone={cartao.icone} />
              {cartao.nome}
            </span>
            <span className={`badge-status ${statusClass}`} style={{ flex: "none" }}>
              {status === "Paga" ? "Fatura Paga" : status}
            </span>
          </span>
        }
        onClose={onClose}
        closeOnBackdropClick
        wide
        footer={
          (itens.length && status !== "Paga") || status === "Paga" ? (
            <>
              <div />
              <div style={{ display: "flex", gap: 10 }}>
                {itens.length > 0 && status !== "Paga" && (
                  <button type="button" className="btn primary small" onClick={() => setPagarOpen(true)}>
                    <Icon name="check" size={13} /> Pagar Fatura
                  </button>
                )}
                {status === "Paga" && (
                  <button type="button" className="btn danger small" onClick={handleReabrir}>
                    <Icon name="repeat" size={13} /> Reabrir a fatura
                  </button>
                )}
              </div>
            </>
          ) : undefined
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 0 }}>
          <div style={{ fontSize: 11.5, lineHeight: 1.6, color: "var(--ink-soft)" }}>
            <div>
              Data de Fechamento: <strong style={{ color: "var(--ink)" }}>{fmtDate(fechamento.toISOString().slice(0, 10))}</strong>
            </div>
            <div>
              Vencimento da fatura: <strong style={{ color: "var(--ink)" }}>{fmtDate(vencimento.toISOString().slice(0, 10))}</strong>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, justifySelf: "center" }}>
            <button type="button" className="icon-btn" onClick={() => setMesFatura(new Date(mesFatura.getFullYear(), mesFatura.getMonth() - 1, 1))}>
              <Icon name="chevronLeft" size={14} />
            </button>
            <strong style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{fmtMonthLabel(mesFatura)}</strong>
            <button type="button" className="icon-btn" onClick={() => setMesFatura(new Date(mesFatura.getFullYear(), mesFatura.getMonth() + 1, 1))}>
              <Icon name="detail" size={14} />
            </button>
          </div>
          <div style={{ textAlign: "right", justifySelf: "end" }}>
            <div style={{ fontSize: 11, fontWeight: 400, color: "var(--ink-soft)" }}>Total da fatura:</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600 }}>{fmtMoney(total)}</div>
          </div>
        </div>
        <div className="table-scroll" style={{ maxHeight: 360, overflowY: "auto", marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
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
                      <div>Nenhum lançamento nesta fatura para o mês selecionado.</div>
                    </div>
                  </td>
                </tr>
              )}
              {itens.map((l) => {
                const catPai = l.categoriasIds[0] ? state.categorias.find((c) => c.id === l.categoriasIds[0]) : null;
                const subcat = l.categoriasIds[1] ? state.categorias.find((c) => c.id === l.categoriasIds[1]) : null;
                const isMultiCat = Array.isArray(l.categoriasSplits) && l.categoriasSplits.length > 1;
                return (
                  <tr key={l.id} className={`${l.efetivado ? "cartao-pago" : "cartao-pendente"} lanc-row`} style={{ cursor: "pointer" }} onClick={() => setEditId(l.id)}>
                    <td>
                      {fmtDate(l.data)} <span>{l.hora}</span>
                    </td>
                    <td>{l.nome || "—"}</td>
                    <td>
                      {isMultiCat ? (
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
                    <td style={{ textAlign: "right" }} className={l.tipo === "despesa" ? "neg" : "pos"}>
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
      {pagarOpen && (
        <PagarFaturaModal
          cartao={cartao}
          itensIds={itens.map((l) => l.id)}
          total={total}
          vencimento={vencimento}
          onClose={() => setPagarOpen(false)}
        />
      )}
      {confirmDialog}
    </>
  );
}
