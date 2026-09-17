import { useState } from "react";
import { ColorPicker } from "../../components/ColorPicker";
import { useConfirm } from "../../components/ConfirmDialog";
import { IconPicker } from "../../components/IconPicker";
import { CategoryIcon } from "../../components/icons/CategoryIcon";
import { resolveIconKey, type CategoryIconName } from "../../components/icons/categoryRegistry";
import { Icon } from "../../components/icons/Icon";
import { Modal } from "../../components/Modal";
import { Switch } from "../../components/Switch";
import { showToast } from "../../components/Toast";
import { catFilhas } from "../../data/calculations/categorias";
import { COLOR_PRESETS } from "../../data/colors";
import { persist } from "../../data/persistence";
import type { Categoria, TipoCategoria } from "../../data/schema";
import { uid } from "../../data/schema";
import { useAppStore } from "../../data/store";

const TIPO_LABEL: Record<TipoCategoria, string> = {
  despesa: "Despesa",
  entrada: "Entrada",
  investimento: "Investimento",
  conta: "Conta",
};

interface CategoriaModalProps {
  categoriaId: string | null;
  paiIdPreset?: string | null;
  tipoPreset?: TipoCategoria;
  onClose: () => void;
  onNavigate: (id: string) => void;
}

export function CategoriaModal({ categoriaId, paiIdPreset, tipoPreset, onClose, onNavigate }: CategoriaModalProps) {
  const editing = !!categoriaId;
  const categorias = useAppStore((s) => s.data.categorias);
  const saveCategoria = useAppStore((s) => s.saveCategoria);
  const setCategoriaArquivada = useAppStore((s) => s.setCategoriaArquivada);
  const deleteCategoria = useAppStore((s) => s.deleteCategoria);
  const { confirm, dialog: confirmDialog } = useConfirm();

  const editingCat = editing ? categorias.find((c) => c.id === categoriaId) ?? null : null;
  const effectivePaiId = editing ? editingCat?.categoriaPaiId ?? null : paiIdPreset ?? null;
  const paiCat = effectivePaiId ? categorias.find((c) => c.id === effectivePaiId) ?? null : null;
  const tipoFinal: TipoCategoria = editing ? editingCat?.tipo ?? "despesa" : paiCat?.tipo ?? tipoPreset ?? "despesa";
  const isSingleLevel = tipoFinal === "conta" || tipoFinal === "investimento";
  const isNivel1Editing = editing && !effectivePaiId && !isSingleLevel;

  const base: Categoria = editingCat ?? {
    id: "",
    nome: "",
    tipo: tipoFinal,
    categoriaPaiId: paiIdPreset ?? null,
    cor: paiCat ? paiCat.cor : COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)],
    icone: tipoFinal === "conta" ? "bank" : "other",
    arquivada: false,
    ocultarGraficos: false,
  };

  const [nome, setNome] = useState(base.nome);
  const [icone, setIcone] = useState<string>(base.icone ?? "other");
  const [cor, setCor] = useState(base.cor);
  const [ocultarGraficos, setOcultarGraficos] = useState(base.ocultarGraficos);

  const [novoSubNome, setNovoSubNome] = useState("");
  const [novoSubIcone, setNovoSubIcone] = useState("other");
  const [novoSubCor, setNovoSubCor] = useState(base.cor);

  const subcategorias = editing && categoriaId ? catFilhas(categorias, categoriaId) : [];

  async function handleAddSub() {
    const nomeSub = novoSubNome.trim();
    if (!nomeSub) {
      showToast("Informe um nome para a subcategoria.");
      return;
    }
    saveCategoria({
      id: uid("cat"),
      nome: nomeSub,
      tipo: tipoFinal,
      categoriaPaiId: categoriaId as string,
      cor: novoSubCor,
      icone: novoSubIcone || "other",
      arquivada: false,
      ocultarGraficos: false,
    });
    await persist();
    setNovoSubNome("");
    setNovoSubIcone("other");
    setNovoSubCor(base.cor);
  }

  async function handleArquivarSub(sub: Categoria) {
    const ok = await confirm("Arquivar esta subcategoria? O histórico é mantido e ela pode ser restaurada depois.");
    if (!ok) return;
    setCategoriaArquivada(sub.id, true);
    await persist();
    showToast("Subcategoria arquivada.");
  }

  async function handleExcluirSub(sub: Categoria) {
    const ok = await confirm("Excluir esta subcategoria?", { danger: true });
    if (!ok) return;
    deleteCategoria(sub.id);
    await persist();
  }

  async function handleSave() {
    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      showToast("Informe um nome.");
      return;
    }
    const categoria: Categoria = {
      id: editing ? (categoriaId as string) : uid("cat"),
      nome: nomeTrim,
      tipo: tipoFinal,
      categoriaPaiId: effectivePaiId,
      cor,
      icone: icone || "",
      arquivada: editingCat?.arquivada ?? false,
      ocultarGraficos,
    };
    saveCategoria(categoria);
    if (!editing && !effectivePaiId && !isSingleLevel) {
      saveCategoria({
        id: uid("cat"),
        nome: "Outros",
        tipo: tipoFinal,
        categoriaPaiId: categoria.id,
        cor: "#9C978A",
        icone: "other",
        arquivada: false,
        ocultarGraficos: false,
      });
    }
    await persist();
    onClose();
    showToast("Categoria salva.");
  }

  return (
    <Modal
      title={
        <span>
          {editing ? "Editar categoria" : paiCat ? "Nova subcategoria" : "Nova categoria"}{" "}
          <span className={`chip ${tipoFinal}`} style={{ marginLeft: 6 }}>
            {TIPO_LABEL[tipoFinal]}
          </span>
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
            <button type="button" className="btn primary" onClick={handleSave}>
              Salvar
            </button>
          </div>
        </>
      }
    >
      {paiCat && (
        <div className="mini-note" style={{ marginBottom: 10 }}>
          Subcategoria de <strong>{paiCat.nome}</strong>
        </div>
      )}

      <div className="field-row" style={{ gridTemplateColumns: "auto 1fr auto", alignItems: "flex-end", gap: 14 }}>
        <div className="field" style={{ alignItems: "center" }}>
          <IconPicker value={icone} onChange={(k) => setIcone(k)} />
        </div>
        <label className="field">
          Nome <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>
        <div className="field" style={{ alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 5 }}>Cor</span>
          <ColorPicker value={cor} onChange={setCor} />
        </div>
      </div>

      {isNivel1Editing && (
        <div style={{ marginTop: 8, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 8 }}>Subcategorias</div>
          <div style={{ marginBottom: 10 }}>
            {subcategorias.length === 0 && <span className="mini-note">Nenhuma ainda.</span>}
            {subcategorias.map((sc) => (
              <div
                key={sc.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px dashed var(--line)" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  <span className="cat-circle" style={{ background: "var(--gray-100)", color: "var(--ink-soft)" }}>
                    {(() => {
                      const key = resolveIconKey(sc.icone);
                      return key ? <CategoryIcon name={key as CategoryIconName} size={13} /> : null;
                    })()}
                  </span>
                  <span style={{ flex: 1 }}>{sc.nome}</span>
                  <span className="csel-dot" style={{ background: sc.cor, width: 16, height: 16, flex: "none" }} title="Cor da subcategoria" />
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 16 }}>
                  <button type="button" className="icon-btn" title="Editar" onClick={() => onNavigate(sc.id)}>
                    <Icon name="edit" size={14} />
                  </button>
                  <button type="button" className="icon-btn" title="Arquivar" onClick={() => handleArquivarSub(sc)}>
                    <Icon name="detail" size={14} />
                  </button>
                  <button type="button" className="icon-btn danger" title="Excluir" onClick={() => handleExcluirSub(sc)}>
                    <Icon name="trash" size={14} />
                  </button>
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div className="field" style={{ marginBottom: 0, alignItems: "center" }}>
              <IconPicker value={novoSubIcone} onChange={(k) => setNovoSubIcone(k)} />
            </div>
            <input
              type="text"
              placeholder="Nome da nova subcategoria..."
              style={{ flex: 1 }}
              value={novoSubNome}
              onChange={(e) => setNovoSubNome(e.target.value)}
            />
            <div className="field" style={{ marginBottom: 0, alignItems: "center" }}>
              <ColorPicker value={novoSubCor} onChange={setNovoSubCor} />
            </div>
            <button type="button" className="btn small" style={{ flex: "none" }} onClick={handleAddSub}>
              Adicionar
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
        <div>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>Ocultar dos gráficos do Dashboard</span>
          <p className="mini-note" style={{ margin: "2px 0 0" }}>
            A categoria continua sendo somada nos totais gerais, só não aparece nos gráficos (Top categorias, Variação).
          </p>
        </div>
        <Switch on={ocultarGraficos} onToggle={() => setOcultarGraficos((v) => !v)} />
      </div>

      {confirmDialog}
    </Modal>
  );
}
