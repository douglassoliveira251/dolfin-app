import { useState } from "react";
import { Modal } from "../../components/Modal";
import { MoneyInput } from "../../components/MoneyInput";
import { showToast } from "../../components/Toast";
import { valorAtualAtivo } from "../../data/calculations/investimentos";
import { monthKey, todayStr, ultimoDiaMes } from "../../data/format";
import { persist } from "../../data/persistence";
import type { AtualizacaoAtivo } from "../../data/schema";
import { uid } from "../../data/schema";
import { useAppStore } from "../../data/store";

interface AtualizarValorModalProps {
  ativoId: string;
  atualizacaoId: string | null;
  onClose: () => void;
}

export function AtualizarValorModal({ ativoId, atualizacaoId, onClose }: AtualizarValorModalProps) {
  const editing = !!atualizacaoId;
  const state = useAppStore((s) => s.data);
  const currentMonth = useAppStore((s) => s.currentMonth);
  const saveAtualizacaoAtivo = useAppStore((s) => s.saveAtualizacaoAtivo);

  const ativo = state.investimentos.ativos.find((a) => a.id === ativoId);
  const existing = editing ? (state.investimentos.atualizacoes.find((a) => a.id === atualizacaoId) ?? null) : null;

  const [valor, setValor] = useState(existing ? existing.valorAtual : valorAtualAtivo(state, ativoId));
  const [data, setData] = useState(existing?.data ?? (monthKey(currentMonth) === monthKey(new Date()) ? todayStr() : ultimoDiaMes(currentMonth)));

  async function handleSave() {
    const atualizacao: AtualizacaoAtivo = {
      id: editing ? (atualizacaoId as string) : uid("atual"),
      ativoId,
      data,
      valorAtual: valor,
      criadoEm: existing?.criadoEm ?? new Date().toISOString(),
    };
    saveAtualizacaoAtivo(atualizacao);
    await persist();
    onClose();
    showToast("Valor atualizado.");
  }

  return (
    <Modal
      title={`${editing ? "Editar" : "Atualizar"} valor — ${ativo?.nome ?? ""}`}
      onClose={onClose}
      footer={
        <>
          <div />
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn primary" onClick={handleSave}>
              Salvar
            </button>
          </div>
        </>
      }
    >
      <div className="field-row">
        <label className="field">
          Valor atual de mercado
          <MoneyInput value={valor} onChange={setValor} />
        </label>
        <label className="field">
          Data
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </label>
      </div>
      <p className="mini-note">A diferença em relação à atualização anterior é registrada automaticamente como rendimento (positivo ou negativo) no extrato do ativo.</p>
    </Modal>
  );
}
