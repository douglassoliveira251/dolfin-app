import { useState } from "react";
import { CustomSelect, type CustomSelectOption } from "../../components/CustomSelect";
import { EntityCircle } from "../../components/EntityCircle";
import { Modal } from "../../components/Modal";
import { MoneyInput } from "../../components/MoneyInput";
import { showToast } from "../../components/Toast";
import { todayStr } from "../../data/format";
import { persist } from "../../data/persistence";
import { useAppStore } from "../../data/store";

interface TransferenciaAtivoModalProps {
  ativoOrigemId: string;
  onClose: () => void;
}

export function TransferenciaAtivoModal({ ativoOrigemId, onClose }: TransferenciaAtivoModalProps) {
  const ativos = useAppStore((s) => s.data.investimentos.ativos).filter((a) => a.ativo);
  const contas = useAppStore((s) => s.data.contas);
  const registrarTransferenciaAtivo = useAppStore((s) => s.registrarTransferenciaAtivo);

  const [origemId, setOrigemId] = useState<string | null>(ativoOrigemId);
  const [destinoId, setDestinoId] = useState<string | null>(null);
  const [valor, setValor] = useState(0);
  const [data, setData] = useState(todayStr());

  const ativoOptions: CustomSelectOption[] = ativos.map((a) => {
    const conta = a.contaId ? contas.find((c) => c.id === a.contaId) : null;
    return {
      id: a.id,
      label: conta ? `${conta.nome} - ${a.nome}` : a.nome,
      color: conta ? conta.cor : "#9C978A",
      icon: conta ? <EntityCircle cor={conta.cor} icone={conta.icone} /> : <EntityCircle cor="#9C978A" icone="investment" />,
    };
  });

  async function handleSave() {
    if (!origemId || !destinoId) {
      showToast("Selecione os dois ativos.");
      return;
    }
    if (origemId === destinoId) {
      showToast("Selecione ativos diferentes.");
      return;
    }
    if (!valor) {
      showToast("Informe um valor maior que zero.");
      return;
    }
    registrarTransferenciaAtivo(origemId, destinoId, valor, data);
    await persist();
    onClose();
    showToast("Transferência entre ativos registrada.");
  }

  return (
    <Modal
      title="Transferir entre ativos"
      onClose={onClose}
      footer={
        <>
          <div />
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn primary" onClick={handleSave}>
              Transferir
            </button>
          </div>
        </>
      }
    >
      <div className="field-row">
        <label className="field">
          Origem
          <CustomSelect options={ativoOptions} value={origemId} onChange={setOrigemId} placeholder="Selecionar ativo" />
        </label>
        <label className="field">
          Destino
          <CustomSelect options={ativoOptions} value={destinoId} onChange={setDestinoId} placeholder="Selecionar ativo" />
        </label>
      </div>
      <div className="field-row">
        <label className="field">
          Valor
          <MoneyInput value={valor} onChange={setValor} />
        </label>
        <label className="field">
          Data
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </label>
      </div>
      <p className="mini-note">
        Cria um resgate no ativo de origem e um aporte de mesmo valor no ativo de destino. Aparece como transferência no extrato e não afeta o
        total aportado nem o rendimento de nenhum dos dois ativos — só o valor atual muda. Não afeta o saldo de nenhuma conta bancária.
      </p>
    </Modal>
  );
}
