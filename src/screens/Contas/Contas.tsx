import { useState } from "react";
import { EntityCircle } from "../../components/EntityCircle";
import { useConfirm } from "../../components/ConfirmDialog";
import { Icon } from "../../components/icons/Icon";
import { showToast } from "../../components/Toast";
import { saldoContaAte, saldoPrevistoConta } from "../../data/calculations/contas";
import { ehNegativo, fmtMoneyIn, todayStr, ultimoDiaMes } from "../../data/format";
import { persist } from "../../data/persistence";
import { useAppStore } from "../../data/store";
import { ContaModal } from "./ContaModal";

export function Contas() {
  const data = useAppStore((s) => s.data);
  const currentMonth = useAppStore((s) => s.currentMonth);
  const setContaArquivada = useAppStore((s) => s.setContaArquivada);
  const deleteConta = useAppStore((s) => s.deleteConta);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mostrarArquivadas, setMostrarArquivadas] = useState(false);
  const { confirm, dialog: confirmDialog } = useConfirm();

  const contasAtivas = data.contas.filter((c) => !c.arquivada);
  const contasArquivadas = data.contas.filter((c) => c.arquivada);

  function openCreate() {
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setModalOpen(true);
  }

  async function handleRestaurar(id: string) {
    setContaArquivada(id, false);
    await persist();
    showToast("Conta restaurada.");
  }

  async function handleArquivar(id: string) {
    const ok = await confirm(
      "Arquivar esta conta? Ela sai das telas principais, mas o histórico é mantido e você pode restaurá-la depois.",
    );
    if (!ok) return;
    setContaArquivada(id, true);
    await persist();
    showToast("Conta arquivada.");
  }

  async function handleExcluir(id: string) {
    const usada = data.lancamentos.some((l) => l.contaId === id || l.contaDestinoId === id);
    const msg = usada
      ? "Esta conta possui lançamentos vinculados. Excluí-la pode afetar o histórico. Deseja continuar?"
      : "Deseja excluir esta conta?";
    const ok = await confirm(msg, { danger: true });
    if (!ok) return;
    deleteConta(id);
    await persist();
    showToast("Conta excluída.");
  }

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Contas</h1>
          <div className="sub">Saldos e movimentações das suas contas</div>
        </div>
        <button type="button" className="btn-create" onClick={openCreate}>
          <span className="badge-plus">
            <Icon name="plus" size={14} />
          </span>{" "}
          Nova conta
        </button>
      </div>

      <div className="kpi-grid cols4-max">
        {contasAtivas.length === 0 && (
          <div className="empty-state">
            <Icon name="empty" size={38} />
            <div>Nenhuma conta cadastrada. Crie sua primeira conta para começar a lançar movimentações.</div>
          </div>
        )}
        {contasAtivas.map((c) => {
          const fimMesRef = ultimoDiaMes(currentMonth);
          const hoje = todayStr();
          const saldo = saldoContaAte(data, c.id, hoje < fimMesRef ? hoje : fimMesRef, true);
          const previsto = saldoPrevistoConta(data, c.id, currentMonth);
          return (
            <div
              key={c.id}
              className={`card${c.padrao ? " ribbon-padrao" : ""}`}
              style={{ cursor: "pointer" }}
              onClick={() => showToast("Extrato em breve.")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <EntityCircle cor={c.cor} icone={c.icone} />
                  <strong>{c.nome}</strong>
                  {c.oculta && (
                    <span className="mini-note" style={{ display: "inline" }}>
                      {" "}
                      (oculta do dashboard)
                    </span>
                  )}
                  <div className="mini-note" style={{ textTransform: "capitalize" }}>
                    {c.tipo} · {c.moeda || "BRL"}
                    {!c.ativo && " · inativa"}
                  </div>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 4, flex: "none" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button type="button" className="icon-btn" title="Relatório" onClick={() => showToast("Relatório em breve.")}>
                    <Icon name="report" size={14} />
                  </button>
                  <button type="button" className="icon-btn" title="Editar" onClick={() => openEdit(c.id)}>
                    <Icon name="edit" size={14} />
                  </button>
                  <button type="button" className="icon-btn" title="Arquivar" onClick={() => handleArquivar(c.id)}>
                    <Icon name="archive" size={14} />
                  </button>
                  <button type="button" className="icon-btn danger" title="Excluir" onClick={() => handleExcluir(c.id)}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
              <div
                style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, marginTop: 12 }}
                className={ehNegativo(saldo) ? "neg" : ""}
              >
                {fmtMoneyIn(saldo, c.moeda)}
              </div>
              <div className="mini-note">
                Previsto: {fmtMoneyIn(previsto, c.moeda)} · Saldo inicial: {fmtMoneyIn(c.saldoInicial, c.moeda)}
              </div>
            </div>
          );
        })}
      </div>

      {contasArquivadas.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button type="button" className="btn ghost small" onClick={() => setMostrarArquivadas((v) => !v)}>
            {mostrarArquivadas ? "Ocultar" : "Ver"} {contasArquivadas.length} conta(s) arquivada(s)
          </button>
          {mostrarArquivadas && (
            <div className="table-wrap" style={{ marginTop: 10 }}>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Tipo</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {contasArquivadas.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <EntityCircle cor={c.cor} icone={c.icone} /> {c.nome}
                        </td>
                        <td style={{ textTransform: "capitalize" }}>{c.tipo}</td>
                        <td>
                          <button type="button" className="btn small" onClick={() => handleRestaurar(c.id)}>
                            Restaurar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {modalOpen && <ContaModal contaId={editingId} onClose={() => setModalOpen(false)} />}
      {confirmDialog}
    </div>
  );
}
