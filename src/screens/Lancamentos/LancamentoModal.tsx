import { useState } from "react";
import { useConfirm } from "../../components/ConfirmDialog";
import { CustomSelect, type CustomSelectOption } from "../../components/CustomSelect";
import { EntityCircle } from "../../components/EntityCircle";
import { Icon } from "../../components/icons/Icon";
import { MiniCalculator } from "../../components/MiniCalculator";
import { Modal } from "../../components/Modal";
import { MoneyInput } from "../../components/MoneyInput";
import { useScopeChoice } from "../../components/ScopeChoiceModal";
import { Switch } from "../../components/Switch";
import { TagsInput } from "../../components/TagsInput";
import { showToast } from "../../components/Toast";
import { catFilhas } from "../../data/calculations/categorias";
import { competenciaAberta } from "../../data/calculations/cartoes";
import { gerarOcorrenciasRecorrencia } from "../../data/calculations/recorrencia";
import { fmtDate, fmtMonthLabel, fmtMoney, monthKey, nowLocalIso, nowTimeStr, round2, todayStr } from "../../data/format";
import { persist } from "../../data/persistence";
import type { CategoriaSplit, Lancamento, Recorrencia, TipoLancamento } from "../../data/schema";
import { uid } from "../../data/schema";
import { useAppStore } from "../../data/store";

const TIPO_LABEL: Record<TipoLancamento, string> = {
  entrada: "Receita",
  despesa: "Despesa",
  investimento: "Investimento",
  transferencia: "Transferência",
};

const FREQ_OPTIONS: { value: string; labelSingular: string; labelPlural: string }[] = [
  { value: "dia", labelSingular: "Dia", labelPlural: "Dia(s)" },
  { value: "mes", labelSingular: "Mês", labelPlural: "Mês(es)" },
  { value: "ano", labelSingular: "Ano", labelPlural: "Ano(s)" },
];

interface RecorrenciaForm {
  ativa: boolean;
  frequencia: string;
  intervalo: number;
  grupoId: string;
  tipo: string;
  valorTipo: string;
  totalParcelas: number | null;
  parcelaAtual: number | null;
  parcelaInicial: number;
  dataTermino: string | null;
}

function recorrenciaPadrao(): RecorrenciaForm {
  return {
    ativa: false,
    frequencia: "mensal",
    intervalo: 1,
    grupoId: "",
    tipo: "parcelado",
    valorTipo: "total",
    totalParcelas: 2,
    parcelaAtual: null,
    parcelaInicial: 1,
    dataTermino: null,
  };
}

function toRecorrencia(f: RecorrenciaForm): Recorrencia {
  if (!f.ativa) return { ativa: false };
  return {
    ativa: true,
    frequencia: f.frequencia,
    intervalo: f.intervalo,
    grupoId: f.grupoId,
    tipo: f.tipo,
    valorTipo: f.valorTipo,
    totalParcelas: f.totalParcelas,
    parcelaAtual: f.parcelaAtual,
    parcelaInicial: f.parcelaInicial,
    dataTermino: f.dataTermino,
  };
}

interface LancamentoModalProps {
  lancamentoId: string | null;
  presetTipo?: TipoLancamento;
  onClose: () => void;
}

export function LancamentoModal({ lancamentoId, presetTipo, onClose }: LancamentoModalProps) {
  const editing = !!lancamentoId;
  const state = useAppStore((s) => s.data);
  const saveLancamento = useAppStore((s) => s.saveLancamento);
  const addLancamentos = useAppStore((s) => s.addLancamentos);
  const deleteLancamento = useAppStore((s) => s.deleteLancamento);
  const deleteLancamentosSerie = useAppStore((s) => s.deleteLancamentosSerie);
  const updateLancamentosSerie = useAppStore((s) => s.updateLancamentosSerie);
  const updateConfiguracoes = useAppStore((s) => s.updateConfiguracoes);
  const { confirm, dialog: confirmDialog } = useConfirm();
  const { askScope, dialog: scopeDialog } = useScopeChoice();

  const existente = editing ? (state.lancamentos.find((l) => l.id === lancamentoId) ?? null) : null;
  const tipo: TipoLancamento = existente?.tipo ?? presetTipo ?? "despesa";

  const base: Lancamento = (() => {
    if (existente) return existente;
    const lastPair = (state.configuracoes.lastUsedCategoria as Record<string, [string | null, string | null] | undefined>)[tipo] ?? [null, null];
    const lastPaiValido = lastPair[0] && state.categorias.find((c) => c.id === lastPair[0])?.tipo === tipo ? lastPair[0] : null;
    const lastSubValido = lastPaiValido && lastPair[1] && catFilhas(state.categorias, lastPaiValido).some((c) => c.id === lastPair[1]) ? lastPair[1] : null;
    const contaPadraoIni = state.contas.find((c) => c.padrao) ?? null;
    let contaId = contaPadraoIni?.id ?? state.contas[0]?.id ?? null;
    const cartaoId: string | null = null;
    const competenciaFatura: string | null = null;
    if (tipo === "investimento") {
      const contaInv = state.contas.find((c) => c.tipo === "investimento");
      if (contaInv) contaId = contaInv.id;
    }
    return {
      id: "",
      tipo,
      nome: "",
      valor: 0,
      data: todayStr(),
      hora: nowTimeStr(),
      criadoEm: new Date().toISOString(),
      categoriasSplits: null,
      contaId,
      cartaoId,
      competenciaFatura,
      contaDestinoId: null,
      categoriasIds: lastPaiValido ? (lastSubValido ? [lastPaiValido, lastSubValido] : [lastPaiValido]) : [],
      tagsIds: [],
      descricao: "",
      efetivado: true,
      dataEfetivacao: nowLocalIso(),
      grupoPagamento: null,
      origemPagamentoGrupo: null,
      recorrencia: recorrenciaPadrao(),
    };
  })();

  const [nome, setNome] = useState(base.nome);
  const [valor, setValor] = useState(base.valor);
  const [data, setData] = useState(base.data);
  const [hora, setHora] = useState(base.hora);
  const [descricao, setDescricao] = useState(base.descricao);
  const [contaId, setContaId] = useState<string | null>(base.contaId);
  const [cartaoId, setCartaoId] = useState<string | null>(base.cartaoId);
  const [competenciaFatura, setCompetenciaFatura] = useState<string | null>(base.competenciaFatura);
  const [contaDestinoId, setContaDestinoId] = useState<string | null>(base.contaDestinoId);
  const [categoriasIds, setCategoriasIds] = useState<string[]>(base.categoriasIds);
  const [tagsIds, setTagsIds] = useState<string[]>(base.tagsIds);
  const [efetivado, setEfetivado] = useState(base.efetivado);
  const [dataEfetivacao, setDataEfetivacao] = useState<string | null>(base.dataEfetivacao);
  const [criadoEm, setCriadoEm] = useState(base.criadoEm);
  const [recorrencia, setRecorrencia] = useState<RecorrenciaForm>(
    base.recorrencia.ativa ? { ...base.recorrencia } : recorrenciaPadrao(),
  );

  const [multiCatMode, setMultiCatMode] = useState(!!existente?.categoriasSplits && existente.categoriasSplits.length > 1);
  const [multiCatSplits, setMultiCatSplits] = useState<CategoriaSplit[]>(
    existente?.categoriasSplits && existente.categoriasSplits.length > 1 ? existente.categoriasSplits.map((s) => ({ ...s })) : [],
  );
  const [repeatPopoverOpen, setRepeatPopoverOpen] = useState(false);
  const [opcoesAvancadasOpen, setOpcoesAvancadasOpen] = useState(false);
  const [efetivadoTocadoManualmente, setEfetivadoTocadoManualmente] = useState(false);
  const [recorrenciaReiniciada, setRecorrenciaReiniciada] = useState(false);

  const corTipo = tipo === "despesa" ? "var(--negative)" : tipo === "entrada" ? "var(--positive)" : tipo === "investimento" ? "var(--type-investimento)" : "var(--type-transferencia)";
  const catPaiAtual = categoriasIds[0] ?? null;
  const subcatAtual = categoriasIds[1] ?? null;

  const contasDisponiveis = tipo === "investimento" ? state.contas.filter((c) => c.tipo === "investimento") : state.contas;
  const categoriasDisponiveis = tipo !== "transferencia" ? state.categorias.filter((c) => !c.categoriaPaiId && c.tipo === tipo) : [];
  const subcategoriasDisponiveis = (paiId: string | null) => (paiId ? catFilhas(state.categorias, paiId) : []);

  const contaOptions: CustomSelectOption[] = contasDisponiveis.map((c) => ({ id: c.id, label: c.nome, color: c.cor, icon: <EntityCircle cor={c.cor} icone={c.icone} /> }));
  const cartaoOptions: CustomSelectOption[] = state.cartoes.map((c) => ({ id: c.id, label: c.nome, color: c.cor, icon: <EntityCircle cor={c.cor} icone={c.icone} /> }));
  const catOptions: CustomSelectOption[] = categoriasDisponiveis.map((c) => ({ id: c.id, label: c.nome, color: c.cor, icon: <EntityCircle cor={c.cor} icone={c.icone} /> }));
  const subcatOptions = (paiId: string | null): CustomSelectOption[] =>
    subcategoriasDisponiveis(paiId).map((c) => ({ id: c.id, label: c.nome, color: c.cor, icon: <EntityCircle cor={c.cor} icone={c.icone} /> }));

  function pickCategoriaPai(v: string) {
    const outrosSub = catFilhas(state.categorias, v).find((sc) => sc.nome === "Outros");
    setCategoriasIds(outrosSub ? [v, outrosSub.id] : [v]);
  }

  const valorTotalDisplay = multiCatMode ? multiCatSplits.reduce((s, x) => s + (Number(x.valor) || 0), 0) : valor;

  function handleEhCartaoToggle() {
    if (cartaoId) {
      setCartaoId(null);
      setCompetenciaFatura(null);
    } else {
      const cartaoPadrao = state.cartoes.find((c) => c.padrao) ?? state.cartoes[0];
      if (!cartaoPadrao) {
        showToast("Cadastre um cartão primeiro.");
        return;
      }
      setCartaoId(cartaoPadrao.id);
      setEfetivado(false);
      if (cartaoPadrao.contaVinculada) setContaId(cartaoPadrao.contaVinculada);
      setCompetenciaFatura(competenciaAberta(cartaoPadrao));
    }
  }

  function handleCartaoChange(v: string) {
    setCartaoId(v);
    setEfetivado(false);
    const cartaoSel = state.cartoes.find((c) => c.id === v);
    if (cartaoSel?.contaVinculada) setContaId(cartaoSel.contaVinculada);
    if (cartaoSel) setCompetenciaFatura(competenciaAberta(cartaoSel));
  }

  function handleMultiCatToggle() {
    if (!multiCatMode && multiCatSplits.length === 0) {
      const catFallback = catPaiAtual || categoriasDisponiveis[0]?.id || null;
      const outrosSubFallback = catFallback ? catFilhas(state.categorias, catFallback).find((sc) => sc.nome === "Outros") : null;
      setMultiCatSplits([
        { categoriaId: catFallback, subcategoriaId: subcatAtual || outrosSubFallback?.id || null, valor },
        { categoriaId: null, subcategoriaId: null, valor: 0 },
      ]);
    }
    setMultiCatMode((v) => !v);
  }

  function updateSplit(i: number, patch: Partial<CategoriaSplit>) {
    setMultiCatSplits((splits) => splits.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  const competenciaOptions = (() => {
    const opts: string[] = [];
    const baseMonth = competenciaFatura ? new Date(competenciaFatura + "-01T00:00:00") : new Date();
    for (let i = -1; i <= 2; i++) {
      opts.push(monthKey(new Date(baseMonth.getFullYear(), baseMonth.getMonth() + i, 1)));
    }
    return [...new Set(opts)];
  })();
  const cartaoSelAberta = cartaoId ? competenciaAberta(state.cartoes.find((c) => c.id === cartaoId)!) : null;

  const recorrenciaLabel = !recorrencia.ativa
    ? "Não recorrente"
    : recorrencia.tipo === "parcelado"
      ? `Parcelado · a cada ${recorrencia.intervalo || 1} ${(recorrencia.intervalo || 1) > 1 ? (recorrencia.frequencia === "dia" || recorrencia.frequencia === "diario" ? "dias" : recorrencia.frequencia === "ano" || recorrencia.frequencia === "anual" ? "anos" : "meses") : recorrencia.frequencia === "dia" || recorrencia.frequencia === "diario" ? "dia" : recorrencia.frequencia === "ano" || recorrencia.frequencia === "anual" ? "ano" : "mês"} · ${recorrencia.totalParcelas}x`
      : "Fixo mensal";

  async function handleDelete() {
    if (!existente) return;
    if (!existente.recorrencia.ativa) {
      const ok = await confirm("Deseja excluir este lançamento? Essa ação não pode ser desfeita.", { danger: true });
      if (!ok) return;
      deleteLancamento(existente.id);
      await persist(true);
      onClose();
      showToast("Lançamento excluído.");
      return;
    }
    const escolha = await askScope(
      "Excluir lançamento recorrente",
      [
        { value: "uma", label: "Somente esta ocorrência" },
        { value: "futuras", label: "Esta e as futuras" },
        { value: "todas", label: "Todas as ocorrências da série" },
      ],
      "Este lançamento faz parte de uma série. O que deseja excluir?",
    );
    if (!escolha) return;
    const ok = await confirm("Confirma a exclusão? Essa ação não pode ser desfeita.", { danger: true });
    if (!ok) return;
    const grupoId = existente.recorrencia.grupoId as string;
    if (escolha === "uma") {
      deleteLancamento(existente.id);
    } else if (escolha === "futuras") {
      deleteLancamentosSerie(grupoId, existente.data);
      deleteLancamento(existente.id);
    } else {
      deleteLancamentosSerie(grupoId);
    }
    await persist(true);
    onClose();
    showToast("Lançamento excluído.");
  }

  function buildLancamentoFromForm(): Lancamento {
    return {
      id: editing ? (lancamentoId as string) : uid("lanc"),
      tipo,
      nome: nome.trim() || (tipo === "transferencia" ? "Transferência" : ""),
      valor: multiCatMode ? multiCatSplits.reduce((s, x) => s + (Number(x.valor) || 0), 0) : valor,
      data,
      hora,
      criadoEm,
      categoriasSplits: multiCatMode ? multiCatSplits.map((s) => ({ categoriaId: s.categoriaId, subcategoriaId: s.subcategoriaId, valor: Number(s.valor) || 0 })) : null,
      contaId,
      cartaoId: tipo === "transferencia" ? null : cartaoId,
      competenciaFatura: tipo !== "transferencia" && cartaoId ? competenciaFatura : null,
      contaDestinoId: tipo === "transferencia" ? contaDestinoId : null,
      categoriasIds: tipo === "transferencia" ? [] : multiCatMode ? [] : categoriasIds,
      tagsIds: tipo === "transferencia" ? [] : tagsIds,
      descricao: descricao.trim(),
      efetivado,
      dataEfetivacao: efetivado ? dataEfetivacao : null,
      grupoPagamento: existente?.grupoPagamento ?? null,
      origemPagamentoGrupo: existente?.origemPagamentoGrupo ?? null,
      recorrencia: toRecorrencia(recorrencia),
    };
  }

  async function handleDuplicar() {
    const lancamentoAtual = buildLancamentoFromForm();
    const copia: Lancamento = {
      ...lancamentoAtual,
      id: uid("lanc"),
      data: todayStr(),
      hora: nowTimeStr(),
      nome: (lancamentoAtual.nome || "") + " (cópia)",
      recorrencia: { ativa: false },
    };
    saveLancamento(copia);
    await persist();
    onClose();
    showToast("Lançamento duplicado.");
  }

  async function handleSave() {
    if (!nome.trim() && tipo !== "transferencia") {
      showToast("Informe um nome para o lançamento.");
      return;
    }
    if (!data) {
      showToast("Informe a data.");
      return;
    }
    if (!multiCatMode && !valor) {
      showToast("Informe um valor maior que zero.");
      return;
    }

    if (tipo === "transferencia") {
      if (!contaId) {
        showToast("Selecione a conta de origem.");
        return;
      }
      if (!contaDestinoId) {
        showToast("Selecione a conta de destino.");
        return;
      }
      if (contaId === contaDestinoId) {
        showToast("Conta de origem e destino devem ser diferentes.");
        return;
      }
    } else {
      if (!contaId) {
        showToast(tipo === "investimento" ? "Cadastre uma conta de investimento primeiro." : "Selecione uma conta.");
        return;
      }
      if (cartaoId === "") {
        showToast("Selecione um cartão de crédito.");
        return;
      }
      if (multiCatMode) {
        if (multiCatSplits.length < 2) {
          showToast("Selecione ao menos 2 categorias para dividir o lançamento.");
          return;
        }
        if (multiCatSplits.some((s) => !s.categoriaId)) {
          showToast("Selecione a categoria em todas as linhas.");
          return;
        }
        if (multiCatSplits.some((s) => !s.subcategoriaId)) {
          showToast("Selecione a subcategoria em todas as linhas.");
          return;
        }
        if (multiCatSplits.every((s) => !s.valor)) {
          showToast("Informe o valor de pelo menos uma categoria.");
          return;
        }
      } else {
        if (!categoriasIds[0]) {
          showToast("Selecione a categoria.");
          return;
        }
        if (!categoriasIds[1]) {
          showToast("Selecione a subcategoria.");
          return;
        }
      }
    }

    const prevRecAntes = existente?.recorrencia.ativa ?? false;
    const deveProcessarParcelamento =
      recorrencia.ativa && recorrencia.tipo === "parcelado" && (!editing || !prevRecAntes || recorrenciaReiniciada);

    let nomeFinal = nome.trim() || (tipo === "transferencia" ? "Transferência" : "");
    let valorFinal = multiCatMode ? multiCatSplits.reduce((s, x) => s + (Number(x.valor) || 0), 0) : valor;
    let splitsFinal = multiCatMode
      ? multiCatSplits.map((s) => ({ categoriaId: s.categoriaId, subcategoriaId: s.subcategoriaId, valor: Number(s.valor) || 0 }))
      : null;
    let horizonteGeracao = 11;
    let parcelaAtualFinal = recorrencia.parcelaAtual;

    if (deveProcessarParcelamento) {
      const total = recorrencia.totalParcelas || 2;
      const inicial = recorrencia.parcelaInicial || 1;
      if (recorrencia.valorTipo === "total") {
        valorFinal = valorFinal / total;
        if (splitsFinal) splitsFinal = splitsFinal.map((s) => ({ ...s, valor: s.valor / total }));
      }
      const nomeBaseSemSufixo = nomeFinal.replace(/\s*\(\d+\/\d+\)\s*$/, "");
      nomeFinal = `${nomeBaseSemSufixo} (${inicial}/${total})`;
      parcelaAtualFinal = inicial;
      horizonteGeracao = total - inicial;
    }

    const grupoIdExistente = editing && existente?.recorrencia.ativa ? existente.recorrencia.grupoId : null;
    const grupoIdFinal = recorrencia.ativa ? grupoIdExistente || uid("rec") : "";

    const recorrenciaFinal: Recorrencia = recorrencia.ativa
      ? {
          ativa: true,
          frequencia: recorrencia.frequencia,
          intervalo: recorrencia.intervalo,
          grupoId: grupoIdFinal,
          tipo: recorrencia.tipo,
          valorTipo: recorrencia.valorTipo,
          totalParcelas: recorrencia.totalParcelas,
          parcelaAtual: parcelaAtualFinal,
          parcelaInicial: recorrencia.parcelaInicial,
          dataTermino: recorrencia.dataTermino,
        }
      : { ativa: false };

    const form: Lancamento = {
      id: editing ? (lancamentoId as string) : uid("lanc"),
      tipo,
      nome: nomeFinal,
      valor: valorFinal,
      data,
      hora,
      criadoEm,
      categoriasSplits: splitsFinal,
      contaId,
      cartaoId: tipo === "transferencia" ? null : cartaoId,
      competenciaFatura: tipo !== "transferencia" && cartaoId ? competenciaFatura : null,
      contaDestinoId: tipo === "transferencia" ? contaDestinoId : null,
      categoriasIds: tipo === "transferencia" ? [] : multiCatMode ? [] : categoriasIds,
      tagsIds: tipo === "transferencia" ? [] : tagsIds,
      descricao: descricao.trim(),
      efetivado,
      dataEfetivacao: efetivado ? dataEfetivacao : null,
      grupoPagamento: existente?.grupoPagamento ?? null,
      origemPagamentoGrupo: existente?.origemPagamentoGrupo ?? null,
      recorrencia: recorrenciaFinal,
    };

    if (editing && existente) {
      const fazPerguntaSerie =
        grupoIdExistente &&
        !efetivadoTocadoManualmente &&
        state.lancamentos.some((l) => l.id !== existente.id && l.recorrencia.ativa && l.recorrencia.grupoId === grupoIdExistente);
      let aplicarATodos = false;
      if (fazPerguntaSerie) {
        const escolha = await askScope(
          "Lançamento recorrente",
          [
            { value: "uma", label: "Somente esta ocorrência" },
            { value: "todas", label: "Todas as ocorrências da série" },
          ],
          "Este lançamento faz parte de uma série. Aplicar esta alteração em:",
        );
        if (!escolha) return;
        aplicarATodos = escolha === "todas";
      }

      saveLancamento(form);

      if (aplicarATodos && grupoIdExistente) {
        updateLancamentosSerie(
          grupoIdExistente,
          {
            nome: form.nome.replace(/\s*\(\d+\/\d+\)\s*$/, ""),
            descricao: form.descricao,
            contaId: form.contaId,
            contaDestinoId: form.contaDestinoId,
            categoriasIds: form.categoriasIds,
            categoriasSplits: form.categoriasSplits,
            tagsIds: form.tagsIds,
            recorrencia: form.recorrencia,
          },
          form.id,
        );
      }

      if (recorrencia.ativa && !prevRecAntes) {
        const novos = gerarOcorrenciasRecorrencia(form, horizonteGeracao);
        if (novos.length) addLancamentos(novos);
      }

      if (prevRecAntes && !recorrencia.ativa && grupoIdExistente) {
        const outrosDaSerie = state.lancamentos.filter(
          (l) => l.id !== existente.id && l.recorrencia.ativa && l.recorrencia.grupoId === grupoIdExistente,
        );
        if (outrosDaSerie.length) {
          const okRemover = await confirm(
            `Este lançamento deixou de ser recorrente. Deseja também excluir as outras ${outrosDaSerie.length} ocorrências desta série?`,
            { danger: true, okLabel: "Excluir as outras" },
          );
          if (okRemover) deleteLancamentosSerie(grupoIdExistente);
        }
      }
    } else {
      saveLancamento(form);
      if (recorrencia.ativa) {
        const novos = gerarOcorrenciasRecorrencia(form, horizonteGeracao);
        if (novos.length) addLancamentos(novos);
      }
    }

    if (tipo !== "transferencia" && categoriasIds[0] && !multiCatMode) {
      updateConfiguracoes({
        lastUsedCategoria: { ...state.configuracoes.lastUsedCategoria, [tipo]: [categoriasIds[0], categoriasIds[1] || null] } as typeof state.configuracoes.lastUsedCategoria,
      });
    }
    if (form.cartaoId) updateConfiguracoes({ lastUsedCartaoId: form.cartaoId });

    await persist();
    onClose();
    showToast("Lançamento salvo.");
  }

  return (
    <Modal
      title={
        <span>
          {editing ? "Editar lançamento" : "Novo lançamento"} <span style={{ color: corTipo }}>- {TIPO_LABEL[tipo]}</span>
        </span>
      }
      onClose={onClose}
      wide
      modalClassName="lanc-modal"
      footer={
        <>
          <div>
            {editing && (
              <button type="button" className="btn btn-delete-lanc" onClick={handleDelete}>
                <span className="tt-icon" style={{ width: 14, height: 14 }}>
                  <Icon name="trash" size={14} />
                </span>
                Excluir
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancelar
            </button>
            {editing && (
              <button type="button" className="btn ghost" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={handleDuplicar}>
                <Icon name="duplicate" size={14} /> Duplicar
              </button>
            )}
            <button type="button" className="btn primary" onClick={handleSave}>
              <Icon name="save" size={14} /> Salvar
            </button>
          </div>
        </>
      }
    >
      <div style={{ height: 16, background: corTipo, margin: "-20px -22px 20px" }} />

      <div className="field-row" style={{ gridTemplateColumns: "1.5fr 0.9fr auto", alignItems: "flex-start" }}>
        <label className="field">
          <span>
            Nome <span className="req-star">*</span>
          </span>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <span className="tt-icon" style={{ position: "absolute", left: 10, color: "var(--gray-400)", pointerEvents: "none" }}>
              <Icon name="search" size={13} />
            </span>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Supermercado, Salário, Aluguel..."
              autoComplete="off"
              style={{ paddingLeft: 32 }}
            />
          </div>
        </label>
        <label className="field">
          <span>
            Valor <span className="req-star">*</span>
          </span>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            {multiCatMode ? (
              <input readOnly value={fmtMoney(valorTotalDisplay)} style={{ paddingRight: 34 }} />
            ) : (
              <>
                <MoneyInput value={valor} onChange={setValor} />
                <div style={{ position: "absolute", right: 2 }}>
                  <MiniCalculator value={valor} onResult={(r) => setValor(round2(Math.abs(r)))} />
                </div>
              </>
            )}
          </div>
          {!multiCatMode && recorrencia.ativa && recorrencia.tipo === "parcelado" && recorrencia.valorTipo === "parcela" && recorrencia.totalParcelas && recorrencia.totalParcelas > 1 ? (
            <div className="mini-note" style={{ marginTop: 2, fontWeight: 600 }}>
              Total: {fmtMoney((valor || 0) * recorrencia.totalParcelas)}
            </div>
          ) : multiCatMode ? (
            <div className="mini-note" style={{ marginTop: 2, fontWeight: 600 }}>
              Soma das categorias
            </div>
          ) : null}
        </label>
        <label className="field" style={{ flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start", gap: 6, flex: "none", whiteSpace: "nowrap" }}>
          <span>Efetivado</span>
          {cartaoId ? (
            <span className="tt-icon" style={{ color: "var(--gray-400)" }} title="Controlado pelo pagamento da fatura do cartão.">
              <Icon name="info" size={15} />
            </span>
          ) : (
            <Switch
              on={efetivado}
              onToggle={() => {
                setEfetivado((v) => !v);
                setEfetivadoTocadoManualmente(true);
                if (!efetivado) setDataEfetivacao(nowLocalIso());
              }}
            />
          )}
        </label>
      </div>

      <div className="field-row" style={{ gridTemplateColumns: "1fr 1.1fr" }}>
        <label className="field">
          <span>
            Data e hora <span className="req-star">*</span>
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="date"
              value={data}
              style={{ flex: 1.3 }}
              onChange={(e) => {
                setData(e.target.value);
                if (cartaoId) {
                  setEfetivado(false);
                } else {
                  const nowEfetivado = e.target.value <= todayStr();
                  setEfetivado(nowEfetivado);
                  if (nowEfetivado && !dataEfetivacao) setDataEfetivacao(nowLocalIso());
                }
              }}
            />
            <input type="time" value={hora} style={{ flex: 1 }} onChange={(e) => setHora(e.target.value)} />
          </div>
        </label>
        <div className="field" style={{ position: "relative" }}>
          <span>Recorrência</span>
          <button
            type="button"
            className="repeat-chip"
            onClick={(e) => {
              e.stopPropagation();
              setRepeatPopoverOpen((v) => !v);
            }}
          >
            <Icon name="repeat" size={16} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{recorrenciaLabel}</span>
            <span className="tt-icon" style={{ marginLeft: "auto", color: "var(--gray-400)" }}>
              <Icon name="detail" size={13} />
            </span>
          </button>
          {repeatPopoverOpen && (
            <RepeatPopover
              recorrencia={recorrencia}
              multiCatMode={multiCatMode}
              onChange={(r, opts) => {
                setRecorrencia(r);
                if (opts?.multiCatOff) setMultiCatMode(false);
                if (opts?.reiniciada) setRecorrenciaReiniciada(true);
              }}
              onClose={() => setRepeatPopoverOpen(false)}
            />
          )}
        </div>
      </div>

      <label className="field">
        Descrição
        <textarea rows={2} placeholder="Detalhes adicionais..." value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </label>

      {tipo !== "transferencia" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1, minWidth: 0, ...(tipo === "despesa" ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } : {}) }}>
            {cartaoId ? (
              <>
                <label className="field">
                  <span>
                    Cartão de crédito <span className="req-star">*</span>
                  </span>
                  <CustomSelect options={cartaoOptions} value={cartaoId} onChange={handleCartaoChange} placeholder="— nenhum —" />
                </label>
                <label className="field">
                  Fatura (mês/ano)
                  <select value={competenciaFatura ?? ""} onChange={(e) => setCompetenciaFatura(e.target.value)}>
                    {competenciaOptions.map((k) => (
                      <option key={k} value={k}>
                        {fmtMonthLabel(new Date(k + "-01T00:00:00"))}
                        {k === cartaoSelAberta ? " (aberta)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <label className="field">
                <span>
                  Conta{tipo === "investimento" ? " de investimento" : ""} <span className="req-star">*</span>
                </span>
                <CustomSelect options={contaOptions} value={contaId} onChange={setContaId} placeholder="Cadastre uma conta" />
              </label>
            )}
          </div>
          {tipo === "despesa" && (
            <label className="field" style={{ flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start", gap: 6, flex: "none", width: 110 }}>
              <span style={{ whiteSpace: "nowrap" }}>Cartão de Crédito</span>
              <Switch on={!!cartaoId} onToggle={handleEhCartaoToggle} />
            </label>
          )}
        </div>
      ) : (
        <div className="field-row">
          <label className="field">
            <span>
              Conta de origem <span className="req-star">*</span>
            </span>
            <CustomSelect options={contaOptions} value={contaId} onChange={setContaId} placeholder="Selecionar" />
          </label>
          <label className="field">
            <span>
              Conta de destino <span className="req-star">*</span>
            </span>
            <CustomSelect options={contaOptions} value={contaDestinoId} onChange={setContaDestinoId} placeholder="Selecionar" />
          </label>
        </div>
      )}

      {(tipo === "entrada" || tipo === "despesa") && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {!multiCatMode ? (
                <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <label className="field">
                    <span>
                      Categoria <span className="req-star">*</span>
                    </span>
                    <CustomSelect options={catOptions} value={catPaiAtual} onChange={pickCategoriaPai} placeholder="Selecionar categoria" />
                  </label>
                  <label className="field">
                    <span>
                      Subcategoria <span className="req-star">*</span>
                    </span>
                    <CustomSelect
                      options={subcatOptions(catPaiAtual)}
                      value={subcatAtual}
                      onChange={(v) => setCategoriasIds([catPaiAtual as string, v])}
                      placeholder={catPaiAtual ? "Selecionar subcategoria" : "Selecione a categoria primeiro"}
                    />
                  </label>
                </div>
              ) : (
                <label className="field" style={{ marginBottom: 0 }}>
                  <span>
                    Categorias e valores <span className="req-star">*</span>
                  </span>
                  <MultiCatRow
                    split={multiCatSplits[0]}
                    catOptions={catOptions}
                    subcatOptions={subcatOptions}
                    onChange={(patch) => updateSplit(0, patch)}
                    onRemove={() => {}}
                    canRemove={false}
                  />
                </label>
              )}
            </div>
            <label className="field" style={{ flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start", gap: 6, flex: "none", width: 110 }}>
              <span style={{ whiteSpace: "nowrap" }}>Multicategoria</span>
              <div style={{ opacity: recorrencia.ativa && recorrencia.tipo !== "parcelado" ? 0.4 : 1, pointerEvents: recorrencia.ativa && recorrencia.tipo !== "parcelado" ? "none" : "auto" }}>
                <Switch on={multiCatMode} onToggle={handleMultiCatToggle} />
              </div>
            </label>
          </div>
          {multiCatMode && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10, paddingRight: 124 }}>
                {multiCatSplits.slice(1).map((s, i0) => {
                  const i = i0 + 1;
                  return (
                    <MultiCatRow
                      key={i}
                      split={s}
                      catOptions={catOptions}
                      subcatOptions={subcatOptions}
                      onChange={(patch) => updateSplit(i, patch)}
                      onRemove={() => setMultiCatSplits((splits) => splits.filter((_, idx) => idx !== i))}
                      canRemove={multiCatSplits.length > 2}
                    />
                  );
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, paddingRight: 124 }}>
                <button type="button" className="btn ghost small" onClick={() => setMultiCatSplits((s) => [...s, { categoriaId: null, subcategoriaId: null, valor: 0 }])}>
                  + Categoria
                </button>
                <div className="mini-note" style={{ margin: 0 }}>
                  Soma das categorias: {fmtMoney(multiCatSplits.reduce((s, x) => s + (Number(x.valor) || 0), 0))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }} />
            </>
          )}
          {recorrencia.ativa && recorrencia.tipo !== "parcelado" && multiCatMode && (
            <p className="mini-note" style={{ margin: "6px 0 16px" }}>
              Multicategoria não disponível para lançamentos recorrentes fixos.
            </p>
          )}
          {!multiCatMode && <div style={{ marginBottom: 16 }} />}
        </>
      )}

      {tipo === "investimento" && (
        <div className="field-row">
          <label className="field">
            <span>
              Categoria <span className="req-star">*</span>
            </span>
            <CustomSelect options={catOptions} value={catPaiAtual} onChange={pickCategoriaPai} placeholder="Selecionar categoria" />
          </label>
          <label className="field">
            <span>
              Subcategoria <span className="req-star">*</span>
            </span>
            <CustomSelect
              options={subcatOptions(catPaiAtual)}
              value={subcatAtual}
              onChange={(v) => setCategoriasIds([catPaiAtual as string, v])}
              placeholder={catPaiAtual ? "Selecionar subcategoria" : "Selecione a categoria primeiro"}
            />
          </label>
        </div>
      )}

      {tipo !== "transferencia" && (
        <div className="field-row">
          <label className="field">
            Tags
            <TagsInput value={tagsIds} onChange={setTagsIds} />
          </label>
        </div>
      )}

      <div style={{ marginTop: 6 }}>
        <button type="button" className="mini-note" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--gray-400)", textDecoration: "underline" }} onClick={() => setOpcoesAvancadasOpen((v) => !v)}>
          {opcoesAvancadasOpen ? "Ocultar opções avançadas" : "Mais opções"}
        </button>
      </div>
      {opcoesAvancadasOpen && (
        <>
          <div className="field-row" style={{ marginTop: 10, gridTemplateColumns: "repeat(4,1fr)" }}>
            {efetivado && !cartaoId && (
              <>
                <label className="field">
                  Data de efetivação
                  <input type="date" value={(dataEfetivacao || nowLocalIso()).slice(0, 10)} onChange={(e) => setDataEfetivacao(e.target.value + "T" + (dataEfetivacao || nowLocalIso()).slice(11, 16))} />
                </label>
                <label className="field">
                  &nbsp;
                  <input type="time" value={(dataEfetivacao || nowLocalIso()).slice(11, 16)} onChange={(e) => setDataEfetivacao((dataEfetivacao || nowLocalIso()).slice(0, 10) + "T" + e.target.value)} />
                </label>
              </>
            )}
            <label className="field">
              Data de lançamento
              <input type="date" value={criadoEm.slice(0, 10)} onChange={(e) => setCriadoEm(e.target.value + "T" + criadoEm.slice(11, 16))} />
            </label>
            <label className="field">
              &nbsp;
              <input type="time" value={criadoEm.slice(11, 16)} onChange={(e) => setCriadoEm(criadoEm.slice(0, 10) + "T" + e.target.value + ":00.000Z")} />
            </label>
          </div>
          <p className="mini-note" style={{ marginTop: -6 }}>
            Data de lançamento é usada para ordenar os lançamentos mais recentes e não altera a data de vencimento nem a de efetivação.
          </p>
        </>
      )}

      {confirmDialog}
      {scopeDialog}
    </Modal>
  );
}

function MultiCatRow({
  split,
  catOptions,
  subcatOptions,
  onChange,
  onRemove,
  canRemove,
}: {
  split: CategoriaSplit;
  catOptions: CustomSelectOption[];
  subcatOptions: (paiId: string | null) => CustomSelectOption[];
  onChange: (patch: Partial<CategoriaSplit>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <div style={{ flex: 1 }}>
        <CustomSelect options={catOptions} value={split.categoriaId} onChange={(v) => onChange({ categoriaId: v, subcategoriaId: null })} placeholder="Categoria" />
      </div>
      <div style={{ flex: 1 }}>
        <CustomSelect
          options={subcatOptions(split.categoriaId)}
          value={split.subcategoriaId}
          onChange={(v) => onChange({ subcategoriaId: v })}
          placeholder={split.categoriaId ? "Subcategoria" : "Selecione a categoria"}
        />
      </div>
      <div style={{ width: 85 }}>
        <MoneyInput value={split.valor} onChange={(v) => onChange({ valor: v })} />
      </div>
      <button type="button" className="icon-btn" disabled={!canRemove} style={!canRemove ? { opacity: 0.3 } : undefined} onClick={onRemove}>
        <Icon name="trash" size={14} />
      </button>
    </div>
  );
}

function RepeatPopover({
  recorrencia,
  multiCatMode,
  onChange,
  onClose,
}: {
  recorrencia: RecorrenciaForm;
  multiCatMode: boolean;
  onChange: (r: RecorrenciaForm, opts?: { multiCatOff?: boolean; reiniciada?: boolean }) => void;
  onClose: () => void;
}) {
  function setTipoRecorrencia(v: string) {
    if (v === "nao_recorrente") {
      onChange(recorrenciaPadrao());
    } else if (v === "parcelado") {
      onChange({ ...recorrencia, ativa: true, tipo: "parcelado" }, { reiniciada: true });
    } else {
      onChange({ ...recorrencia, ativa: true, tipo: "fixo", frequencia: "mensal" }, { multiCatOff: true });
    }
  }

  const unidadeLabel = (() => {
    const opt = FREQ_OPTIONS.find((f) => f.value === recorrencia.frequencia || (f.value === "mes" && (recorrencia.frequencia === "mensal" || !recorrencia.frequencia)) || (f.value === "ano" && recorrencia.frequencia === "anual") || (f.value === "dia" && recorrencia.frequencia === "diario"));
    return (recorrencia.intervalo || 1) > 1 ? opt?.labelPlural : opt?.labelSingular;
  })();

  return (
    <div className="color-popover repeat-popover open" style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: 290 }} onClick={(e) => e.stopPropagation()}>
      <label className="field" style={{ marginBottom: 12 }}>
        Recorrência
        <select
          value={!recorrencia.ativa ? "nao_recorrente" : recorrencia.tipo === "parcelado" ? "parcelado" : "fixo_mensal"}
          onChange={(e) => setTipoRecorrencia(e.target.value)}
        >
          <option value="nao_recorrente">Não recorrente</option>
          <option value="parcelado">Parcelado</option>
          <option value="fixo_mensal">Fixo mensal</option>
        </select>
      </label>
      {recorrencia.ativa && recorrencia.tipo === "parcelado" && (
        <>
          <div className="field-row" style={{ marginBottom: 8 }}>
            <label className="field" style={{ marginBottom: 0 }}>
              Parcela inicial
              <input type="number" min={1} value={recorrencia.parcelaInicial || 1} onChange={(e) => onChange({ ...recorrencia, parcelaInicial: Number(e.target.value) || 1 })} />
            </label>
            <label className="field" style={{ marginBottom: 0 }}>
              Nº de parcelas
              <input type="number" min={2} value={recorrencia.totalParcelas ?? 2} onChange={(e) => onChange({ ...recorrencia, totalParcelas: Number(e.target.value) || 2 })} />
            </label>
          </div>
          <label className="field" style={{ marginBottom: 8 }}>
            A cada
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" min={1} value={recorrencia.intervalo || 1} style={{ width: 70 }} onChange={(e) => onChange({ ...recorrencia, intervalo: Number(e.target.value) || 1 })} />
              <select
                style={{ flex: 1 }}
                value={recorrencia.frequencia === "diario" ? "dia" : recorrencia.frequencia === "anual" ? "ano" : recorrencia.frequencia === "mensal" || !recorrencia.frequencia ? "mes" : recorrencia.frequencia}
                onChange={(e) => onChange({ ...recorrencia, frequencia: e.target.value })}
              >
                {FREQ_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {(recorrencia.intervalo || 1) > 1 ? f.labelPlural : f.labelSingular}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <label className="field" style={{ marginBottom: 4 }}>
            Valor é
            <div className="pill-select">
              <button type="button" className={`pill-opt sm${recorrencia.valorTipo === "total" ? " active" : ""}`} onClick={() => onChange({ ...recorrencia, valorTipo: "total" })}>
                Total
              </button>
              <button type="button" className={`pill-opt sm${recorrencia.valorTipo === "parcela" ? " active" : ""}`} onClick={() => onChange({ ...recorrencia, valorTipo: "parcela" })}>
                Parcela
              </button>
            </div>
          </label>
          {multiCatMode && (
            <p className="mini-note" style={{ margin: "0 0 10px" }}>
              {recorrencia.valorTipo === "total" ? "Cada categoria será dividida proporcionalmente entre as parcelas." : "O valor de cada categoria já é o valor por parcela."}
            </p>
          )}
        </>
      )}
      {recorrencia.ativa && recorrencia.tipo === "fixo" && (
        <>
          <label className="field" style={{ marginBottom: 10 }}>
            Data de término (opcional)
            <input type="date" value={recorrencia.dataTermino || ""} onChange={(e) => onChange({ ...recorrencia, dataTermino: e.target.value || null })} />
          </label>
          <p className="mini-note" style={{ margin: "0 0 10px" }}>
            Este valor se repete todo mês{recorrencia.dataTermino ? ` até ${fmtDate(recorrencia.dataTermino)}` : ", sem data para terminar"}.
          </p>
        </>
      )}
      <button type="button" className="btn primary small" style={{ width: "100%", justifyContent: "center" }} onClick={onClose}>
        OK
      </button>
      <div style={{ display: "none" }}>{unidadeLabel}</div>
    </div>
  );
}
