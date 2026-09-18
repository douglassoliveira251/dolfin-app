import { useState } from "react";
import { CustomSelect, type CustomSelectOption } from "../../components/CustomSelect";
import { EntityCircle } from "../../components/EntityCircle";
import { Modal } from "../../components/Modal";
import { MoneyInput } from "../../components/MoneyInput";
import { Switch } from "../../components/Switch";
import { TagsInput } from "../../components/TagsInput";
import { showToast } from "../../components/Toast";
import { monthKey, todayStr, ultimoDiaMes } from "../../data/format";
import { persist } from "../../data/persistence";
import type { Aporte, TipoAporte } from "../../data/schema";
import { uid } from "../../data/schema";
import { useAppStore } from "../../data/store";

interface AporteModalProps {
  ativoId: string;
  tipo: TipoAporte;
  aporteId: string | null;
  onClose: () => void;
}

export function AporteModal({ ativoId, tipo: tipoProp, aporteId, onClose }: AporteModalProps) {
  const editing = !!aporteId;
  const ativos = useAppStore((s) => s.data.investimentos.ativos);
  const contas = useAppStore((s) => s.data.contas);
  const aportes = useAppStore((s) => s.data.investimentos.aportes);
  const currentMonth = useAppStore((s) => s.currentMonth);
  const saveAporte = useAppStore((s) => s.saveAporte);

  const existing = editing ? (aportes.find((a) => a.id === aporteId) ?? null) : null;
  const tipo = existing?.tipo ?? tipoProp;
  const ativo = ativos.find((a) => a.id === (existing?.ativoId ?? ativoId));
  const contaDoAtivo = ativo?.contaId ? contas.find((c) => c.id === ativo.contaId) : null;

  const [valor, setValor] = useState(existing?.valor ?? 0);
  const [data, setData] = useState(existing?.data ?? (monthKey(currentMonth) === monthKey(new Date()) ? todayStr() : ultimoDiaMes(currentMonth)));
  const [contaId, setContaId] = useState<string | null>(existing?.contaId ?? null);
  const [tagsIds, setTagsIds] = useState<string[]>(existing?.tagsIds ?? []);
  const [efetivado, setEfetivado] = useState(existing?.efetivado ?? true);

  const contaOptions: CustomSelectOption[] = contas
    .filter((c) => !c.arquivada)
    .map((c) => ({ id: c.id, label: c.nome, color: c.cor, icon: <EntityCircle cor={c.cor} icone={c.icone} /> }));

  async function handleSave() {
    if (!valor) {
      showToast("Informe um valor maior que zero.");
      return;
    }
    const aporte: Aporte = {
      id: editing ? (aporteId as string) : uid("aporte"),
      ativoId: existing?.ativoId ?? ativoId,
      data,
      valor,
      tipo,
      categoriaId: existing?.categoriaId ?? null,
      tagsIds,
      contaId,
      transferenciaGrupoId: existing?.transferenciaGrupoId ?? null,
      lancamentoVinculadoId: existing?.lancamentoVinculadoId ?? null,
      criadoEm: existing?.criadoEm ?? new Date().toISOString(),
      efetivado,
    };
    saveAporte(aporte);
    await persist();
    onClose();
    showToast(tipo === "aporte" ? "Aporte registrado." : "Resgate registrado.");
  }

  return (
    <Modal
      title={`${editing ? "Editar" : "Novo"} ${tipo === "aporte" ? "aporte" : "resgate"}`}
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
      <p className="mini-note" style={{ marginBottom: 12, display: "flex", alignItems: "center" }}>
        Ativo:&nbsp;
        <strong style={{ display: "flex", alignItems: "center" }}>
          {contaDoAtivo ? (
            <>
              <EntityCircle cor={contaDoAtivo.cor} icone={contaDoAtivo.icone} size={20} iconSize={11} />
              {contaDoAtivo.nome} - {ativo?.nome}
            </>
          ) : (
            ativo?.nome
          )}
        </strong>
      </p>
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
      <label className="field">
        {tipo === "aporte" ? "Debitar da conta" : "Creditar na conta"} (opcional)
        <CustomSelect options={contaOptions} value={contaId} onChange={setContaId} placeholder="— não afetar saldo de conta —" />
      </label>
      <div className="field-row">
        <label className="field">
          Tags
          <TagsInput value={tagsIds} onChange={setTagsIds} />
        </label>
        <label className="field">
          <span>Efetivado?</span>
          <div style={{ marginTop: 6 }}>
            <Switch on={efetivado} onToggle={() => setEfetivado((v) => !v)} />
          </div>
        </label>
      </div>
      <p className="mini-note">
        {tipo === "aporte" ? "O valor será somado ao total investido neste ativo." : "O valor será subtraído do total investido neste ativo."}
        {contaId ? " A conta selecionada terá o saldo ajustado de acordo." : ""}
      </p>
    </Modal>
  );
}
