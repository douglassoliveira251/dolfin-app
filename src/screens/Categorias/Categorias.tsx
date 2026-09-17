import { useState } from "react";
import { useConfirm } from "../../components/ConfirmDialog";
import { Icon } from "../../components/icons/Icon";
import { CategoryIcon } from "../../components/icons/CategoryIcon";
import { resolveIconKey, type CategoryIconName } from "../../components/icons/categoryRegistry";
import { showToast } from "../../components/Toast";
import { catFilhas, catNivel1 } from "../../data/calculations/categorias";
import { contrastIconColor } from "../../data/colors";
import { persist } from "../../data/persistence";
import type { Categoria, TipoCategoria } from "../../data/schema";
import { useAppStore } from "../../data/store";
import { CategoriaModal } from "./CategoriaModal";
import { ExcluirCategoriaComSubModal } from "./ExcluirCategoriaComSubModal";

const TABS: { tipo: TipoCategoria; label: string; icon: "kpiArrowDown" | "kpiArrowUp" | "kpiTrend" }[] = [
  { tipo: "entrada", label: "Receitas", icon: "kpiArrowDown" },
  { tipo: "despesa", label: "Despesas", icon: "kpiArrowUp" },
  { tipo: "investimento", label: "Investimentos", icon: "kpiTrend" },
];

function TabCircleIcon({ cat }: { cat: Categoria }) {
  const key = resolveIconKey(cat.icone);
  return (
    <span className="cat-circle" style={{ background: cat.cor, color: contrastIconColor(cat.cor) }}>
      {key && <CategoryIcon name={key as CategoryIconName} size={13} />}
    </span>
  );
}

export function Categorias() {
  const categorias = useAppStore((s) => s.data.categorias);
  const lancamentos = useAppStore((s) => s.data.lancamentos);
  const setCategoriaArquivada = useAppStore((s) => s.setCategoriaArquivada);
  const deleteCategoria = useAppStore((s) => s.deleteCategoria);
  const deleteCategoriasComFilhas = useAppStore((s) => s.deleteCategoriasComFilhas);

  const [catTabTipo, setCatTabTipo] = useState<TipoCategoria>("entrada");
  const [mostrarArquivadas, setMostrarArquivadas] = useState(false);
  const [modalCat, setModalCat] = useState<{ id: string | null } | null>(null);
  const [excluirComSub, setExcluirComSub] = useState<{ cat: Categoria; filhas: Categoria[]; qtdLanc: number } | null>(null);
  const { confirm, dialog: confirmDialog } = useConfirm();

  const nivel1Filtradas = catNivel1(categorias)
    .filter((c) => c.tipo === catTabTipo && c.nome !== "Aportes" && c.nome !== "Aportes (orçamento)")
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const arquivadasFiltradas = categorias.filter((c) => c.arquivada && c.tipo === catTabTipo);

  async function handleArquivar(cat: Categoria) {
    const temFilhas = catFilhas(categorias, cat.id).length > 0;
    if (temFilhas) {
      showToast("Arquive ou exclua as subcategorias antes.");
      return;
    }
    const ok = await confirm(`Arquivar a categoria "${cat.nome}"? O histórico é mantido e ela pode ser restaurada depois.`);
    if (!ok) return;
    setCategoriaArquivada(cat.id, true);
    await persist();
    showToast("Categoria arquivada.");
  }

  async function handleExcluir(cat: Categoria) {
    const filhas = catFilhas(categorias, cat.id, true);
    if (filhas.length > 0) {
      const idsFilhas = filhas.map((f) => f.id);
      const qtdLanc = lancamentos.filter((l) => l.categoriasIds.includes(cat.id) || idsFilhas.some((id) => l.categoriasIds.includes(id))).length;
      setExcluirComSub({ cat, filhas, qtdLanc });
      return;
    }
    const qtdLanc = lancamentos.filter((l) => l.categoriasIds.includes(cat.id)).length;
    const aviso =
      qtdLanc > 0
        ? `Excluir a categoria "${cat.nome}" apaga a referência dela em ${qtdLanc} lançamento(s) — você perde o histórico dessa categorização. Se preferir manter o histórico, use "Arquivar" em vez de excluir.`
        : `Excluir definitivamente a categoria "${cat.nome}"? Essa ação não pode ser desfeita.`;
    const ok = await confirm(aviso, { danger: true });
    if (!ok) return;
    deleteCategoria(cat.id);
    await persist();
    showToast("Categoria excluída.");
  }

  async function handleChoiceComSub(choice: "arquivar" | "excluir" | null) {
    if (!excluirComSub) return;
    const { cat, filhas } = excluirComSub;
    setExcluirComSub(null);
    if (choice === "arquivar") {
      const temFilhasAtivas = catFilhas(categorias, cat.id).length > 0;
      if (temFilhasAtivas) {
        showToast("Arquive ou exclua as subcategorias antes.");
        return;
      }
      setCategoriaArquivada(cat.id, true);
      await persist();
      showToast("Categoria arquivada.");
      return;
    }
    if (choice === "excluir") {
      deleteCategoriasComFilhas([cat.id, ...filhas.map((f) => f.id)]);
      await persist();
      showToast("Categoria e subcategorias excluídas.");
    }
  }

  async function handleRestaurar(cat: Categoria) {
    setCategoriaArquivada(cat.id, false);
    await persist();
    showToast("Categoria restaurada.");
  }

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Categorias</h1>
          <div className="sub">Organização dos seus lançamentos</div>
        </div>
      </div>

      <div className="tabs-card" style={{ justifyContent: "space-between", alignItems: "center", background: "none", border: "none", padding: 0 }}>
        <div style={{ display: "flex", gap: 6, background: "var(--surface-2)", borderRadius: 12, padding: 4 }}>
          {TABS.map((t) => {
            const cor = t.tipo === "entrada" ? "var(--positive)" : t.tipo === "despesa" ? "var(--negative)" : "var(--type-investimento)";
            const ativo = catTabTipo === t.tipo;
            return (
              <button
                key={t.tipo}
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "9px 16px",
                  border: "none",
                  borderRadius: 9,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: ".15s",
                  background: ativo ? cor : "transparent",
                  color: ativo ? "#fff" : "var(--ink-soft)",
                }}
                onClick={() => setCatTabTipo(t.tipo)}
              >
                <Icon name={t.icon} size={15} /> {t.label}
              </button>
            );
          })}
        </div>
        <button type="button" className="btn-create" style={{ marginRight: 2 }} onClick={() => setModalCat({ id: null })}>
          <span className="badge-plus">
            <Icon name="plus" size={14} />
          </span>{" "}
          Categoria
        </button>
      </div>

      <div className="table-wrap">
        {nivel1Filtradas.length === 0 ? (
          <div className="empty-state">
            <Icon name="empty" size={38} />
            <div>Nenhuma categoria deste tipo cadastrada ainda.</div>
          </div>
        ) : (
          <div>
            {nivel1Filtradas.map((c, i) => {
              const nFilhas = catFilhas(categorias, c.id).length;
              return (
                <div
                  key={c.id}
                  className="cat-tree-head cat-row-click"
                  style={{ padding: "14px 16px", cursor: "pointer", ...(i > 0 ? { borderTop: "1px solid var(--surface-2)" } : {}) }}
                  onClick={() => setModalCat({ id: c.id })}
                >
                  <div className="cat-row-main">
                    <TabCircleIcon cat={c} />
                    <span>{c.nome}</span>
                    {catTabTipo !== "investimento" && (
                      <span className="mini-note" style={{ marginLeft: 8 }}>
                        {nFilhas} subcategoria(s)
                      </span>
                    )}
                  </div>
                  <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 4 }}>
                    <button type="button" className="icon-btn" title="Arquivar" style={{ color: "var(--gray-400)" }} onClick={() => handleArquivar(c)}>
                      <Icon name="archive" size={14} />
                    </button>
                    <button type="button" className="icon-btn danger" title="Excluir" onClick={() => handleExcluir(c)}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {arquivadasFiltradas.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button type="button" className="btn ghost small" onClick={() => setMostrarArquivadas((v) => !v)}>
            {mostrarArquivadas ? "Ocultar" : "Ver"} {arquivadasFiltradas.length} categoria(s) arquivada(s)
          </button>
          {mostrarArquivadas && (
            <div className="table-wrap" style={{ marginTop: 10 }}>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {arquivadasFiltradas.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <TabCircleIcon cat={c} /> {c.nome}
                        </td>
                        <td>
                          <button type="button" className="btn small" onClick={() => handleRestaurar(c)}>
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

      {modalCat && (
        <CategoriaModal
          key={modalCat.id ?? "new"}
          categoriaId={modalCat.id}
          tipoPreset={catTabTipo}
          onClose={() => setModalCat(null)}
          onNavigate={(id) => setModalCat({ id })}
        />
      )}
      {excluirComSub && (
        <ExcluirCategoriaComSubModal cat={excluirComSub.cat} filhas={excluirComSub.filhas} qtdLanc={excluirComSub.qtdLanc} onChoice={handleChoiceComSub} />
      )}
      {confirmDialog}
    </div>
  );
}
