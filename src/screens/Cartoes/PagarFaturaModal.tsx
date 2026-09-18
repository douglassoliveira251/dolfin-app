import { useState } from "react";
import { Modal } from "../../components/Modal";
import { MoneyInput } from "../../components/MoneyInput";
import { showToast } from "../../components/Toast";
import { fmtMoney, monthKey, nowTimeStr, todayStr } from "../../data/format";
import { persist } from "../../data/persistence";
import type { Cartao, Lancamento } from "../../data/schema";
import { uid } from "../../data/schema";
import { useAppStore } from "../../data/store";

export function PagarFaturaModal({
  cartao,
  itensIds,
  total,
  vencimento,
  onClose,
}: {
  cartao: Cartao;
  itensIds: string[];
  total: number;
  vencimento: Date;
  onClose: () => void;
}) {
  const pagarFatura = useAppStore((s) => s.pagarFatura);
  const [valorPago, setValorPago] = useState(total);
  const [dataPagamento, setDataPagamento] = useState(todayStr());

  async function handleConfirmar() {
    const grupoPagamento = uid("pag");
    const dataPagamentoIso = dataPagamento + "T00:00";
    const restante = total - valorPago;
    let residual: Omit<Lancamento, "id"> | null = null;
    if (restante > 0.004) {
      const proxMes = new Date(vencimento.getFullYear(), vencimento.getMonth() + 1, 1);
      residual = {
        tipo: "despesa",
        nome: "Saldo residual da fatura anterior",
        valor: restante,
        data: dataPagamento,
        hora: nowTimeStr(),
        criadoEm: new Date().toISOString(),
        categoriasSplits: null,
        contaId: cartao.contaVinculada || null,
        cartaoId: cartao.id,
        competenciaFatura: monthKey(proxMes),
        contaDestinoId: null,
        categoriasIds: [],
        tagsIds: [],
        descricao: "",
        efetivado: false,
        dataEfetivacao: null,
        grupoPagamento: null,
        origemPagamentoGrupo: grupoPagamento,
        recorrencia: { ativa: false },
      };
    }
    pagarFatura(itensIds, dataPagamentoIso, grupoPagamento, residual);
    await persist();
    onClose();
    showToast(restante > 0.004 ? `Pagamento parcial registrado. Restante de ${fmtMoney(restante)} transferido para a próxima fatura.` : "Fatura paga.");
  }

  return (
    <Modal
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <strong>Pagar Fatura:</strong> <span style={{ fontWeight: 400 }}>{cartao.nome}</span>
        </span>
      }
      onClose={onClose}
      footer={
        <>
          <div />
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn primary" onClick={handleConfirmar}>
              Confirmar pagamento
            </button>
          </div>
        </>
      }
    >
      <div className="field-row">
        <label className="field">
          Valor pago
          <MoneyInput value={valorPago} onChange={setValorPago} />
        </label>
        <label className="field">
          Data do pagamento
          <input type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} />
        </label>
      </div>
      <p className="mini-note">Total da fatura: {fmtMoney(total)}. Se você pagar menos que o total, o valor restante é transferido para a próxima fatura.</p>
    </Modal>
  );
}
