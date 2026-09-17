import { useEffect, useState, type ReactNode } from "react";
import { CustomSelect, type CustomSelectOption } from "../../components/CustomSelect";
import { EntityCircle } from "../../components/EntityCircle";
import { HistoricoConsumoChart } from "../../components/HistoricoConsumoChart";
import { Icon } from "../../components/icons/Icon";
import { Modal } from "../../components/Modal";
import { MoneyInput } from "../../components/MoneyInput";
import { useScopeChoice } from "../../components/ScopeChoiceModal";
import { showToast } from "../../components/Toast";
import { catFilhas, catNivel1 } from "../../data/calculations/categorias";
import { mediaConsumo, mesesConsumo, metasPorMes, valorPlanejadoEfetivo } from "../../data/calculations/orcamento";
import { fmtMonthLabel, fmtMoney, monthKey, round2, todayStr } from "../../data/format";
import { persist } from "../../data/persistence";
import type { Orcamento, TipoCategoria } from "../../data/schema";
import { uid } from "../../data/schema";
import { useAppStore } from "../../data/store";

const TIPO_LABEL_ORC: Record<string, string> = { despesa: "Despesa", entrada: "Entrada", investimento: "Investimento" };

interface OrcamentoModalProps {
  orcamentoId: string | null;
  tipoOverride?: TipoCategoria;
  onClose: () => void;
  onDelete: (orcamento: Orcamento) => Promise<boolean>;
}

export function OrcamentoModal({ orcamentoId, tipoOverride, onClose, onDelete }: OrcamentoModalProps) {
  const editing = !!orcamentoId;
  const state = useAppStore((s) => s.data);
  const currentMonth = useAppStore((s) => s.currentMonth);
  const categorias = state.categorias;
  const saveOrcamento = useAppStore((s) => s.saveOrcamento);
  const addOrcamentos = useAppStore((s) => s.addOrcamentos);
  const getOrCreateCategoriaOrcamentoInvestimento = useAppStore((s) => s.getOrCreateCategoriaOrcamentoInvestimento);
  const { askScope, dialog: scopeDialog } = useScopeChoice();

  const existente = editing ? (state.orcamentos.find((o) => o.id === orcamentoId) ?? null) : null;
  const base = existente ?? {
    categoriaId: null as string | null,
    validoApartirDe: monthKey(currentMonth) + "-01",
    valorPlanejado: 0,
    historicoValores: [] as Orcamento["historicoValores"],
  };

  const catBaseId = base.categoriaId ? categorias.find((c) => c.id === base.categoriaId)?.categoriaPaiId || base.categoriaId : null;
  const catAtual = catBaseId ? categorias.find((c) => c.id === catBaseId) ?? null : null;
  const tipoAtivo: TipoCategoria = tipoOverride ?? catAtual?.tipo ?? "despesa";
  const isInvestimento = tipoAtivo === "investimento";
  const catsOrcamento = catNivel1(categorias).filter((c) => c.tipo === tipoAtivo);

  const aportesCatExistente = categorias.find(
    (c) => c.tipo === "investimento" && !c.categoriaPaiId && (c.nome === "Aportes" || c.nome === "Aportes (orçamento)"),
  );

  const [selCategoriaId, setSelCategoriaId] = useState<string | null>(() => {
    if (isInvestimento) return aportesCatExistente?.id ?? null;
    if (tipoOverride) return catsOrcamento[0]?.id ?? null;
    return catBaseId || catsOrcamento[0]?.id || null;
  });
  const [selSubcategoriaId, setSelSubcategoriaId] = useState<string | null>(() =>
    !tipoOverride && editing && catBaseId && base.categoriaId !== catBaseId ? base.categoriaId : null,
  );

  useEffect(() => {
    if (isInvestimento && !aportesCatExistente) {
      const cat = getOrCreateCategoriaOrcamentoInvestimento();
      setSelCategoriaId(cat.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [valorPlanejado, setValorPlanejado] = useState(() => valorPlanejadoEfetivo(base, currentMonth));
  const [validoApartirDe, setValidoApartirDe] = useState((base.validoApartirDe || todayStr()).slice(0, 7));
  const [criarSubtarefas, setCriarSubtarefas] = useState(false);

  const subcats = selCategoriaId ? catFilhas(categorias, selCategoriaId) : [];
  const catParaHistoricoId = isInvestimento ? selCategoriaId : selSubcategoriaId || selCategoriaId;

  const catOptions: CustomSelectOption[] = catsOrcamento.map((c) => ({
    id: c.id,
    label: c.nome,
    color: c.cor,
    icon: <EntityCircle cor={c.cor} icone={c.icone} />,
  }));
  const subcatOptions: CustomSelectOption[] = subcats.map((c) => ({
    id: c.id,
    label: c.nome,
    color: c.cor,
    icon: <EntityCircle cor={c.cor} icone={c.icone} />,
  }));

  function handleCategoriaChange(id: string) {
    setSelCategoriaId(id);
    setSelSubcategoriaId(null);
  }

  function handleUsarMedia() {
    if (!catParaHistoricoId) return;
    const meses = mesesConsumo(state, catParaHistoricoId, currentMonth);
    setValorPlanejado(round2(mediaConsumo(meses.map((m) => m.valor))));
  }

  async function handleDelete() {
    if (!existente) return;
    const excluiu = await onDelete(existente);
    if (excluiu) onClose();
  }

  async function handleSave() {
    if (!selCategoriaId) {
      showToast("Selecione uma categoria.");
      return;
    }
    const validoApartirDeVal = (validoApartirDe || monthKey(currentMonth)) + "-01";
    let historicoValoresVal = base.historicoValores || [];
    let valorPlanejadoTopoVal = valorPlanejado;

    if (editing && existente) {
      const valorEfetivoAtual = valorPlanejadoEfetivo(existente, currentMonth);
      if (valorPlanejado !== valorEfetivoAtual) {
        const escolha = await askScope(
          "Alterar valor do orçamento",
          [
            { value: "mes", label: `Somente o mês selecionado (${fmtMonthLabel(currentMonth)})` },
            { value: "diante", label: "Deste mês em diante" },
          ],
          "Aplicar esta alteração de valor:",
        );
        if (!escolha) return;
        const mesKeyAtual = monthKey(currentMonth);
        const proxMesKey = monthKey(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
        historicoValoresVal = [...historicoValoresVal, { desde: mesKeyAtual, valor: valorPlanejado }];
        if (escolha === "mes") {
          historicoValoresVal = [...historicoValoresVal, { desde: proxMesKey, valor: valorEfetivoAtual }];
        }
        valorPlanejadoTopoVal = existente.valorPlanejado;
      }
    }

    const data: Orcamento = {
      id: editing ? (orcamentoId as string) : uid("orc"),
      categoriaId: selSubcategoriaId || selCategoriaId,
      mesReferencia: null,
      validoApartirDe: validoApartirDeVal,
      valorPlanejado: valorPlanejadoTopoVal,
      historicoValores: historicoValoresVal,
    };
    saveOrcamento(data);

    if (!editing && criarSubtarefas && !isInvestimento && !selSubcategoriaId) {
      const novos = catFilhas(categorias, selCategoriaId).map((sub) => ({
        id: uid("orc"),
        categoriaId: sub.id,
        mesReferencia: null,
        validoApartirDe: validoApartirDeVal,
        valorPlanejado,
        historicoValores: [],
      }));
      if (novos.length) addOrcamentos(novos);
    }

    await persist();
    onClose();
    showToast("Orçamento salvo.");
  }

  const podeCriarSubtarefas = !isInvestimento && !editing && !selSubcategoriaId && subcats.length > 0;

  let evolucaoSection: ReactNode = null;
  if (editing && catParaHistoricoId) {
    const meses = mesesConsumo(state, catParaHistoricoId, currentMonth);
    const mesesComDados = meses.filter((m) => m.valor > 0);
    const base6 = mesesComDados.length > 0 ? mesesComDados : meses;
    const media = mediaConsumo(base6.map((m) => m.valor));
    const metas = metasPorMes(state, catParaHistoricoId, currentMonth, meses);
    const corTipo = tipoAtivo === "entrada" ? "var(--type-entrada)" : tipoAtivo === "investimento" ? "var(--type-investimento)" : "var(--type-despesa)";
    evolucaoSection = (
      <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
        <h4 style={{ margin: "0 0 4px", fontSize: 13 }}>Evolução mensal</h4>
        <p className="mini-note" style={{ margin: "0 0 8px" }}>
          Média dos últimos {base6.length} mês(es) com dados: <strong style={{ color: "var(--ink)" }}>{fmtMoney(media)}</strong>{" "}
          <button
            type="button"
            className="btn ghost small"
            style={{ padding: "2px 8px", marginLeft: 4, color: "var(--positive)", fontWeight: 700 }}
            onClick={handleUsarMedia}
          >
            Usar este valor
          </button>
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6, fontSize: 10.5, fontWeight: 600, color: "var(--ink-soft)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 12, height: 2, background: corTipo, display: "inline-block" }} /> Consumo
          </span>
          {metas.some((v) => v != null) && (
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 12, height: 0, borderTop: "2px dashed var(--gray-400)", display: "inline-block" }} /> Meta definida
            </span>
          )}
        </div>
        <HistoricoConsumoChart meses={meses} metas={metas} cor={corTipo} />
      </div>
    );
  }

  return (
    <Modal
      title={
        <span>
          {editing ? "Editar orçamento" : "Novo orçamento"}{" "}
          <span className={`chip ${tipoAtivo}`} style={{ marginLeft: 6 }}>
            {TIPO_LABEL_ORC[tipoAtivo] ?? ""}
          </span>
        </span>
      }
      onClose={onClose}
      headerExtra={
        editing ? (
          <button type="button" className="icon-btn danger" title="Excluir" onClick={handleDelete}>
            <Icon name="trash" size={14} />
          </button>
        ) : undefined
      }
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
      {!isInvestimento ? (
        <div className="field-row">
          <label className="field">
            Categoria
            <CustomSelect options={catOptions} value={selCategoriaId} onChange={handleCategoriaChange} placeholder="Selecionar categoria" />
          </label>
          <label className="field">
            Subcategoria
            <div style={{ position: "relative" }}>
              <CustomSelect
                options={subcatOptions}
                value={selSubcategoriaId}
                onChange={(v) => setSelSubcategoriaId(v || null)}
                placeholder="Categoria inteira"
              />
              {selSubcategoriaId && (
                <button
                  type="button"
                  title="Remover subcategoria"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelSubcategoriaId(null);
                  }}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 18, height: 18,
                    borderRadius: "50%", border: "none", background: "var(--surface-2)", color: "var(--ink-soft)",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0,
                    fontSize: 12, lineHeight: 1, zIndex: 2,
                  }}
                >
                  &times;
                </button>
              )}
            </div>
          </label>
        </div>
      ) : (
        <p className="mini-note" style={{ marginBottom: 12 }}>
          Este é o valor que você planeja aportar em investimentos no mês — a categoria específica do ativo não importa aqui.
        </p>
      )}

      <div className="field-row">
        <label className="field">
          Valor orçado
          <MoneyInput value={valorPlanejado} onChange={setValorPlanejado} />
        </label>
        <label className="field">
          Válido a partir de
          <input type="month" value={validoApartirDe} onChange={(e) => setValidoApartirDe(e.target.value)} />
        </label>
      </div>

      {podeCriarSubtarefas && (
        <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" style={{ width: "auto" }} checked={criarSubtarefas} onChange={(e) => setCriarSubtarefas(e.target.checked)} />
          <span>Também criar este orçamento para cada subcategoria ({subcats.length})</span>
        </label>
      )}

      <p className="mini-note">O orçamento se repete todo mês a partir da data acima (meses anteriores não são afetados).</p>

      {evolucaoSection}

      {scopeDialog}
    </Modal>
  );
}
