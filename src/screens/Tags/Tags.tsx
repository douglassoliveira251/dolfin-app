import { useState } from "react";
import { useConfirm } from "../../components/ConfirmDialog";
import { Icon } from "../../components/icons/Icon";
import { Modal } from "../../components/Modal";
import { showToast } from "../../components/Toast";
import { persist } from "../../data/persistence";
import { useAppStore } from "../../data/store";

const COR_TAG_PADRAO = "#B8863A";

export function Tags() {
  const tags = useAppStore((s) => s.data.tags);
  const lancamentos = useAppStore((s) => s.data.lancamentos);
  const aportes = useAppStore((s) => s.data.investimentos.aportes);
  const addTag = useAppStore((s) => s.addTag);
  const renameTag = useAppStore((s) => s.renameTag);
  const deleteTag = useAppStore((s) => s.deleteTag);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");

  const { confirm, dialog: confirmDialog } = useConfirm();

  function usoTag(tagId: string): number {
    return (
      lancamentos.filter((l) => l.tagsIds.includes(tagId)).length +
      aportes.filter((a) => a.tagsIds.includes(tagId)).length
    );
  }

  function startEdit(id: string, nomeAtual: string) {
    setEditingId(id);
    setEditValue(nomeAtual);
  }

  async function saveEdit(id: string, nomeOriginal: string) {
    const novoNome = editValue.trim();
    setEditingId(null);
    if (novoNome && novoNome !== nomeOriginal) {
      renameTag(id, novoNome);
      await persist();
      showToast("Tag atualizada.");
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm("Deseja excluir esta tag?", { danger: true });
    if (!ok) return;
    deleteTag(id);
    await persist();
    showToast("Tag excluída.");
  }

  async function handleCreate() {
    const nome = createName.trim();
    if (!nome) {
      showToast("Informe um nome.");
      return;
    }
    addTag(nome, COR_TAG_PADRAO);
    await persist();
    setCreateOpen(false);
    setCreateName("");
    showToast("Tag criada.");
  }

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Tags</h1>
          <div className="sub">Marcações transversais para análises específicas</div>
        </div>
        <button type="button" className="btn-create" onClick={() => setCreateOpen(true)}>
          <span className="badge-plus">
            <Icon name="plus" size={14} />
          </span>{" "}
          Nova tag
        </button>
      </div>

      <div className="card">
        <div className="pill-select">
          {tags.map((t) => (
            <span className="tag-token" key={t.id}>
              {editingId === t.id ? (
                <input
                  type="text"
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => saveEdit(t.id, t.nome)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveEdit(t.id, t.nome);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setEditingId(null);
                    }
                  }}
                  style={{
                    fontSize: "inherit",
                    fontFamily: "inherit",
                    border: "1px solid var(--sidebar-accent)",
                    borderRadius: 6,
                    padding: "2px 6px",
                    width: 110,
                    background: "var(--surface)",
                    color: "var(--ink)",
                  }}
                />
              ) : (
                <span style={{ cursor: "text" }} onClick={() => startEdit(t.id, t.nome)}>
                  {t.nome}
                </span>
              )}
              <span className="mini-note" style={{ margin: 0, fontWeight: 600 }}>
                {usoTag(t.id)}
              </span>
              <span
                className="tt-icon chip-x"
                style={{ width: 13, height: 13, cursor: "pointer" }}
                onClick={() => handleDelete(t.id)}
              >
                <Icon name="trash" size={13} />
              </span>
            </span>
          ))}
        </div>
        {tags.length === 0 && (
          <div className="empty-state">
            <Icon name="empty" size={38} />
            <div>Nenhuma tag cadastrada ainda.</div>
          </div>
        )}
      </div>

      {createOpen && (
        <Modal
          title="Nova tag"
          onClose={() => setCreateOpen(false)}
          footer={
            <>
              <div />
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="btn ghost" onClick={() => setCreateOpen(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn primary" onClick={handleCreate}>
                  Salvar
                </button>
              </div>
            </>
          }
        >
          <label className="field">
            Nome
            <input
              type="text"
              autoFocus
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </label>
        </Modal>
      )}

      {confirmDialog}
    </div>
  );
}
