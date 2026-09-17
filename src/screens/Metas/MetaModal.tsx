import { useState } from "react";
import { ColorPicker } from "../../components/ColorPicker";
import { useConfirm } from "../../components/ConfirmDialog";
import { IconPicker } from "../../components/IconPicker";
import { Modal } from "../../components/Modal";
import { MoneyInput } from "../../components/MoneyInput";
import { Switch } from "../../components/Switch";
import { showToast } from "../../components/Toast";
import { COLOR_PRESETS } from "../../data/colors";
import { persist } from "../../data/persistence";
import type { Meta } from "../../data/schema";
import { uid } from "../../data/schema";
import { useAppStore } from "../../data/store";

interface MetaModalProps {
  metaId: string | null;
  onClose: () => void;
}

export function MetaModal({ metaId, onClose }: MetaModalProps) {
  const editing = !!metaId;
  const metas = useAppStore((s) => s.data.metas);
  const saveMeta = useAppStore((s) => s.saveMeta);
  const deleteMeta = useAppStore((s) => s.deleteMeta);
  const existente = editing ? metas.find((m) => m.id === metaId) : null;
  const { confirm, dialog: confirmDialog } = useConfirm();

  const [nome, setNome] = useState(existente?.nome ?? "");
  const [icone, setIcone] = useState<string>(existente?.icone ?? "target");
  const [cor, setCor] = useState(existente?.cor ?? COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)]);
  const [valorAlvo, setValorAlvo] = useState(existente?.valorAlvo ?? 0);
  const [dataAlvo, setDataAlvo] = useState(existente?.dataAlvo ?? "");
  const [descricao, setDescricao] = useState(existente?.descricao ?? "");
  const [valorAtualNovo, setValorAtualNovo] = useState(0);
  const [concluida, setConcluida] = useState(existente?.concluida ?? false);

  async function handleDelete() {
    if (!metaId) return;
    const ok = await confirm("Excluir esta meta?", { danger: true });
    if (!ok) return;
    deleteMeta(metaId);
    await persist();
    onClose();
    showToast("Meta excluída.");
  }

  async function handleSave() {
    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      showToast("Informe um nome para a meta.");
      return;
    }
    if (editing && existente) {
      const meta: Meta = {
        ...existente,
        nome: nomeTrim,
        valorAlvo,
        dataAlvo: dataAlvo || null,
        cor,
        icone,
        concluida,
        descricao,
      };
      saveMeta(meta);
    } else {
      const movimentos =
        valorAtualNovo > 0 ? [{ id: uid("metamov"), data: new Date().toISOString().slice(0, 10), valor: valorAtualNovo, tipo: "entrada" as const }] : [];
      const meta: Meta = {
        id: uid("meta"),
        nome: nomeTrim,
        valorAlvo,
        valorAtual: valorAtualNovo,
        dataAlvo: dataAlvo || null,
        cor,
        icone,
        concluida: false,
        criadoEm: new Date().toISOString(),
        descricao,
        movimentos,
      };
      saveMeta(meta);
    }
    await persist();
    onClose();
    showToast("Meta salva.");
  }

  return (
    <Modal
      title={editing ? "Editar meta" : "Nova meta"}
      onClose={onClose}
      footer={
        <>
          <div>
            {editing && (
              <button type="button" className="btn danger" onClick={handleDelete}>
                Excluir
              </button>
            )}
          </div>
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
      <div className="field-row" style={{ gridTemplateColumns: "auto 1fr auto", alignItems: "flex-end", gap: 14 }}>
        <div className="field" style={{ alignItems: "center" }}>
          <IconPicker value={icone} onChange={(k) => setIcone(k)} />
        </div>
        <label className="field">
          Nome
          <input type="text" placeholder="Ex: Viagem, Reserva de emergência..." value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>
        <div className="field" style={{ alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 5 }}>Cor</span>
          <ColorPicker value={cor} onChange={setCor} />
        </div>
      </div>

      <div className="field-row">
        <label className="field">
          Valor alvo
          <MoneyInput value={valorAlvo} onChange={setValorAlvo} />
        </label>
        <label className="field">
          Data alvo (opcional)
          <input type="date" value={dataAlvo ?? ""} onChange={(e) => setDataAlvo(e.target.value)} />
        </label>
      </div>

      <label className="field">
        Descrição (opcional)
        <textarea rows={2} placeholder="Descreva o objetivo desta meta..." value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </label>

      {!editing ? (
        <label className="field">
          Valor já acumulado (opcional)
          <MoneyInput value={valorAtualNovo} onChange={setValorAtualNovo} />
        </label>
      ) : (
        <div className="toggle-row">
          <div className="ti">
            <h4>Meta alcançada</h4>
            <p>Marca esta meta como concluída, independente do valor acumulado.</p>
          </div>
          <Switch on={concluida} onToggle={() => setConcluida((v) => !v)} />
        </div>
      )}

      {confirmDialog}
    </Modal>
  );
}
